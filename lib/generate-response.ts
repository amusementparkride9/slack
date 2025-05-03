import { CoreMessage, generateText, Output } from 'ai'
import { SMALL_MODEL } from './ai/model'
import { SYSTEM_PROMPT } from './ai/prompts'
import { markdownToMrkdwn } from './utils/markdown'
import { z } from 'zod'

// Define the response schema
const responseSchema = z.object({
  title: z
    .string()
    .describe('A concise, engaging title for this conversation based on the entire conversation'),
  messageTitle: z.string().describe('A brief, relevant title for your response'),
  response: z.string().describe('Detailed response to the user query, formatted with markdown'),
  followups: z
    .array(z.string())
    .length(3)
    .describe('Three natural follow-up questions or requests the user might have')
})

// Type for structured response
export type StructuredResponse = z.infer<typeof responseSchema>

export const generateResponse = async (
  messages: CoreMessage[],
  updateStatus?: (status: string) => void
): Promise<StructuredResponse> => {
  updateStatus?.('is writing your response...')

  try {
    // Generate structured response
    const { experimental_output } = await generateText({
      model: SMALL_MODEL,
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.3,
      maxTokens: 1500,
      experimental_output: Output.object({
        schema: responseSchema
      })
    })

    // Convert markdown to Slack mrkdwn format in all text fields
    return {
      title: experimental_output.title,
      messageTitle: markdownToMrkdwn(experimental_output.messageTitle),
      response: markdownToMrkdwn(experimental_output.response),
      followups: experimental_output.followups
    }
  } catch (error) {
    console.error('Error generating structured response:', error)

    // Fallback to basic response if structured generation fails
    const { text } = await generateText({
      model: SMALL_MODEL,
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.3,
      maxTokens: 1000
    })

    // Return a basic structured response
    return {
      title: 'Conversation',
      messageTitle: 'Response',
      response: markdownToMrkdwn(text),
      followups: ['Can you explain more?', 'What else should I know?', 'How does this work?']
    }
  }
}
