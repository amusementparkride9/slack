import { AppMentionEvent } from '@slack/web-api'
import { getThread } from './slack-utils'
import { generateResponse } from './generate-response'
import { app, createStatusUpdater } from './bolt-app'
import { createButtonBlock } from './interactive-components'

export async function handleNewAppMention(event: AppMentionEvent, botUserId: string) {
  console.log('Handling app mention')
  if (event.bot_id || event.bot_id === botUserId || event.bot_profile) {
    console.log('Skipping app mention')
    return
  }

  const { thread_ts, channel } = event
  
  // Create status updater
  const threadTs = thread_ts ?? event.ts
  const updateStatus = createStatusUpdater(channel, threadTs)
  
  // Set initial thinking status
  await updateStatus('is thinking...')

  // Generate response
  let result: string;
  
  if (thread_ts) {
    const messages = await getThread(channel, thread_ts, botUserId)
    result = await generateResponse(messages, updateStatus)
  } else {
    result = await generateResponse([{ role: 'user', content: event.text }], updateStatus)
  }
  
  // Post the AI response as a message
  await app.client.chat.postMessage({
    channel: event.channel,
    thread_ts: threadTs,
    text: result,
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
  
  // Add an interactive follow-up message with a button
  await app.client.chat.postMessage({
    channel: event.channel,
    thread_ts: threadTs,
    text: "Would you like to know more?",
    blocks: createButtonBlock("Would you like to know more about this topic?", "button_click", "learn_more")
  })
}
