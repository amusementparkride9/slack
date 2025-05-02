import { app } from './bolt-app';

// Handle the /echo slash command
app.command('/echo', async ({ command, ack, respond }) => {
  // Acknowledge command request
  await ack();

  // Respond to the slash command
  await respond(`You said: ${command.text}`);
});

// Handle the /help slash command
app.command('/help', async ({ command, ack, respond }) => {
  // Acknowledge command request
  await ack();

  // Respond with help information
  await respond({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Available Commands*'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '• `/echo [text]` - Echo back the text you provide\n• `/help` - Show this help message'
        }
      }
    ]
  });
});
