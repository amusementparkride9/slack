// Simple test to verify bot credentials and AI work
require('dotenv').config({ path: '.env.local' });

async function testBot() {
  console.log('🔍 Testing Slack Bot Configuration...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log(`✅ SLACK_BOT_TOKEN: ${process.env.SLACK_BOT_TOKEN ? 'Set' : '❌ Missing'}`);
  console.log(`✅ SLACK_SIGNING_SECRET: ${process.env.SLACK_SIGNING_SECRET ? 'Set' : '❌ Missing'}`);
  console.log(`✅ GOOGLE_GENERATIVE_AI_API_KEY: ${process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'Set' : '❌ Missing'}\n`);
  
  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
    console.log('❌ Missing Slack credentials. Please check .env.local file.');
    return;
  }
  
  // Test Slack API connection
  try {
    const { WebClient } = require('@slack/web-api');
    const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    
    console.log('🔗 Testing Slack API connection...');
    const authTest = await slack.auth.test();
    console.log(`✅ Connected to Slack as: ${authTest.user} (${authTest.team})\n`);
    
  } catch (error) {
    console.log(`❌ Slack API Error: ${error.message}\n`);
  }
  
  // Test AI connection
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      console.log('🤖 Testing Google Gemini AI...');
      const { google } = require('@ai-sdk/google');
      const { generateText } = require('ai');
      
      const { text } = await generateText({
        model: google('gemini-2.5-pro'),
        prompt: 'Reply with exactly: "AI connection successful!"',
        maxTokens: 20
      });
      
      console.log(`✅ AI Response: ${text}\n`);
      
    } catch (error) {
      console.log(`❌ AI Error: ${error.message}\n`);
    }
  }
  
  console.log('🎉 Bot configuration test complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Deploy to Vercel: vercel deploy');
  console.log('2. Update Slack app Event Subscriptions URL');
  console.log('3. Create #announcements and #questions-and-support channels');
  console.log('4. Invite the bot to both channels');
}

testBot().catch(console.error);
