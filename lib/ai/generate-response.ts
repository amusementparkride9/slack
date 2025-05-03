import { CoreMessage, generateText, Output } from 'ai'
import { aiSettings } from './model'
import { tools } from './tools'
import { SYSTEM_PROMPT } from './prompts'
import { markdownToMrkdwn } from '../utils/markdown'
import { responseSchema, StructuredResponse } from './schemas'

export const generateResponse = async (
  messages: CoreMessage[],
  updateStatus?: (status: string) => void
): Promise<StructuredResponse> => {
  updateStatus?.('is writing your response...')

  try {
    // Generate structured response
    const { experimental_output } = await generateText({
      model: aiSettings.model,
      system: SYSTEM_PROMPT,
      messages,
      temperature: aiSettings.temperature,
      maxTokens: aiSettings.maxTokens,
      experimental_output: Output.object({
        schema: responseSchema
      }),
      tools: tools
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
      model: aiSettings.model,
      system: SYSTEM_PROMPT,
      messages,
      temperature: aiSettings.temperature,
      maxTokens: aiSettings.maxTokens
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
