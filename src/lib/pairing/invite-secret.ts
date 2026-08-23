/**
 * One entry point for "whatever the partner has in their hand".
 *
 * A person arriving at the pairing screen may hold any of these:
 *   - a full invite link           https://…/join/AbC-123_xyz
 *   - a link with a query token    https://…/pair?token=AbC-123_xyz
 *   - the raw token
 *   - the 6-digit code, typed with spaces, a hyphen or a 「・」
 *   - the same code in full-width digits (a Japanese IME does this by itself)
 *
 * The scanner, the paste field and the keypad all funnel through here, so a
 * pasted link works exactly as well as a typed code — the person should not
 * have to know which of the two they were given (spec §7).
 */

/** Full-width digits arrive from Japanese IMEs; treat them as digits. */
function toAsciiDigits(value: string): string {
  return value.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
}

export function normalizeInviteSecret(raw: string): string {
  const input = toAsciiDigits(raw.trim())
  if (!input) return ''

  // A link, in any of the shapes we hand out.
  const joinIndex = input.indexOf('/join/')
  if (joinIndex >= 0) {
    const token = input.slice(joinIndex + '/join/'.length).split(/[?#/\s]/)[0]
    if (token) return token
  }
  const tokenParam = input.match(/[?&]token=([^&#\s]+)/)
  if (tokenParam) return decodeURIComponent(tokenParam[1])

  // A 6-digit code, however it was written: 123 456 / 123-456 / 123・456
  const digitsOnly = input.replace(/[\s　·・.\-–—_]/g, '')
  if (/^\d{6}$/.test(digitsOnly)) return digitsOnly

  // Anything else is passed through untouched: it is either a raw token or
  // something the server will reject. Never guess on the person's behalf.
  return input
}

/**
 * Whether this is worth sending to the server at all.
 *
 * Worth being strict here: a wrong secret counts as a failed attempt against
 * every live invitation, and enough failures revoke them. Someone pasting the
 * wrong URL should be told so on their own screen, not cost a real couple
 * their invitation. A token is base64url and a code is digits, so anything
 * outside that alphabet — a stray link above all — never reaches the server.
 */
export function looksLikeInviteSecret(raw: string): boolean {
  return /^[A-Za-z0-9_-]{6,64}$/.test(normalizeInviteSecret(raw))
}

/** 6-digit codes are read aloud in threes — 123・456. */
export function formatInviteCode(code: string): string {
  return /^\d{6}$/.test(code) ? `${code.slice(0, 3)}・${code.slice(3)}` : code
}
