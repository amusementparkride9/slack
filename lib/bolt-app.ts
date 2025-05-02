import { App, LogLevel } from '@slack/bolt';

// Initialize the Bolt app with the bot token and signing secret
export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false, // We're not using Socket Mode for Vercel
  logLevel: LogLevel.DEBUG,
});

// Export a function to get the bot user ID
export async function getBotId(): Promise<string> {
  const authTest = await app.client.auth.test();
  if (!authTest.user_id) {
    throw new Error('botUserId is undefined');
  }
  return authTest.user_id;
}

// Create a utility function for updating thread status
export function createStatusUpdater(channel: string, thread_ts: string) {
  return async (status: string) => {
    await app.client.assistant.threads.setStatus({
      channel_id: channel,
      thread_ts: thread_ts,
      status: status
    });
  };
}
