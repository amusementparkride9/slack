import { openai, OpenAIResponsesProviderOptions } from '@ai-sdk/openai'
import { jsonRepairMiddleware } from './middleware'
import { wrapLanguageModel } from 'ai'

export const aiSettings = {
  model: wrapLanguageModel({
    model: openai.responses('gpt-4.1'),
    middleware: [jsonRepairMiddleware]
  }),
  temperature: 0.3,
  maxTokens: 5000,
  providerOptions: {
    openai: {
      parallelToolCalls: false,
      store: false,
      strictSchemas: true,
    } satisfies OpenAIResponsesProviderOptions,
  },
}
