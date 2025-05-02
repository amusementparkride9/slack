import type { AssistantThreadStartedEvent, GenericMessageEvent } from '@slack/web-api'
import { app, createStatusUpdater, getThread } from './bolt-app'
import { generateResponse } from './generate-response'
import { WELCOME_MESSAGE } from './ai/prompts'
import { createButtonBlock } from './interactive-components'

// Handle assistant thread started events
export async function assistantThreadMessage(event: AssistantThreadStartedEvent) {
  const { channel_id, thread_ts } = event.assistant_thread
  console.log(`Thread started: ${channel_id} ${thread_ts}`)

  // Send welcome message
  await app.client.chat.postMessage({
    channel: channel_id,
    thread_ts: thread_ts,
    text: WELCOME_MESSAGE
  })

  // Set suggested prompts using Bolt client
  await app.client.assistant.threads.setSuggestedPrompts({
    channel_id: channel_id,
    thread_ts: thread_ts,
    prompts: [
      {
        title: 'Tasks',
        message: 'What tasks can you help me with?'
      },
      {
        title: 'Brainstorm',
        message: 'Brainstorm some ideas for a new project.'
      },
      {
        title: 'Draft an email',
        message: 'Draft an email to a client.'
      }
    ]
  })
}

// Handle new messages in assistant threads
export async function handleNewAssistantMessage(event: GenericMessageEvent, botUserId: string) {
  if (event.bot_id || event.bot_id === botUserId || event.bot_profile || !event.thread_ts) return

  const { thread_ts, channel } = event
  
  // Create status updater
  const updateStatus = createStatusUpdater(channel, thread_ts)
  
  // Set initial thinking status
  await updateStatus('is thinking...')

  // Get thread history
  const messages = await getThread(channel, thread_ts, botUserId)
  
  // Generate response with progress updates
  const result = await generateResponse(messages, updateStatus)

  // Post final response
  await app.client.chat.postMessage({
    channel: channel,
    thread_ts: thread_ts,
    text: result,
    unfurl_links: false,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: result
        }
      }
    ]
  })

  // Clear status
  await updateStatus('')
}
