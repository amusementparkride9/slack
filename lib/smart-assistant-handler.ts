import { Assistant } from '@slack/bolt'

import { generateResponse } from './ai/generate-response'
import { WELCOME_MESSAGE } from './ai/prompts'
import { getThread, getBotId } from './bolt-app'
import { truncate } from './utils/truncate'
import { 
  getChannelInfo, 
  isManagedChannel, 
  isBotOnlyChannel, 
  getChannelSystemPrompt, 
  getChannelWelcomeMessage, 
  getChannelSuggestedPrompts 
} from './channel-config'

// Smart conversation tracking
interface ConversationContext {
  lastActivity: Date
  participants: Set<string>
  initiated: boolean
}

const activeConversations = new Map<string, ConversationContext>()

// Clean up expired conversations periodically
setInterval(() => {
  const now = Date.now()
  const oneHour = 60 * 60 * 1000
  
  for (const [key, conv] of activeConversations.entries()) {
    if (now - conv.lastActivity.getTime() > oneHour) {
      activeConversations.delete(key)
    }
  }
}, 10 * 60 * 1000) // Clean up every 10 minutes

// Smart engagement function
async function shouldBotRespond(msg: any, botUserId: string, channel: string, thread_ts?: string): Promise<boolean> {
  const messageText = msg.text?.toLowerCase() || ''
  const conversationKey = `${channel}-${thread_ts || 'main'}`
  
  // Always respond to direct mentions
  if (messageText.includes(`<@${botUserId}>`)) {
    // Mark this as an active conversation
    activeConversations.set(conversationKey, {
      lastActivity: new Date(),
      participants: new Set([msg.user]),
      initiated: true
    })
    console.log(`Bot mentioned - starting conversation: ${conversationKey}`)
    return true
  }

  // Check if this is part of an active conversation
  const activeConv = activeConversations.get(conversationKey)
  if (activeConv && activeConv.initiated) {
    // Continue conversation if within time window (30 minutes)
    const timeSinceLastActivity = Date.now() - activeConv.lastActivity.getTime()
    const thirtyMinutes = 30 * 60 * 1000
    
    if (timeSinceLastActivity < thirtyMinutes) {
      // Update activity and add participant
      activeConv.lastActivity = new Date()
      activeConv.participants.add(msg.user)
      console.log(`Continuing active conversation: ${conversationKey}`)
      return true
    } else {
      // Conversation expired, remove it
      activeConversations.delete(conversationKey)
      console.log(`Conversation expired: ${conversationKey}`)
    }
  }

  // Check for keywords that suggest the bot should engage
  const engagementKeywords = [
    // Commission & Pay related
    'commission', 'pay', 'salary', 'bonus', 'earning', 'calculate', 'how much',
    'weekly pay', 'monthly bonus', 'vas', 'attachment', 'tier', 'platinum', 'gold', 'silver', 'bronze',
    
    // Sales & Products  
    'sale', 'sales', 'selling', 'client', 'customer', 'deal', 'close', 'closing',
    'xfinity', 'frontier', 'spectrum', 'optimum', 'metronet', 'brightspeed', 'kinetic', 'earthlink', 'directv', 'altafiber',
    'fiber', 'internet', 'broadband', 'gig', 'mbps', 'gbps',
    
    // Training & Support
    'training', 'help', 'support', 'question', 'how to', 'what is', 'can you', 'need help',
    'policy', 'procedure', 'chargeback', 'installation', 'vacation', 'time off',
    
    // Scripts & Guidance
    'script', 'objection', 'cold call', 'prospecting', 'qualifying', 'presenting'
  ]
  
  const containsKeywords = engagementKeywords.some(keyword => 
    messageText.includes(keyword)
  )

  if (containsKeywords) {
    // Start a new conversation
    activeConversations.set(conversationKey, {
      lastActivity: new Date(),
      participants: new Set([msg.user]),
      initiated: true
    })
    console.log(`Keywords detected - starting conversation: ${conversationKey}`)
    return true
  }

  return false
}

// Enhanced channel-specific engagement settings
function getChannelEngagementSettings(channelName: string) {
  const settings = {
    'questions-and-support': {
      smartEngagement: true,
      conversationTimeout: 30, // minutes
      alwaysRespond: false
    },
    'sales-training': {
      smartEngagement: true,
      conversationTimeout: 45,
      alwaysRespond: false
    },
    'commission-calculator': {
      smartEngagement: true,
      conversationTimeout: 20,
      alwaysRespond: false
    },
    'general': {
      smartEngagement: true,
      conversationTimeout: 30,
      alwaysRespond: false
    }
  }
  
  return settings[channelName as keyof typeof settings] || settings.general
}

