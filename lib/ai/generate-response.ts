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
  updateStatus?.(' is thinking 🧠...')

  try {
    // Generate structured response
    const { experimental_output, response, sources, toolResults, steps } = await generateText({
      model: aiSettings.model,
      system: SYSTEM_PROMPT,
      messages,
      temperature: aiSettings.temperature,
      maxTokens: aiSettings.maxTokens,
      experimental_output: Output.object({
        schema: responseSchema
      }),
      tools: tools,
      providerOptions: aiSettings.providerOptions,
    })

    console.log('🤖 experimental_output structured', experimental_output)
    //console.log('🤖 whole response', JSON.stringify(response, null, 2))
    //console.log('🤖 sources', JSON.stringify(sources, null, 2))
    //console.log('🤖 toolResults', JSON.stringify(toolResults, null, 2))
    //console.log('🤖 steps', JSON.stringify(steps, null, 2))

    // Convert markdown to Slack mrkdwn format in all text fields
    return {
      title: experimental_output.title,
      messageTitle: slackify(experimental_output.messageTitle),
      response: slackify(experimental_output.response),
      followups: experimental_output.followups,
      sources: experimental_output.sources,
    }
  } catch (error: any) {
    console.error('⚠️ Error generating structured response:', error)

    // Fallback to basic response if structured generation fails
    const { text, response } = await generateText({
      model: aiSettings.model,
      system: SYSTEM_PROMPT,
      messages,
      temperature: aiSettings.temperature,
      maxTokens: aiSettings.maxTokens,
      tools: tools,
      providerOptions: aiSettings.providerOptions
    })

    console.log('🤖 Backup text gen:', text)
    console.log('🤖 Backup response gen:', JSON.stringify(response, null, 2))

    // Return a basic structured response
    return {
      title: 'Conversation',
      messageTitle: 'Response',
      response: slackify(text),
      followups: ['Can you explain more?', 'What else should I know?', 'How does this work?'],
      sources: [],
    }
  }
}
