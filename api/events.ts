import { app } from '../lib/bolt-app'
import { VercelReceiver } from '../lib/vercel-receiver'
import { assistant } from '../lib/assistant-handler'
import { getChannelInfo, isBotOnlyChannel, postChannelWelcome } from '../lib/channel-config'
import { registerAdminCommands } from '../lib/admin-commands'

// Create a Vercel receiver instance
const receiver = new VercelReceiver()

// Initialize the receiver with our Bolt app
receiver.init(app)

// Register the assistant with the app
app.assistant(assistant)

// Register admin commands
registerAdminCommands()

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

// Handle app mentions to ensure the bot responds appropriately
app.event('app_mention', async ({ event, say }) => {
  // Get channel information
  const channelInfo = await getChannelInfo(event.channel)
  const channelName = channelInfo?.name || ''
  
  // Respond to all mentions with helpful information
  await say({
    text: `👋 Hi there! I'm your Sales Assistant. I can help with commission calculations, sales tips, company policies, and more! For the best experience, start an Assistant thread with me by clicking the "Assistant" button or just ask me anything directly.`,
    thread_ts: event.ts
  })
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
