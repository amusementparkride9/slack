import type { AssistantThreadStartedEvent, GenericMessageEvent } from '@slack/web-api'
import { client, getThread, updateStatusUtil } from './slack-utils'
import { generateResponse } from './generate-response'
import { WELCOME_MESSAGE } from './ai/prompts'

export async function assistantThreadMessage(event: AssistantThreadStartedEvent) {
  const { channel_id, thread_ts } = event.assistant_thread
  console.log(`Thread started: ${channel_id} ${thread_ts}`)
  console.log(JSON.stringify(event))

  await client.chat.postMessage({
    channel: channel_id,
    thread_ts: thread_ts,
    text: WELCOME_MESSAGE
  })

  await client.assistant.threads.setSuggestedPrompts({
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

export async function handleNewAssistantMessage(event: GenericMessageEvent, botUserId: string) {
  if (event.bot_id || event.bot_id === botUserId || event.bot_profile || !event.thread_ts) return

  const { thread_ts, channel } = event
  const updateStatus = updateStatusUtil(channel, thread_ts)
  await updateStatus('is thinking...')

  const messages = await getThread(channel, thread_ts, botUserId)
  const result = await generateResponse(messages, updateStatus)

  await client.chat.postMessage({
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

  await updateStatus('')
}
