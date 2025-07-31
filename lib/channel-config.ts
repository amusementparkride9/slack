import { app } from './bolt-app'

// Channel configuration
export const CHANNEL_CONFIG = {
  ANNOUNCEMENTS: {
    name: 'announcements',
    description: 'Bot-only announcements channel',
    botOnly: true,
    welcomeMessage: '📢 **Welcome to Announcements**\n\nThis channel is managed by me! I post important updates, reminders, and announcements here. Only I can post messages in this channel to keep it focused and organized.',
    systemPrompt: `You are managing the #announcements channel for independent sales contractors. This is a bot-only channel where you post important updates, policy changes, commission updates, training announcements, and other critical information. Keep announcements professional, clear, and actionable. Always include relevant dates, deadlines, and next steps.`,
    suggestedPrompts: [
      '📋 What announcements should I know about?',
      '📅 Any upcoming deadlines or events?',
      '💰 Recent commission or policy updates?'
    ]
  },
  QUESTIONS_AND_SUPPORT: {
    name: 'questions-and-support',
    description: 'Main support channel for agent questions',
    botOnly: false,
    welcomeMessage: '❓ **Welcome to Questions & Support**\n\nThis is your main support channel! Ask me anything about:\n• Commission calculations and payroll\n• Sales processes and best practices\n• Company policies and procedures\n• Training and development\n• Technical support\n\nI\'m here to help you succeed! 🚀',
    systemPrompt: `You are the primary support assistant for independent sales contractors in the #questions-and-support channel. Your role is to:

- Answer questions about commission calculations, payroll, and compensation using the calculateCommission tool
- Provide guidance on sales processes, techniques, and best practices using the getSalesGuidance tool
- Explain company policies, procedures, and requirements using the lookupPolicy tool
- Offer training resources and development tips using the findTraining tool
- Help with technical issues related to sales tools and systems
- Provide motivational support and encouragement
- Escalate complex issues to management when needed

IMPORTANT: Use the available tools when appropriate:
- Use calculateCommission for any commission-related questions
- Use lookupPolicy for company policy questions (vacation, expenses, etc.)
- Use getSalesGuidance for sales process help (prospecting, closing, etc.)
- Use findTraining when agents need skill development
- Use web_search_preview for current industry information or external resources

Be helpful, encouraging, and solution-focused. Always provide specific, actionable advice. If you don't know something specific to this company, be honest and suggest they ask their manager or check official documentation.`,
    suggestedPrompts: [
      '💰 Calculate my commission for £15,000 in sales',
      '📋 What are the current commission rates and bonuses?',
      '🎯 Give me prospecting tips for B2B sales',
      '📞 What are the best cold calling scripts?',
      '📄 What\'s the company vacation policy?',
      '📚 Find training resources for objection handling'
    ]
  }
} as const

export type ChannelType = keyof typeof CHANNEL_CONFIG

