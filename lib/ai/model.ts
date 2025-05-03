import { openai, OpenAIResponsesProviderOptions } from '@ai-sdk/openai'

export const aiSettings = {
  model: openai.responses('gpt-4.1'),
  temperature: 0.3,
  maxTokens: 1000,
  providerOptions: {
    openai: {
      parallelToolCalls: false,
      store: false,
      strictSchemas: true,
    } satisfies OpenAIResponsesProviderOptions,
  },
}
