import 'server-only'
import type { z } from 'zod'

export type AiKind = 'daily_insight' | 'repair_insight' | 'weekly_summary' | 'relationship_manual'

export type ProviderName = 'mock' | 'openai' | 'anthropic'

/**
 * Provider-agnostic structured generation request. `prompt` serves the real
 * LLM providers; `context` carries the already-visibility-filtered structured
 * input, which the deterministic mock consumes directly.
 */
export interface StructuredRequest<T> {
  kind: AiKind
  schema: z.ZodType<T>
  system: string
  prompt: string
  context: unknown
  timeoutMs: number
}

export interface StructuredResult<T> {
  object: T
  model: string
  inputTokens: number | null
  outputTokens: number | null
}

export interface AiProvider {
  readonly name: ProviderName
  readonly model: string
  generateStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>>
}
