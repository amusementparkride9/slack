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
      system: systemPrompt + "\n\nCRITICAL INSTRUCTIONS:\n• You are NOT an AI assistant. You are a human sales admin.\n• Respond ONLY with plain conversational text - NO JSON, NO structured data, NO objects.\n• NEVER include titles, messageTitle, response fields, or follow-up questions.\n• NEVER format responses like: {\"title\": \"...\", \"response\": \"...\"}.\n• Just write a normal human response as if you're texting a colleague.\n• ALWAYS use USD currency with dollar sign ($) - NEVER use euro (€) or other currency symbols.\n• Be concise and direct like you're texting a colleague.\n• Example good response: 'Xfinity has three tiers: Bronze ($35-60), Silver ($80-110), Gold ($100-150). Your rate depends on weekly volume.'\n• Example BAD response: '{\"title\": \"Commission Info\", \"response\": \"...\", \"questions\": [...]}'\n\nRESPOND WITH PLAIN TEXT ONLY:",
      messages,
      temperature: aiSettings.temperature,
      maxTokens: aiSettings.maxTokens,
      // Remove tools and structured output - just pure text
    })

    console.log('🤖 Raw AI response:', text)

    // If the AI returned JSON despite instructions, extract just the text content
    let cleanedText = text
    try {
      // Check if response looks like JSON and extract the actual content
      if (text.trim().startsWith('{') && text.trim().includes('"response"')) {
        const parsed = JSON.parse(text)
        if (parsed.response) {
          cleanedText = parsed.response
          console.log('⚠️ AI returned JSON despite instructions, extracted text content')
        }
      }
    } catch (e) {
      // Not JSON, use as-is
      cleanedText = text
    }

    // Convert markdown to Slack format and ensure USD currency formatting
    let slackFormattedResponse = slackify(cleanedText)
    
    // Replace any euro symbols with dollar signs (in case the AI model uses them)
    slackFormattedResponse = slackFormattedResponse.replace(/€/g, '$')
    
    console.log('✅ Final response:', slackFormattedResponse)

    // Return simple text response - no structured format
    return slackFormattedResponse

  } catch (error: any) {
    console.error('⚠️ Error generating response:', error)

    // Simple fallback response - human-like, not AI-like
    return 'Having a system issue right now. Hit me up in a few minutes and I\'ll get you sorted.'
  }
}
