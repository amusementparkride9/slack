# Bolt AI Slack Bot

A minimalist AI-powered Slack bot built with @slack/bolt and Vercel AI SDK. This bot uses Slack's Assistant class for a seamless AI experience in your workspace.

## Features

- **AI Assistant**: Responds to messages and provides AI-generated answers
- **Thread Context Awareness**: Maintains conversation context in threads
- **Suggested Prompts**: Offers helpful prompt suggestions to users
- **Status Updates**: Shows typing indicators during response generation
- **Vercel Integration**: Optimized for serverless deployment with proper timeout handling

## Tech Stack

- [@slack/bolt](https://slack.dev/bolt-js): Modern Slack app framework with Assistant class
- [Vercel AI SDK](https://sdk.vercel.ai/docs): Flexible AI response generation
- [TypeScript](https://www.typescriptlang.org/): Type-safe development
- [Vercel Functions](https://vercel.com/docs/functions): Serverless deployment

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps) and click "Create New App"
2. Choose "From an app manifest" and select your workspace
3. Copy the manifest below and paste it into the JSON editor:

```json
{
  "display_information": {
    "name": "AI Assistant",
    "description": "AI-powered assistant built with Bolt",
    "background_color": "#4A154B"
  },
  "features": {
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "bot_user": {
      "display_name": "AI Assistant",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "im:history",
        "im:read",
        "im:write",
        "assistant:write"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.im",
        "assistant_thread_started",
        "assistant_thread_context_changed"
      ]
    },
    "interactivity": {
      "is_enabled": true
    },
    "org_deploy_enabled": false,
    "socket_mode_enabled": false
  }
}
```

4. After creating the app, go to "OAuth & Permissions" and install the app to your workspace
5. Note down the "Bot User OAuth Token" and "Signing Secret" from the "Basic Information" page

### 3. Set Environment Variables

Create a `.env.local` file with the following variables:

```
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
OPENAI_API_KEY=your-openai-api-key
```

### 4. Run Locally (Development)

```bash
pnpm dev
```

Use a tool like [ngrok](https://ngrok.com/) to expose your local server to the internet, then update your Slack app's "Event Subscriptions" URL to `https://your-ngrok-url/api/events`.

### 5. Deploy to Vercel

```bash
vercel deploy
```

After deployment, update your Slack app's "Event Subscriptions" URL to `https://your-vercel-app.vercel.app/api/events`.

## Project Structure

- `api/events.ts`: Main entry point for Slack events
- `lib/assistant-handler.ts`: Implements the Bolt Assistant class
- `lib/bolt-app.ts`: Initializes the Bolt app and provides utility functions
- `lib/vercel-receiver.ts`: Custom receiver for Vercel serverless functions
- `lib/generate-response.ts`: Handles AI response generation with Vercel AI SDK

## Extending the Bot

To add new capabilities:

1. Enhance the Assistant class in `lib/assistant-handler.ts`
2. Add new utility functions in `lib/bolt-app.ts`
3. Update environment variables as needed

## License

MIT