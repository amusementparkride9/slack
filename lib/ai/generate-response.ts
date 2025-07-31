import { CoreMessage, generateText, Output } from 'ai'
import slackify from 'slackify-markdown'
import { aiSettings } from './model'
import { tools } from './tools'
import { SYSTEM_PROMPT, buildChannelSystemPrompt } from './prompts'
import { simpleKnowledge } from '../knowledge/simple'

import { responseSchema, StructuredResponse } from './schemas'

export const generateResponse = async (
  messages: CoreMessage[],
  updateStatus?: (status: string) => void,
  channelSystemPrompt?: string
): Promise<StructuredResponse> => {
  updateStatus?.(' is thinking 🧠...')

  // Extract user query from the last message for knowledge search
  const lastMessage = messages[messages.length - 1]
  const userQuery = lastMessage?.content?.toString() || ''

  // Search knowledge base for relevant information
  updateStatus?.(' searching knowledge base 📚...')
  const relevantKnowledge = simpleKnowledge.searchKnowledge(userQuery)
  const personaInstructions = simpleKnowledge.getPersonaInstructions()
  const systemInstructions = simpleKnowledge.getSystemInstructions()
  
  // Build comprehensive system prompt
  let systemPrompt = SYSTEM_PROMPT
  
  // Add persona (character/personality)
  if (personaInstructions) {
    systemPrompt += `\n\n**YOUR PERSONA & ROLE:**\n${personaInstructions}`
  }
  
  // Add system instructions (how to behave)
  if (systemInstructions) {
    systemPrompt += `\n\n**SYSTEM INSTRUCTIONS:**\n${systemInstructions}`
  }
  
  // Add relevant knowledge context
  if (relevantKnowledge) {
    systemPrompt += `\n\n**RELEVANT KNOWLEDGE BASE:**\n${relevantKnowledge}\n\nUse this knowledge to provide accurate, specific answers. Always prioritize information from the knowledge base.`
  }
  
  // Add channel-specific instructions if provided
  if (channelSystemPrompt) {
    systemPrompt = buildChannelSystemPrompt(systemPrompt, channelSystemPrompt)
  }

  try {
    // Generate structured response
    const { experimental_output, response, sources, toolResults, steps } = await generateText({
      model: aiSettings.model,
      system: systemPrompt,
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
      system: systemPrompt,
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
