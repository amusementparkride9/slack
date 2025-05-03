import { CoreMessage, generateText, Output } from 'ai'
import slackify from 'slackify-markdown'
import { aiSettings } from './model'
import { tools } from './tools'
import { SYSTEM_PROMPT } from './prompts'

import { responseSchema, StructuredResponse } from './schemas'

export const generateResponse = async (
  messages: CoreMessage[],
  updateStatus?: (status: string) => void
): Promise<StructuredResponse> => {
  updateStatus?.('is writing your response...')

  try {
    // Generate structured response
    const { experimental_output, response } = await generateText({
      model: aiSettings.model,
      system: SYSTEM_PROMPT,
      messages,
      temperature: aiSettings.temperature,
      maxTokens: aiSettings.maxTokens,
      experimental_output: Output.object({
        schema: responseSchema
      }),
      tools: tools,
      providerOptions: aiSettings.providerOptions
    })

    console.log('🤖 experimental_output structured', experimental_output)
    console.log('🤖 whole response', JSON.stringify(response, null, 2))

    // Convert markdown to Slack mrkdwn format in all text fields
    return {
      title: experimental_output.title,
      messageTitle: slackify(experimental_output.messageTitle),
      response: slackify(experimental_output.response),
      followups: experimental_output.followups
    }
  } catch (error) {
    console.error('⚠️ Error generating structured response:', error)

    // Fallback to basic response if structured generation fails
    const { text } = await generateText({
      model: aiSettings.model,
      system: SYSTEM_PROMPT,
      messages,
      temperature: aiSettings.temperature,
      maxTokens: aiSettings.maxTokens,
      tools: tools,
      providerOptions: aiSettings.providerOptions
    })

    console.log('🤖 Backup text gen:', text)

    // Return a basic structured response
    return {
      title: 'Conversation',
      messageTitle: 'Response',
      response: slackify(text),
      followups: ['Can you explain more?', 'What else should I know?', 'How does this work?']
    }
  }
}
