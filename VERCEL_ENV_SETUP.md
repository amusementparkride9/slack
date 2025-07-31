# Vercel Environment Variables Setup Guide

## Required Environment Variables

Add these to your Vercel project settings:

### Slack Configuration
```
SLACK_BOT_TOKEN=xoxb-your-bot-token-from-slack-app
SLACK_SIGNING_SECRET=your-signing-secret-from-slack-app
```

### AI Configuration  
```
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key-from-google-ai-studio
```

## How to Add to Vercel:

1. Go to your Vercel dashboard
2. Find your deployed project
3. Go to Settings > Environment Variables
4. Add each variable above with your actual values
5. Redeploy or trigger a new deployment

## Test After Deployment:

Your Vercel URL will be something like: `https://your-project-name.vercel.app`

Test the endpoint: `https://your-project-name.vercel.app/api/events`

You should see a response indicating the Slack events endpoint is ready.
