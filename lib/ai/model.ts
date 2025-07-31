import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { jsonRepairMiddleware } from './middleware'
import { wrapLanguageModel } from 'ai'

// Initialize Google AI with API key
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
})

export const aiSettings = {
  model: wrapLanguageModel({
    model: google('gemini-2.5-pro'),
    middleware: [jsonRepairMiddleware]
  }),
  temperature: 0.3,
  maxTokens: 5000,
  providerOptions: {
    google: {
      // Google-specific options
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT', 
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    }
  },
}
