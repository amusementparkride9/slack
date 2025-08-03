import { App } from '@slack/bolt'
import { VercelReceiver } from '../lib/vercel-receiver'
import { getChannelInfo } from '../lib/channel-config'

// Create Riley's Bolt app with dedicated credentials
const rileyApp = new App({
  token: process.env.RILEY_BOT_TOKEN,
  signingSecret: process.env.RILEY_SIGNING_SECRET,
  receiver: new VercelReceiver(),
  processBeforeResponse: true
})

// Get Riley's bot ID for thread detection
let rileyBotId: string | null = null

async function getRileyBotId() {
  if (rileyBotId) return rileyBotId
  
  try {
    const result = await rileyApp.client.auth.test()
    rileyBotId = result.user_id as string
    return rileyBotId
  } catch (error) {
    console.error('Failed to get Riley bot ID:', error)
    return null
  }
}

// Handle direct messages and thread replies for Riley
rileyApp.message(async ({ message, say, client }) => {
  const msg = message as any
  
  // Skip bot messages
  if (msg.bot_id || msg.subtype === 'bot_message') return
  
  console.log('Riley - Message received:', msg)
  
  // Get channel information
  const channelInfo = await getChannelInfo(msg.channel)
  const isDirectMessage = channelInfo?.is_im || channelInfo?.is_mpim
  
  // Check if this is a thread reply where Riley was mentioned or previously participated
  let shouldRespond = isDirectMessage
  
  if (!shouldRespond && msg.thread_ts) {
    try {
      // Check if Riley was mentioned anywhere in this thread or has replied before
      const threadReplies = await client.conversations.replies({
        channel: msg.channel,
        ts: msg.thread_ts,
        limit: 50
      })
      
      const botId = await getRileyBotId()
      
      // Check if Riley was mentioned in ANY message in this thread
      const botWasMentioned = threadReplies.messages?.some(m => 
        m.text?.includes(`<@${botId}>`) || m.text?.toLowerCase().includes('riley')
      )
      
      // Check if Riley has replied in this thread before
      const botHasReplied = threadReplies.messages?.some(m => 
        m.bot_id === botId || 
        m.user === botId ||
        (m.bot_id && m.bot_profile?.name === 'Riley') ||
        (m.app_id && m.bot_profile?.id === botId)
      )
      
      // If Riley was mentioned OR has replied before, continue the conversation
      if (botWasMentioned || botHasReplied) {
        console.log('✅ Riley continuing thread conversation - mentioned:', botWasMentioned, 'replied before:', botHasReplied)
        shouldRespond = true
      } else {
        console.log('❌ Riley not part of this thread conversation, skipping')
      }
    } catch (error) {
      console.log('Could not check thread history for Riley, skipping:', error)
    }
  }
  
  console.log('Riley - Channel info:', channelInfo)
  console.log('Riley - Is direct message:', isDirectMessage)
  console.log('Riley - Should respond:', shouldRespond)
  
  // Respond if it's a DM or if we're continuing a thread conversation
  if (shouldRespond) {
    console.log('Riley - Processing response...')
    
    try {
      // Import the generate response function
      const { generateResponse } = await import('../lib/ai/generate-response')
      
      // If this is a thread, get the conversation context
      let messages
      if (msg.thread_ts) {
        try {
          // Get thread history for context
          const threadReplies = await client.conversations.replies({
            channel: msg.channel,
            ts: msg.thread_ts,
            limit: 10
          })
          
          const botId = await getRileyBotId()
          
          // Convert thread messages to conversation format
          const threadMessages = threadReplies.messages
            ?.filter(m => m.text) // Include both user and bot messages with text
            ?.map(m => ({
              role: m.bot_id ? 'assistant' as const : 'user' as const,
              content: m.text?.replace(/<@[^>]+>/g, '').trim() || ''
            }))
            ?.filter(m => m.content) // Remove empty messages
          
          messages = threadMessages
          console.log(`📝 Riley - Thread context: ${threadMessages?.length || 0} messages loaded for conversation`)
          
          // If no valid messages, fall back to current message
          if (!messages || messages.length === 0) {
            messages = [{
              role: 'user' as const,
              content: msg.text || 'Hello'
            }]
          }
        } catch (error) {
          console.log('Riley - Could not get thread context, using current message only:', error)
          messages = [{
            role: 'user' as const,
            content: msg.text || 'Hello'
          }]
        }
      } else {
        // Single message
        messages = [{
          role: 'user' as const,
          content: msg.text || 'Hello'
        }]
      }
      
      console.log('Riley - Calling generateResponse with:', messages)
      
      // Generate intelligent response using Riley persona
      const response = await generateResponse(messages, 'riley')
      
      console.log('Riley - Generated response:', response)
      
      // Send the actual AI response
      await say({
        text: response,
        thread_ts: msg.thread_ts || msg.ts
      })
      
      console.log('✅ Riley - Response sent successfully!')
      
    } catch (error) {
      console.error('❌ Riley - Error in message handler:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await say({
        text: `Sorry, I'm having trouble processing that right now. Error: ${errorMessage}`,
        thread_ts: msg.thread_ts || msg.ts
      })
    }
  }
})

// Handle app mentions for Riley
rileyApp.event('app_mention', async ({ event, say, client }) => {
  console.log('Riley - App mention received:', event)
  
  try {
    // Import the generate response function
    const { generateResponse } = await import('../lib/ai/generate-response')
    
    // Get the conversation context if this is in a thread
    let messages
    if (event.thread_ts) {
      try {
        const threadReplies = await client.conversations.replies({
          channel: event.channel,
          ts: event.thread_ts,
          limit: 10
        })
        
        const threadMessages = threadReplies.messages
          ?.filter(m => m.text)
          ?.map(m => ({
            role: m.bot_id ? 'assistant' as const : 'user' as const,
            content: m.text?.replace(/<@[^>]+>/g, '').trim() || ''
          }))
          ?.filter(m => m.content)
        
        messages = threadMessages || [{
          role: 'user' as const,
          content: event.text?.replace(/<@[^>]+>/g, '').trim() || 'Hello'
        }]
      } catch (error) {
        console.log('Riley - Could not get thread context for mention:', error)
        messages = [{
          role: 'user' as const,
          content: event.text?.replace(/<@[^>]+>/g, '').trim() || 'Hello'
        }]
      }
    } else {
      messages = [{
        role: 'user' as const,
        content: event.text?.replace(/<@[^>]+>/g, '').trim() || 'Hello'
      }]
    }
    
    console.log('Riley - Generating response for mention:', messages)
    
    // Generate response using Riley persona
    const response = await generateResponse(messages, 'riley')
    
    await say({
      text: response,
      thread_ts: event.thread_ts || event.ts
    })
    
    console.log('✅ Riley - Mention response sent!')
    
  } catch (error) {
    console.error('❌ Riley - Error handling mention:', error)
    await say({
      text: "Sorry, I'm having trouble with that request right now.",
      thread_ts: event.thread_ts || event.ts
    })
  }
})

// Create the Vercel receiver and export the handler
const rileyReceiver = new VercelReceiver()
rileyReceiver.init(rileyApp)

export async function POST(request: Request) {
  try {
    // Process the event with our custom receiver
    const response = await rileyReceiver.processEvent(request)

    // Return the response
    return response
  } catch (error) {
    console.error('Error handling Riley Slack event:', error)
    return new Response('Error handling Riley Slack event', { status: 500 })
  }
}
