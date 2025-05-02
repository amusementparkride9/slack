import { AppMentionEvent } from '@slack/web-api'
import { client, getThread } from './slack-utils'
import { generateResponse } from './generate-response'
import { app } from './bolt-app'
import { createButtonBlock } from './interactive-components'

const updateStatusUtil = async (initialStatus: string, event: AppMentionEvent) => {
  const initialMessage = await client.chat.postMessage({
    channel: event.channel,
    thread_ts: event.thread_ts ?? event.ts,
    text: initialStatus
  })

  if (!initialMessage || !initialMessage.ts) throw new Error('Failed to post initial message')

  const updateMessage = async (status: string) => {
    await client.chat.update({
      channel: event.channel,
      ts: initialMessage.ts as string,
      text: status
    })
  }
  return updateMessage
}

export async function handleNewAppMention(event: AppMentionEvent, botUserId: string) {
  console.log('Handling app mention')
  if (event.bot_id || event.bot_id === botUserId || event.bot_profile) {
    console.log('Skipping app mention')
    return
  }

  const { thread_ts, channel } = event
  const updateMessage = await updateStatusUtil('is thinking...', event)

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
  await client.chat.postMessage({
    channel: event.channel,
    thread_ts: thread_ts ?? event.ts,
    text: "Would you like to know more?",
    blocks: createButtonBlock("Would you like to know more about this topic?", "button_click", "learn_more")
  })
}
