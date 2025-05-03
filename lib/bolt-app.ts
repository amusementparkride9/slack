import { App, LogLevel } from '@slack/bolt'
import { CoreMessage } from 'ai'

// Initialize the Bolt app with the bot token and signing secret
export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false, // We're not using Socket Mode for Vercel
  logLevel: LogLevel.INFO
})

// Export a function to get the bot user ID
export async function getBotId(): Promise<string> {
  const authTest = await app.client.auth.test()
  if (!authTest.user_id) {
    throw new Error('botUserId is undefined')
  }
  return authTest.user_id
}

// Create a utility function for updating thread status
export function createStatusUpdater(channel: string, thread_ts: string) {
  return async (status: string) => {
    await app.client.assistant.threads.setStatus({
      channel_id: channel,
      thread_ts: thread_ts,
      status: status
    })
  }
}

// Get thread messages and format them for AI processing
export async function getThread(
  channel_id: string,
  thread_ts: string,
  botUserId: string
): Promise<CoreMessage[]> {
  const { messages } = await app.client.conversations.replies({
    channel: channel_id,
    ts: thread_ts,
    limit: 50
  })

  if (!messages) throw new Error('No messages found in thread')

  const result = messages
    .map((message) => {
      const isBot = !!message.bot_id
      if (!message.text) return null

      // For app mentions, remove the mention prefix
      // For IM messages, keep the full text
      let content = message.text
      if (!isBot && content.includes(`<@${botUserId}>`)) {
        content = content.replace(`<@${botUserId}> `, '')
      }

      return {
        role: isBot ? 'assistant' : 'user',
        content: content
      } as CoreMessage
    })
    .filter((msg): msg is CoreMessage => msg !== null)

  return result
}

// Convert markdown to Slack mrkdwn format
export function markdownToMrkdwn(text: string): string {
  return text.replace(/\[(.*?)\]\((.*?)\)/g, '<$2|$1>').replace(/\*\*/g, '*')
}
