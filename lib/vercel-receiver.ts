import { ReceiverEvent, Receiver, App, StringIndexed } from '@slack/bolt';

export class VercelReceiver implements Receiver {
  private bolt: App<StringIndexed> | null = null;

  constructor() {
    // Initialize with null
  }

  init(app: App<StringIndexed>): void {
    this.bolt = app;
  }

  async start(): Promise<void> {
    // No-op for serverless
    return Promise.resolve();
  }

  async stop(): Promise<void> {
    // No-op for serverless
    return Promise.resolve();
  }

  async processEvent(request: Request): Promise<Response> {
    if (!this.bolt) {
      throw new Error('Bolt app not initialized');
    }

    // Get the raw body as text
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Handle URL verification challenge
    if (body.type === 'url_verification') {
      return new Response(body.challenge, { status: 200 });
    }

    // Create a ReceiverEvent for Bolt to process
    const event: ReceiverEvent = {
      body,
      ack: async (response) => {
        // This is handled automatically in our case
      },
      retryNum: request.headers.get('x-slack-retry-num') ? 
        parseInt(request.headers.get('x-slack-retry-num') as string, 10) : 0,
      retryReason: request.headers.get('x-slack-retry-reason') as string || undefined,
    };

    try {
      // Process the event with Bolt
      await this.bolt.processEvent(event);
      return new Response('Success!', { status: 200 });
    } catch (error) {
      console.error('Error processing Slack event:', error);
      return new Response('Error processing Slack event', { status: 500 });
    }
  }
}
