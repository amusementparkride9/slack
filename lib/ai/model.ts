import { openai } from '@ai-sdk/openai'

// Export the model for use in generate-response.ts
export const SMALL_MODEL = openai('gpt-4.1-mini')

export const aiSettings = {
  model: SMALL_MODEL,
  temperature: 0.3,
  maxTokens: 1000
}
