import { app } from './bolt-app';
import { BlockAction, ButtonAction } from '@slack/bolt';

// Function to create a simple button block
export function createButtonBlock(text: string, actionId: string, value: string): any[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Click Me',
          emoji: true
        },
        value,
        action_id: actionId
      }
    }
  ];
}

// Register a handler for button clicks
app.action('button_click', async ({ body, ack, client }) => {
  // Acknowledge the action
  await ack();
  
  // Get the value from the button and channel info
  const action = (body as BlockAction).actions[0] as ButtonAction;
  const value = action.value || 'unknown';
  const channelId = (body as BlockAction).channel?.id;
  const threadTs = (body as BlockAction).message?.thread_ts || (body as BlockAction).message?.ts;
  
  if (channelId && threadTs) {
    // Respond to the button click in the thread
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: threadTs,
      text: `You clicked the button with value: ${value}`
    });
  }
});

// Example function to send a message with a button
export async function sendMessageWithButton(channel: string, text: string, value: string) {
  await app.client.chat.postMessage({
    channel,
    text,
    blocks: createButtonBlock(text, 'button_click', value)
  });
}
