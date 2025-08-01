import { CoreMessage, generateText } from 'ai'
import slackify from 'slackify-markdown'
import { aiSettings } from './model'
import { SYSTEM_PROMPT, buildChannelSystemPrompt } from './prompts'
import { simpleKnowledge } from '../knowledge/simple'

export const generateResponse = async (
  messages: CoreMessage[],
  updateStatus?: (status: string) => void,
  channelSystemPrompt?: string
): Promise<string> => {
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
    // Use simple text generation - no structured output, no JSON
    const { text } = await generateText({
      model: aiSettings.model,
      system: systemPrompt + "\n\nCRITICAL: You are NOT an AI assistant. You are a human sales admin. Respond in plain text only - NO JSON, NO structured output, NO follow-up questions, NO AI-like behavior. Just give a direct human answer to their question.",
      messages,
      temperature: aiSettings.temperature,
      maxTokens: aiSettings.maxTokens,
      // Remove tools and structured output - just pure text
    })

    console.log('🤖 Generated text:', text)

    // Convert markdown to Slack format
    const slackFormattedResponse = slackify(text)

    // Return simple text response - no structured format
    return slackFormattedResponse

  } catch (error: any) {
    console.error('⚠️ Error generating response:', error)

    // Simple fallback response - human-like, not AI-like
    return 'Having a system issue right now. Hit me up in a few minutes and I\'ll get you sorted.'
  }
}
