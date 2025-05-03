import { openai } from '@ai-sdk/openai'

export const aiSettings = {
  model: openai('gpt-4.1-mini'),
  temperature: 0.3,
  maxTokens: 1000
}
