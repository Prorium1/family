import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto'
import { serverEnv } from '@/config/server-env'

/**
 * Envelope encryption for the columns that hold what two people actually
 * wrote (docs/SECURITY.md §11).
 *
 * Row level security decides who may *ask* for a row. This decides what a row
 * is worth once someone has it anyway — a stolen backup, a database console,
 * an infrastructure operator at the hosting provider. The key lives in the
 * application's environment and never in the database, so possessing the data
 * is not the same as being able to read it.
 *
 * What this does NOT protect against, stated plainly: whoever can deploy this
 * application holds the key and can decrypt. Real end-to-end encryption would
 * fix that and would also make the AI — the whole point of the product —
 * impossible, so the honest answer is this layer plus access discipline.
 *
 * Format: `v1.<iv>.<tag>.<ciphertext>`, all base64url. AES-256-GCM, with the
 * field's name as additional authenticated data so a ciphertext cannot be
 * moved from one column to another.
 */

const PREFIX = 'v1'
const IV_BYTES = 12

function keyFrom(raw: string): Buffer | null {
  if (!raw) return null
  const key = Buffer.from(raw, 'base64')
  return key.length === 32 ? key : null
}

/** Every key we may decrypt with: the current one first, then the previous. */
function decryptionKeys(): Buffer[] {
  return [keyFrom(serverEnv.DATA_ENCRYPTION_KEY), keyFrom(serverEnv.DATA_ENCRYPTION_KEY_PREVIOUS)]
    .filter((k): k is Buffer => k !== null)
}

export function encryptionEnabled(): boolean {
  return keyFrom(serverEnv.DATA_ENCRYPTION_KEY) !== null
}

export function isSealed(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(`${PREFIX}.`)
}

/**
 * Encrypt one field. Without a key configured the value passes through
 * untouched — that is how demo mode and local development run with no
 * secrets, and `config/server-env.ts` refuses to boot a real deployment
 * without one.
 */
export function sealText(plain: string, field: string): string {
  const key = keyFrom(serverEnv.DATA_ENCRYPTION_KEY)
  if (!key) return plain
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  cipher.setAAD(Buffer.from(field, 'utf8'))
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [
    PREFIX,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    body.toString('base64url'),
  ].join('.')
}

/**
 * Decrypt one field. Anything not written by `sealText` is returned as it is,
 * so rows written before encryption was switched on keep working and a
 * migration is never required to read them.
 */
export function openText(stored: string, field: string): string {
  if (!isSealed(stored)) return stored
  const [, iv, tag, body] = stored.split('.')
  for (const key of decryptionKeys()) {
    try {
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'))
      decipher.setAAD(Buffer.from(field, 'utf8'))
      decipher.setAuthTag(Buffer.from(tag, 'base64url'))
      return Buffer.concat([
        decipher.update(Buffer.from(body, 'base64url')),
        decipher.final(),
      ]).toString('utf8')
    } catch {
      // wrong key, or the value was tampered with — try the next key
    }
  }
  throw new Error(`unable to decrypt ${field}: no configured key matches`)
}

/** Same, for a jsonb column. The stored value becomes a JSON string. */
export function sealJson(value: unknown, field: string): unknown {
  if (!encryptionEnabled()) return value
  return sealText(JSON.stringify(value ?? null), field)
}

export function openJson<T>(stored: unknown, field: string): T {
  if (!isSealed(stored)) return stored as T
  return JSON.parse(openText(stored, field)) as T
}

/** Constant-time compare, used by tests that assert nothing leaked. */
export function looksLikePlaintext(stored: string, plain: string): boolean {
  const a = Buffer.from(stored)
  const b = Buffer.from(plain)
  return a.length === b.length && timingSafeEqual(a, b)
}
