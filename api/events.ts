import { app } from '../lib/bolt-app';
import { VercelReceiver } from '../lib/vercel-receiver';
import { assistant } from '../lib/assistant-handler';
// Import our interactive components and slash commands
import '../lib/interactive-components';
import '../lib/slash-commands';

// Create a Vercel receiver instance
const receiver = new VercelReceiver();

// Initialize the receiver with our Bolt app
receiver.init(app);

// Register the assistant with the app
app.assistant(assistant);

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