// Get channel configuration by name
export function getChannelConfig(channelName: string): typeof CHANNEL_CONFIG[ChannelType] | null {
  const normalizedName = channelName.toLowerCase().replace(/^#/, '')
  
  for (const config of Object.values(CHANNEL_CONFIG)) {
    if (config.name === normalizedName) {
      return config
    }
  }
  
  return null
}

// Get channel info from Slack API
export async function getChannelInfo(channelId: string) {
  try {
    const result = await app.client.conversations.info({
      channel: channelId
    })
    
    return result.channel
  } catch (error) {
    console.error('Error getting channel info:', error)
    return null
  }
}

// Check if a channel is managed by the bot
export function isManagedChannel(channelName: string): boolean {
  // Always return true - bot works in ALL channels
  return true
}

// Check if a channel is bot-only (only for specific configured channels)
export function isBotOnlyChannel(channelName: string): boolean {
  const config = getChannelConfig(channelName)
  return config?.botOnly === true
}

// Get channel-specific system prompt
export function getChannelSystemPrompt(channelName: string): string {
  const config = getChannelConfig(channelName)
  // If no specific config, return a general sales assistant prompt
  return config?.systemPrompt || `You are a helpful AI assistant for sales contractors. You can help with:
- Commission calculations and payroll questions
- Sales processes and best practices  
- Company policies and procedures
- Training and development
- General business support

Use the available tools when appropriate and be helpful, professional, and supportive.`
}

// Get channel-specific welcome message
export function getChannelWelcomeMessage(channelName: string): string {
  const config = getChannelConfig(channelName)
  // If no specific config, return a general welcome message
  return config?.welcomeMessage || `👋 **Hello! I'm your Sales Assistant**

I'm here to help with:
• Commission calculations and payroll
• Sales strategies and best practices
• Company policies and procedures  
• Training resources and development
• General business support

How can I help you today? 🚀`
}

// Get channel-specific suggested prompts
export function getChannelSuggestedPrompts(channelName: string): readonly string[] {
  const config = getChannelConfig(channelName)
  // If no specific config, return general sales assistant prompts
  return config?.suggestedPrompts || [
    '💰 Calculate my commission for recent sales',
    '🎯 Give me sales tips and best practices',
    '📋 What company policies should I know?',
    '📚 Find training resources to improve my skills',
    '❓ Help me with a specific question'
  ]
}

// Post announcement to the announcements channel
export async function postAnnouncement(message: string, channelId?: string) {
  try {
    // Find the announcements channel if not provided
    let targetChannelId = channelId
    
    if (!targetChannelId) {
      const channels = await app.client.conversations.list({
        types: 'public_channel,private_channel'
      })
      
      const announcementsChannel = channels.channels?.find(
        channel => channel.name === CHANNEL_CONFIG.ANNOUNCEMENTS.name
      )
      
      if (!announcementsChannel) {
        throw new Error('Announcements channel not found')
      }
      
      targetChannelId = announcementsChannel.id!
    }
    
    // Post the announcement
    await app.client.chat.postMessage({
      channel: targetChannelId,
      text: message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        }
      ]
    })
    
    console.log('Posted announcement to channel:', targetChannelId)
  } catch (error) {
    console.error('Error posting announcement:', error)
    throw error
  }
}

// Schedule an announcement for later posting
export async function scheduleAnnouncement(message: string, scheduledTime: Date, channelId?: string) {
  try {
    let targetChannelId = channelId
    
    if (!targetChannelId) {
      const channels = await app.client.conversations.list({
        types: 'public_channel,private_channel'
      })
      
      const announcementsChannel = channels.channels?.find(
        channel => channel.name === CHANNEL_CONFIG.ANNOUNCEMENTS.name
      )
      
      if (!announcementsChannel) {
        throw new Error('Announcements channel not found')
      }
      
      targetChannelId = announcementsChannel.id!
    }
    
    // Schedule the message using Slack's chat.scheduleMessage
    const result = await app.client.chat.scheduleMessage({
      channel: targetChannelId,
      text: message,
      post_at: Math.floor(scheduledTime.getTime() / 1000),
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        }
      ]
    })
    
    console.log('Scheduled announcement:', result.scheduled_message_id)
    return result.scheduled_message_id
  } catch (error) {
    console.error('Error scheduling announcement:', error)
    throw error
  }
}

// Post a welcome message when someone joins a managed channel
export async function postChannelWelcome(channelId: string, userId: string) {
  try {
    const channelInfo = await getChannelInfo(channelId)
    const channelName = channelInfo?.name || ''
    
    if (!isManagedChannel(channelName)) return
    
    const welcomeMessage = getChannelWelcomeMessage(channelName)
    
    await app.client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: welcomeMessage,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: welcomeMessage
          }
        }
      ]
    })
    
    console.log(`Posted welcome message to user ${userId} in channel ${channelName}`)
  } catch (error) {
    console.error('Error posting welcome message:', error)
  }
}
