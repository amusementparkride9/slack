import { AppMentionEvent } from '@slack/web-api'
import { getThread } from './slack-utils'
import { generateResponse } from './generate-response'
import { app } from './bolt-app'
import { createButtonBlock } from './interactive-components'

export async function handleNewAppMention(event: AppMentionEvent, botUserId: string) {
  console.log('Handling app mention')
  if (event.bot_id || event.bot_id === botUserId || event.bot_profile) {
    console.log('Skipping app mention')
    return
  }

  const { thread_ts, channel } = event
  
  // Post thinking message
  const initialMessage = await app.client.chat.postMessage({
    channel: event.channel,
    thread_ts: event.thread_ts ?? event.ts,
    text: 'is thinking...'
  })

  if (!initialMessage || !initialMessage.ts) throw new Error('Failed to post initial message')

  // Create update function for progress updates
  const updateMessage = async (status: string) => {
    await app.client.chat.update({
      channel: event.channel,
      ts: initialMessage.ts as string,
      text: status
    })
  }

  // Generate response
  let result: string;
  
  if (thread_ts) {
    const messages = await getThread(channel, thread_ts, botUserId)
    result = await generateResponse(messages, updateMessage)
  } else {
    result = await generateResponse([{ role: 'user', content: event.text }], updateMessage)
  }
  
  // Update the message with the AI response
  await updateMessage(result)
  
  // Add an interactive follow-up message with a button
  await app.client.chat.postMessage({
    channel: event.channel,
    thread_ts: thread_ts ?? event.ts,
    text: "Would you like to know more?",
    blocks: createButtonBlock("Would you like to know more about this topic?", "button_click", "learn_more")
  })
}
