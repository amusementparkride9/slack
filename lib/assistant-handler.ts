import { Assistant } from '@slack/bolt';
import { generateResponse } from './generate-response';
import { WELCOME_MESSAGE } from './ai/prompts';
import { getThread, getBotId } from './bolt-app';

// Create the Assistant instance
export const assistant = new Assistant({
  // Handle new threads started with the assistant
  threadStarted: async ({ event, say, setSuggestedPrompts }) => {
    const { channel_id, thread_ts } = event.assistant_thread;
    console.log(`Thread started: ${channel_id} ${thread_ts}`);

    // Send welcome message
    //await say(WELCOME_MESSAGE);

    // Set suggested prompts
    await setSuggestedPrompts({
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
      ],
      title: 'Here are some things I can help with:'
    });
  },

  // Handle context changes (when user switches channels)
  threadContextChanged: async ({ saveThreadContext }) => {
    // Save the updated context
    await saveThreadContext();
  },

  // Handle user messages
  userMessage: async ({ client, message, say, setStatus }) => {
    // Cast message to access properties
    const msg = message as any;
    const channel = msg.channel;
    const thread_ts = msg.thread_ts;
    
    // Skip if it's from a bot
    const botUserId = await getBotId();
    if (msg.bot_id || msg.bot_id === botUserId || msg.bot_profile) return;
    
    // Set initial thinking status
    await setStatus('is thinking...');

    try {
      // Get thread history
      const messages = await getThread(channel, thread_ts, botUserId);
      
      // Generate response with progress updates
      const updateStatus = async (status: string) => {
        if (status) {
          await setStatus(status);
        }
      };
      
      const result = await generateResponse(messages, updateStatus);

      // Post final response
      await say({
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
      });

      // Clear status
      await setStatus('');
    } catch (error) {
      console.error('Error generating response:', error);
      await say('Sorry, I encountered an error while generating a response.');
      await setStatus('');
    }
  }
});
