import { app } from '../lib/bolt-app'
import { VercelReceiver } from '../lib/vercel-receiver'
import { smartAssistant } from '../lib/smart-assistant-handler'
import { getChannelInfo, isBotOnlyChannel, postChannelWelcome } from '../lib/channel-config'
import { registerAdminCommands } from '../lib/admin-commands'
import { getBotId } from '../lib/bolt-app'

// Create a Vercel receiver instance
const receiver = new VercelReceiver()

// Initialize the receiver with our Bolt app
receiver.init(app)

// NOTE: Smart Assistant disabled to avoid permission issues with conversation history
// app.assistant(smartAssistant)

// Register admin commands
registerAdminCommands()

// Handle direct messages and thread replies - Smart assistant handles intelligent engagement
app.message(async ({ message, say, client }) => {
  const msg = message as any
  
  // Skip bot messages
  if (msg.bot_id || msg.subtype === 'bot_message') return
  
  console.log('Message received:', msg)
  
  // Get channel information
  const channelInfo = await getChannelInfo(msg.channel)
  const isDirectMessage = channelInfo?.is_im || channelInfo?.is_mpim
  
  // Check if this is a thread reply where the bot previously participated
  let shouldRespond = isDirectMessage
  
  if (!shouldRespond && msg.thread_ts) {
    try {
      // Check if the bot has replied in this thread before
      const threadReplies = await client.conversations.replies({
        channel: msg.channel,
        ts: msg.thread_ts,
        limit: 50
      })
      
      const botId = await getBotId()
      const botHasReplied = threadReplies.messages?.some(m => m.bot_id === botId || m.user === botId)
      
      if (botHasReplied) {
        console.log('Bot has replied in this thread before, continuing conversation')
        shouldRespond = true
      }
    } catch (error) {
      console.log('Could not check thread history, skipping:', error)
    }
  }
  
  console.log('Channel info:', channelInfo)
  console.log('Is direct message:', isDirectMessage)
  console.log('Should respond:', shouldRespond)
  
  // Respond if it's a DM or if we're continuing a thread conversation
  if (shouldRespond) {
    console.log('Processing response...')
    
    try {
      // Import the generate response function
      const { generateResponse } = await import('../lib/ai/generate-response')
      
      // Create message array
      const messages = [{
        role: 'user' as const,
        content: msg.text || 'Hello'
      }]
      
      console.log('Calling generateResponse with:', messages)
      
      // Generate intelligent response using knowledge base
      const response = await generateResponse(messages)
      
      console.log('Generated response:', response)
      
      // Send the actual AI response
      await say({
        text: response,
        thread_ts: msg.thread_ts || msg.ts
      })
      
      console.log('✅ Response sent successfully!')
      
    } catch (error) {
      console.error('❌ Error in message handler:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await say({
        text: `System hiccup - ${errorMessage}`,
        thread_ts: msg.thread_ts || msg.ts
      })
    }
  } else {
    console.log('Not a DM or active thread, skipping response')
  }
})

// Handle regular messages in channels to enforce bot-only policy
app.message(async ({ message, client }) => {
  // Cast message to access properties
  const msg = message as any
  
  // Skip bot messages
  if (msg.bot_id || msg.subtype === 'bot_message') return
  
  // Get channel information
  const channelInfo = await getChannelInfo(msg.channel)
  const channelName = channelInfo?.name || ''
  
  // Check if this is a bot-only channel
  if (isBotOnlyChannel(channelName)) {
    console.log(`Deleting non-bot message in bot-only channel: ${channelName}`)
    
    try {
      // Delete the user's message
      await client.chat.delete({
        channel: msg.channel,
        ts: msg.ts
      })
      
      // Post a temporary warning
      const warningResponse = await client.chat.postMessage({
        channel: msg.channel,
        text: `⚠️ This channel is managed by me only. Please use #questions-and-support for discussions.`,
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
      
      // Delete the warning after 5 seconds
      setTimeout(async () => {
        try {
          await client.chat.delete({
            channel: msg.channel,
            ts: warningResponse.ts!
          })
        } catch (error) {
          console.error('Error deleting warning message:', error)
        }
      }, 5000)
      
    } catch (error) {
      console.error('Error handling message in bot-only channel:', error)
    }
  }
})

// Handle when someone joins a channel
app.event('member_joined_channel', async ({ event }) => {
  console.log(`User ${event.user} joined channel ${event.channel}`)
  await postChannelWelcome(event.channel, event.user)
})

// Handle app mentions - DIRECT RESPONSE with knowledge base
app.event('app_mention', async ({ event, say }) => {
  console.log('App mention received:', event)
  
  try {
    // Import the generate response function
    const { generateResponse } = await import('../lib/ai/generate-response')
    
    // Create a simple message array from the mention
    const messages = [{
      role: 'user' as const,
      content: event.text?.replace(/<@[^>]+>/, '').trim() || 'Hello'
    }]
    
    // Generate intelligent response using knowledge base
    const response = await generateResponse(messages)
    
    await say({
      text: response,
      thread_ts: event.ts
    })
    
  } catch (error) {
    console.error('Error in app_mention:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    // Only fallback on actual error
    await say({
      text: `� Sorry, I encountered an error: ${errorMessage}. Please try asking about commissions, providers, or sales questions again!`,
      thread_ts: event.ts
    })
  }
})

export async function POST(request: Request) {
  try {
    // Process the event with our custom receiver
    const response = await receiver.processEvent(request)

    // Return the response
    return response
  } catch (error) {
    console.error('Error handling Slack event:', error)
    return new Response('Error handling Slack event', { status: 500 })
  }
}