// Create the Enhanced Assistant instance
export const smartAssistant = new Assistant({
  // Handle new threads started with the assistant
  threadStarted: async ({ event, say, setSuggestedPrompts }) => {
    const { channel_id, thread_ts } = event.assistant_thread
    console.log(`Thread started: ${channel_id} ${thread_ts}`)

    // Get channel information
    const channelInfo = await getChannelInfo(channel_id)
    const channelName = channelInfo?.name || ''
    
    // Use channel-specific welcome message if available
    const welcomeMessage = isManagedChannel(channelName) 
      ? getChannelWelcomeMessage(channelName)
      : WELCOME_MESSAGE

    // Send welcome message
    await say(welcomeMessage)

    // Get channel-specific suggested prompts
    const channelPrompts = isManagedChannel(channelName) 
      ? Array.from(getChannelSuggestedPrompts(channelName))
      : [
          '📋 Calculate my commission for this week',
          '🔍 What tier is Frontier Fiber 2 Gig?',
          '📚 Show me sales scripts for cold calling',
          '❓ What\`s the chargeback policy?'
        ]

    // Ensure we have at least one prompt
    const prompts = channelPrompts.length > 0 ? channelPrompts : ['How can I help you?']

    // Set suggested prompts
    await setSuggestedPrompts({
      prompts: prompts.map(prompt => ({
        title: truncate(prompt, 40),
        message: prompt
      })) as [{ title: string; message: string }, ...{ title: string; message: string }[]],
      title: isManagedChannel(channelName) 
        ? '➡️ How can I help you today?'
        : '➡️ Examples of how to use me'
    })
  },

  // Handle context changes (when user switches channels)
  threadContextChanged: async ({ saveThreadContext }) => {
    await saveThreadContext()
  },

  // Enhanced user message handler with smart engagement
  userMessage: async ({ client, message, say, setStatus, setTitle, setSuggestedPrompts }) => {
    // Cast message to access properties
    const msg = message as any
    const channel = msg.channel
    const thread_ts = msg.thread_ts

    // Skip if it's from a bot
    const botUserId = await getBotId()
    if (msg.bot_id || msg.bot_id === botUserId || msg.bot_profile) {
      console.log('Skipping bot message')
      return
    }

    // Get channel information
    const channelInfo = await getChannelInfo(channel)
    const channelName = channelInfo?.name || ''

    // Handle bot-only channels (existing logic)
    if (isBotOnlyChannel(channelName)) {
      console.log(`Blocking user message in bot-only channel: ${channelName}`)
      
      // Delete the user's message and send warning (existing logic)
      try {
        await client.chat.delete({
          channel: channel,
          ts: msg.ts
        })
        console.log(`Deleted user message in bot-only channel: ${channelName}`)
      } catch (error) {
        console.error('Error deleting message in bot-only channel:', error)
      }

      // Send warning message (existing logic)
      try {
        const warningResponse = await client.chat.postMessage({
          channel: channel,
          text: `⚠️ This channel is managed by me only. Please use #questions-and-support for your questions and discussions.`,
          blocks: [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `⚠️ **This channel is managed by me only.**\\n\\nPlease use <#questions-and-support> for your questions and discussions. I'll delete this message in a few seconds.`
            }
          }]
        })

        // Delete the warning message after 5 seconds
        setTimeout(async () => {
          try {
            await client.chat.delete({
              channel: channel,
              ts: warningResponse.ts!
            })
          } catch (error) {
            console.error('Error deleting warning message:', error)
          }
        }, 5000)
      } catch (error) {
        console.error('Error sending warning message:', error)
      }
      return
    }

    // NEW: Smart engagement logic
    const shouldRespond = await shouldBotRespond(msg, botUserId, channel, thread_ts)
    
    if (!shouldRespond) {
      console.log(`Skipping message - not relevant for bot engagement in ${channelName}`)
      return
    }

    console.log(`Bot engaging with message in ${channelName}`)

    // Set initial thinking status
    await setStatus('is thinking...')

    try {
      // DON'T get thread history - use only current message to avoid permission issues
      // const messages = await getThread(channel, thread_ts, botUserId)
      
      // Create simple message array from current message only
      const messages = [{
        role: 'user' as const,
        content: msg.text || 'Hello'
      }]

      // Generate response with progress updates
      const updateStatus = async (status: string) => {
        if (status) {
          await setStatus(status)
        }
      }

      // Get channel-specific system prompt
      const channelSystemPrompt = isManagedChannel(channelName) 
        ? getChannelSystemPrompt(channelName)
        : undefined

      // Generate structured response with channel context
      const response = await generateResponse(messages, updateStatus, channelSystemPrompt)

      // Set thread title
      await setTitle('Response')

      // Get channel-specific followup prompts, fallback to simple ones
      const channelPrompts = isManagedChannel(channelName) 
        ? Array.from(getChannelSuggestedPrompts(channelName))
        : ['Can you explain more?']

      // Ensure we have at least one prompt
      const prompts = channelPrompts.length > 0 ? channelPrompts : ['Can you explain more?']

      // Set dynamic suggested prompts
      await setSuggestedPrompts({
        prompts: [
          {
            title: truncate(prompts[0], 40),
            message: prompts[0]
          },
          ...prompts.slice(1).map((followup) => ({
            title: truncate(followup, 40),
            message: followup
          }))
        ] as [{ title: string; message: string }, ...{ title: string; message: string }[]],
        title: '➡️ What\`s next? ✍️ Or write your own?'
      })

      // Post final response - simple text format
      await say({
        text: response
      })

      // Clear status
      await setStatus('')
    } catch (error) {
      console.error('Error generating response:', error)
      await say('💔 Sorry, I encountered an error while generating a response. 🔄 Please try again.')
      await setStatus('')
    }
  }
})

// Export the original assistant as well for backward compatibility
export { assistant } from './assistant-handler'
