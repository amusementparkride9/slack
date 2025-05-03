import { z } from 'zod'

// Define the response schema
export const responseSchema = z.object({
    title: z
      .string()
      .describe('A concise, engaging title for this conversation based on the entire conversation'),
    messageTitle: z.string().describe('A brief, relevant title for your response'),
    response: z.string().describe('Detailed response to the user query, formatted with markdown'),
    followups: z
      .array(z.string())
      .describe('Three natural follow-up questions or requests the user might have'),
    sources: z
      .array(
        z.object({
          url: z.string().describe('The URL of the source'),
          title: z.string().describe('The title or name of the source')
        })
      )
      .describe('List of sources with URLs used to answer the user query').nullable(),
  })
  
  // Type for structured response
export type StructuredResponse = z.infer<typeof responseSchema>