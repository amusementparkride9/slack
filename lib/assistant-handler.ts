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

// Create the Assistant instance
export const assistant = new Assistant({
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
          '📋 What tasks can you help me with?',
          '💡 Brainstorm some ideas for a new project.',
          '📧 Draft an email to a client.'
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

  // Handle user messages
  userMessage: async ({ client, message, say, setStatus, setTitle, setSuggestedPrompts }) => {
    // Cast message to access properties
    const msg = message as any
    const channel = msg.channel
    const thread_ts = msg.thread_ts

    // Skip if it's from a bot
    const botUserId = await getBotId()
    if (msg.bot_id || msg.bot_id === botUserId || msg.bot_profile) return

    // Get channel information
    const channelInfo = await getChannelInfo(channel)
    const channelName = channelInfo?.name || ''

    // Check if this is a bot-only channel and block non-bot messages
    if (isBotOnlyChannel(channelName)) {
      console.log(`Blocking user message in bot-only channel: ${channelName}`)
      
      // Delete the user's message
      try {
        await client.chat.delete({
          channel: channel,
          ts: msg.ts
        })
        console.log(`Deleted user message in bot-only channel: ${channelName}`)
      } catch (error) {
        console.error('Error deleting message in bot-only channel:', error)
      }

      // Send a temporary warning message that will be deleted
      try {
        const warningResponse = await client.chat.postMessage({
          channel: channel,
          text: `⚠️ This channel is managed by me only. Please use #questions-and-support for your questions and discussions.`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `⚠️ **This channel is managed by me only.**\n\nPlease use <#questions-and-support> for your questions and discussions. I'll delete this message in a few seconds.`
              }
            }
          ]
        })

        // Delete the warning message after 5 seconds
        setTimeout(async () => {
          try {
            await client.chat.delete({
              channel: channel,
              ts: warningResponse.ts!
            })
            console.log('Deleted warning message from bot-only channel')
          } catch (error) {
            console.error('Error deleting warning message:', error)
          }
        }, 5000)

      } catch (error) {
        console.error('Error sending warning message:', error)
      }

      return // Don't process the message further
    }

    // Set initial thinking status
    await setStatus('is thinking...')

    try {
      // Get thread history
      const messages = await getThread(channel, thread_ts, botUserId)

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
          // Ensure we always have at least one prompt (required by Slack's type)
          {
            title: truncate(prompts[0], 40),
            message: prompts[0]
          },
          // Add the remaining prompts
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
