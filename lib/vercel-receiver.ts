import { ReceiverEvent, Receiver, App, StringIndexed } from '@slack/bolt';
import { waitUntil } from '@vercel/functions';

export class VercelReceiver implements Receiver {
  private bolt: App<StringIndexed> | null = null;

  constructor() {
    // Initialize with null
  }

  init(app: App<StringIndexed>): void {
    this.bolt = app;
  }

  // These methods are required by the Receiver interface but not used in our serverless context
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

    // Check content type to determine how to parse the body
    const contentType = request.headers.get('content-type') || '';
    let body: any;

    try {
      if (contentType.includes('application/json')) {
        // Parse JSON body
        const rawBody = await request.text();
        body = JSON.parse(rawBody);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Parse form data
        const formData = await request.formData();
        const payload = formData.get('payload');
        
        if (payload && typeof payload === 'string') {
          // Interactive payloads come as a JSON string in the 'payload' field
          body = JSON.parse(payload);
        } else {
          // For slash commands and other form-encoded requests
          body = {};
          formData.forEach((value, key) => {
            body[key] = value;
          });
        }
      } else {
        // Fallback to text and try to parse as JSON
        const rawBody = await request.text();
        try {
          body = JSON.parse(rawBody);
        } catch (e) {
          // If it's not JSON, try to parse as URL-encoded form data
          const params = new URLSearchParams(rawBody);
          body = {};
          params.forEach((value, key) => {
            body[key] = value;
          });
          
          // Check if there's a payload parameter that needs to be parsed as JSON
          if (body.payload && typeof body.payload === 'string') {
            try {
              body = JSON.parse(body.payload);
            } catch (e) {
              // Keep as is if we can't parse the payload
            }
          }
        }
      }

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

      // Use waitUntil for long-running operations
      // This allows us to respond to Slack quickly while processing continues
      waitUntil(this.bolt.processEvent(event));
      
      // Return immediate success response
      return new Response('Success!', { status: 200 });
    } catch (error) {
      console.error('Error processing Slack event:', error);
      return new Response('Error processing Slack event', { status: 500 });
    }
  }
}
