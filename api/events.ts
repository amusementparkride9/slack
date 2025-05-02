import { waitUntil } from '@vercel/functions';
import { app, getBotId } from '../lib/bolt-app';
import { VercelReceiver } from '../lib/vercel-receiver';
import { assistantThreadMessage, handleNewAssistantMessage } from '../lib/handle-messages';
import { handleNewAppMention } from '../lib/handle-app-mention';
// Import our interactive components and slash commands
import '../lib/interactive-components';
import '../lib/slash-commands';

// Create a Vercel receiver instance
const receiver = new VercelReceiver();

// Initialize the receiver with our Bolt app
receiver.init(app);

// Initialize Bolt app listeners
app.event('app_mention', async ({ event }) => {
  const botUserId = await getBotId();
  waitUntil(handleNewAppMention(event, botUserId));
});

app.event('assistant_thread_started', async ({ event }) => {
  waitUntil(assistantThreadMessage(event));
});

app.event('message', async ({ event }) => {
  // Skip if it's not a direct message or if it's from a bot
  if (
    event.channel_type !== 'im' ||
    event.subtype ||
    event.bot_id ||
    event.bot_profile
  ) {
    return;
  }
  
  const botUserId = await getBotId();
  if (event.bot_id === botUserId) return;
  
  waitUntil(handleNewAssistantMessage(event, botUserId));
});

export async function POST(request: Request) {
  try {
    // Process the event with our custom receiver
    const response = await receiver.processEvent(request);
    
    // Return the response
    return response;
  } catch (error) {
    console.error('Error handling Slack event:', error);
    return new Response('Error handling Slack event', { status: 500 });
  }
}
