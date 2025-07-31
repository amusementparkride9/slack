#!/usr/bin/env node

/**
 * Quick Bot Functionality Test Script
 * Run this to verify core components work before deploying
 */

const { google } = require('@ai-sdk/google');
const { generateObject } = require('ai');
const { z } = require('zod');

// Test schema matching what the bot uses
const TestSchema = z.object({
  title: z.string(),
  messageTitle: z.string(),
  response: z.string(),
  followups: z.array(z.string()),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string()
  })).optional()
});

async function testGeminiIntegration() {
  console.log('🧪 Testing Gemini AI Integration...\n');
  
  // Check environment variables
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('❌ GOOGLE_GENERATIVE_AI_API_KEY not found in environment');
    console.log('💡 Add your Gemini API key to .env.local');
    return false;
  }

  try {
    const { object } = await generateObject({
      model: google('gemini-1.5-pro'),
      schema: TestSchema,
      messages: [
        { 
          role: 'user', 
          content: 'Test question: What is a sales commission and how is it calculated?' 
        }
      ],
      temperature: 0.7,
      maxRetries: 2
    });

    console.log('✅ Gemini API Connection: SUCCESS');
    console.log('✅ Structured Response Generation: SUCCESS');
    console.log('✅ Response Schema Validation: SUCCESS\n');
    
    console.log('📝 Sample Response:');
    console.log(`Title: ${object.title}`);
    console.log(`Message Title: ${object.messageTitle}`);
    console.log(`Response: ${object.response.substring(0, 100)}...`);
    console.log(`Follow-ups: ${object.followups.length} questions generated\n`);
    
    return true;
  } catch (error) {
    console.error('❌ Gemini Integration Test Failed:');
    console.error(error.message);
    
    if (error.message.includes('API key')) {
      console.log('💡 Check your GOOGLE_GENERATIVE_AI_API_KEY is valid');
    } else if (error.message.includes('quota')) {
      console.log('💡 Check your Gemini API quota limits');
    } else {
      console.log('💡 Check your internet connection and API access');
    }
    
    return false;
  }
}

async function testKnowledgeBaseTools() {
  console.log('🔧 Testing Knowledge Base Tools...\n');
  
  try {
    // Import our knowledge base tools
    const { knowledgeBaseTools } = require('./lib/ai/knowledge-tools');
    
    console.log('✅ Knowledge Base Tools Import: SUCCESS');
    console.log(`✅ Available Tools: ${Object.keys(knowledgeBaseTools).length}`);
    
    // List available tools
    const toolNames = Object.keys(knowledgeBaseTools);
    console.log('📋 Tool Inventory:');
    toolNames.forEach(tool => {
      console.log(`   - ${tool}`);
    });
    
    console.log('\n✅ Knowledge Base Tools: READY\n');
    return true;
  } catch (error) {
    console.error('❌ Knowledge Base Tools Test Failed:');
    console.error(error.message);
    return false;
  }
}

async function testChannelConfiguration() {
  console.log('🏢 Testing Channel Configuration...\n');
  
  try {
    // Import channel config
    const { CHANNEL_CONFIG, getChannelInfo } = require('./lib/channel-config');
    
    console.log('✅ Channel Configuration Import: SUCCESS');
    console.log(`✅ Configured Channels: ${Object.keys(CHANNEL_CONFIG).length}`);
    
    // Test channel info retrieval
    const channels = Object.keys(CHANNEL_CONFIG);
    channels.forEach(channelId => {
      const info = getChannelInfo(channelId);
      console.log(`📢 ${info.name}: ${info.type} channel`);
    });
    
    console.log('\n✅ Channel Configuration: READY\n');
    return true;
  } catch (error) {
    console.error('❌ Channel Configuration Test Failed:');
    console.error(error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Sales Team AI Assistant - Pre-Deployment Tests\n');
  console.log('=' .repeat(50) + '\n');
  
  const tests = [
    { name: 'Channel Configuration', fn: testChannelConfiguration },
    { name: 'Knowledge Base Tools', fn: testKnowledgeBaseTools },
    { name: 'Gemini AI Integration', fn: testGeminiIntegration }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} test crashed:`, error.message);
      failed++;
    }
    
    console.log('-'.repeat(50) + '\n');
  }
  
  // Final results
  console.log('📊 TEST RESULTS:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Your bot is ready for deployment.');
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy with: vercel deploy');
    console.log('2. Update Slack app Event Subscriptions URL');
    console.log('3. Create #announcements and #questions-and-support channels');
    console.log('4. Invite bot to channels');
    console.log('5. Test with: @assistant Hello!');
  } else {
    console.log(`\n⚠️  ${failed} tests failed. Fix issues before deploying.`);
    console.log('\n💡 Check:');
    console.log('- Environment variables in .env.local');
    console.log('- API keys are valid and have quota');
    console.log('- All dependencies installed with: pnpm install');
  }
}

// Handle graceful exit
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled error:', error.message);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testGeminiIntegration, testKnowledgeBaseTools, testChannelConfiguration };
