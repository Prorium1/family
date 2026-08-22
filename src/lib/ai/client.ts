import 'server-only'
import { createHash } from 'node:crypto'
import { serverEnv } from '@/config/server-env'
import { outputViolatesPrinciples } from '@/lib/security/safety-checker'
import type { AiProvider, StructuredRequest, StructuredResult } from './provider'
import { createMockProvider } from './providers/mock'

/**
 * Generation pipeline (spec §5, §30): primary provider with retries →
 * fallback provider → typed failure. Output is re-validated against the zod
 * schema and screened against the non-negotiable principles (§4-1/4-2) —
 * a scoring or verdict-style response counts as a failed attempt.
 */

export class AiGenerationError extends Error {
  constructor(
    message: string,
    readonly code: 'provider_failed' | 'schema_invalid' | 'principle_violation' | 'timeout',
  ) {
    super(message)
    this.name = 'AiGenerationError'
  }
}

export interface GenerationOutcome<T> extends StructuredResult<T> {
  provider: string
  attempts: number
  durationMs: number
}

function buildProvider(name: 'mock' | 'openai' | 'anthropic', model: string): AiProvider {
  if (name === 'mock') return createMockProvider()
  // Lazy import so demo/mock deployments never load the SDK providers.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createLlmProvider } = require('./providers/llm') as typeof import('./providers/llm')
  return createLlmProvider(name, model)
}

export function getProviderChain(): AiProvider[] {
  if (serverEnv.AI_MOCK_MODE) return [createMockProvider()]
  const chain: AiProvider[] = [buildProvider(serverEnv.AI_PROVIDER, serverEnv.AI_MODEL)]
  if (serverEnv.AI_FALLBACK_PROVIDER !== serverEnv.AI_PROVIDER) {
    chain.push(buildProvider(serverEnv.AI_FALLBACK_PROVIDER, serverEnv.AI_FALLBACK_MODEL))
  }
  return chain
}

async function attemptOnce<T>(
  provider: AiProvider,
  request: StructuredRequest<T>,
): Promise<StructuredResult<T>> {
  const result = await provider.generateStructured(request)
  const parsed = request.schema.safeParse(result.object)
  if (!parsed.success) {
    throw new AiGenerationError('schema validation failed', 'schema_invalid')
  }
  if (outputViolatesPrinciples(JSON.stringify(parsed.data))) {
    throw new AiGenerationError('output violated product principles', 'principle_violation')
  }
  return { ...result, object: parsed.data }
}

export async function generateStructured<T>(
  request: Omit<StructuredRequest<T>, 'timeoutMs'> & { timeoutMs?: number },
  providers: AiProvider[] = getProviderChain(),
): Promise<GenerationOutcome<T>> {
  const startedAt = Date.now()
  const fullRequest: StructuredRequest<T> = {
    ...request,
    timeoutMs: request.timeoutMs ?? serverEnv.AI_REQUEST_TIMEOUT_MS,
  }
  let attempts = 0
  let lastError: unknown = null

  for (const provider of providers) {
    for (let retry = 0; retry <= serverEnv.AI_MAX_RETRIES; retry++) {
      attempts++
      try {
        const result = await attemptOnce(provider, fullRequest)
        return {
          ...result,
          provider: provider.name,
          attempts,
          durationMs: Date.now() - startedAt,
        }
      } catch (error) {
        lastError = error
      }
    }
  }

  throw lastError instanceof AiGenerationError
    ? lastError
    : new AiGenerationError(
        lastError instanceof Error ? lastError.message : 'generation failed',
        'provider_failed',
      )
}

/** Stable content hash for dedupe / idempotency (spec §10, §30). */
export function inputHashOf(payload: unknown): string {
  return createHash('sha256').update(canonicalJson(payload)).digest('hex')
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`)
  return `{${entries.join(',')}}`
}
