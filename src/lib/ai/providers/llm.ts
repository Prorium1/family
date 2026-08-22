import 'server-only'
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { serverEnv } from '@/config/server-env'
import type { AiProvider, ProviderName, StructuredRequest, StructuredResult } from '../provider'

/**
 * Real LLM providers behind the Vercel AI SDK. Vendor-neutral by design
 * (spec §5): the provider + model come from env, and adding a vendor means
 * adding a case here — nothing else in the app changes.
 */

function resolveModel(name: Exclude<ProviderName, 'mock'>, modelId: string) {
  switch (name) {
    case 'openai': {
      const openai = createOpenAI({ apiKey: serverEnv.OPENAI_API_KEY })
      return openai(modelId || 'gpt-4.1-mini')
    }
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY })
      return anthropic(modelId || 'claude-sonnet-4-5')
    }
  }
}

export function createLlmProvider(
  name: Exclude<ProviderName, 'mock'>,
  modelId: string,
): AiProvider {
  const model = resolveModel(name, modelId)
  return {
    name,
    model: modelId,
    async generateStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>> {
      const result = await generateObject({
        model,
        schema: request.schema,
        system: request.system,
        prompt: request.prompt,
        abortSignal: AbortSignal.timeout(request.timeoutMs),
      })
      return {
        object: request.schema.parse(result.object),
        model: modelId,
        inputTokens: result.usage?.inputTokens ?? null,
        outputTokens: result.usage?.outputTokens ?? null,
      }
    },
  }
}
