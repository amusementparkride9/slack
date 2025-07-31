# Testing Guide for Sales Team AI Assistant

## Quick Setup & Testing Checklist

### 1. Pre-Testing Requirements ✅

Before testing, ensure you have:
- [ ] Slack workspace with admin access
- [ ] Google AI API key from [AI Studio](https://aistudio.google.com/app/apikey)
- [ ] Node.js and pnpm installed
- [ ] ngrok or similar tunneling tool for local testing

### 2. Local Development Testing

#### Step 1: Install Dependencies
```bash
pnpm install
```

#### Step 2: Set Environment Variables
Create `.env.local`:
```
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key-here
```

#### Step 3: Start Development Server
```bash
pnpm dev
```

#### Step 4: Expose Local Server
```bash
# In another terminal
ngrok http 3000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) for Slack app configuration.

### 3. Slack App Configuration Testing

#### Create Test Channels
1. Create `#announcements` channel (for bot-only announcements)
2. Create `#questions-and-support` channel (for interactive support)
3. Invite the bot to both channels

#### Test Bot Permissions
```bash
# Check if bot can read messages
# Check if bot can post messages
# Check if bot can delete messages (for bot-only channels)
```

### 4. Core Functionality Tests

#### Test 1: Channel Management 🏢
**Expected Behavior**: Bot should delete any human messages in `#announcements`

**Test Steps**:
1. Post a message in `#announcements` channel
2. ✅ **Expected**: Bot deletes the message within seconds
3. ✅ **Expected**: Bot sends DM explaining the channel is bot-only

**Test Command**:
```
Test message in announcements - should be deleted
```

#### Test 2: AI Assistant Response 🤖
**Expected Behavior**: Bot responds with structured answers using Gemini

**Test Steps**:
1. Mention the bot in `#questions-and-support`: `@assistant What are our commission rates?`
2. ✅ **Expected**: Bot responds with structured answer including:
   - Title and message title with emojis
   - Detailed response in Slack format
   - Three follow-up questions
   - Commission calculation tool usage

**Test Command**:
```
@assistant What are our commission rates for a $5000 sale?
```

#### Test 3: Knowledge Base Tools 💰
**Expected Behavior**: Bot uses specialized tools for accurate information

**Test Scenarios**:

**Commission Calculator**:
```
@assistant Calculate commission for $10000 sale with 2 years experience
```
✅ **Expected**: Accurate calculation with bonus tiers

**Policy Lookup**:
```
@assistant What's our vacation policy?
```
✅ **Expected**: Detailed policy information

**Sales Guidance**:
```
@assistant I'm struggling with lead qualification, can you help?
```
✅ **Expected**: Stage-specific coaching with scripts

**Training Resources**:
```
@assistant I'm an intermediate salesperson, what training do you recommend?
```
✅ **Expected**: Personalized training recommendations

#### Test 4: Admin Commands 👑
**Expected Behavior**: Admin slash commands work properly

**Test Commands**:
```
/announce Important company update: New commission structure effective immediately
/bot-help
/channel-status
```

✅ **Expected**: 
- Announcement posted to `#announcements`
- Help information displayed
- Channel status report shown

#### Test 5: Thread Context 🧵
**Expected Behavior**: Bot maintains context in thread conversations

**Test Steps**:
1. Start conversation: `@assistant How do I close a deal?`
2. Reply in thread: `What about objection handling?`
3. ✅ **Expected**: Bot remembers previous context about deal closing

### 5. Error Handling Tests ⚠️

#### Test API Failures
1. Temporarily use invalid Gemini API key
2. ✅ **Expected**: Graceful error messages, no crashes

#### Test Rate Limits
1. Send multiple rapid requests
2. ✅ **Expected**: Appropriate rate limiting, queue management

#### Test Invalid Inputs
1. Send very long messages (>4000 chars)
2. Send special characters and emojis
3. ✅ **Expected**: Proper handling without errors

### 6. Production Deployment Testing

#### Vercel Deployment
```bash
# Deploy to Vercel
vercel deploy

# Update Slack app Event Subscriptions URL to:
# https://your-app.vercel.app/api/events
```

#### Production Health Checks
1. **Event Handling**: Send test message, verify response within 3 seconds
2. **Tool Usage**: Test commission calculator with real scenarios
3. **Channel Management**: Verify bot-only enforcement works
4. **Error Logging**: Check Vercel function logs for any errors

### 7. Performance Testing 📊

#### Response Time Benchmarks
- ✅ Simple questions: <2 seconds
- ✅ Commission calculations: <3 seconds
- ✅ Complex policy lookups: <5 seconds

#### Load Testing
```bash
# Test multiple simultaneous users
# Expected: No degradation up to 10 concurrent users
```

### 8. User Acceptance Testing 👥

#### Real User Scenarios
1. **New Contractor Onboarding**:
   - Ask about commission structure
   - Request training materials
   - Inquire about company policies

2. **Daily Operations**:
   - Quick commission calculations
   - Sales guidance requests
   - Policy clarifications

3. **Admin Tasks**:
   - Post company announcements
   - Check channel status
   - Monitor bot performance

### 9. Monitoring & Maintenance 📈

#### Key Metrics to Track
- Response success rate (target: >99%)
- Average response time (target: <3s)
- Tool usage frequency
- User satisfaction feedback

#### Weekly Health Checks
- [ ] Verify all channels accessible
- [ ] Test core AI functionality
- [ ] Check Gemini API quota usage
- [ ] Review error logs
- [ ] Test admin commands

### 10. Common Issues & Solutions 🔧

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Bot not responding | No messages from bot | Check Slack tokens, verify event URL |
| AI errors | Generic error messages | Verify Gemini API key, check quotas |
| Slow responses | >10s response time | Check Vercel function timeout, API limits |
| Tool failures | Missing commission calculations | Verify knowledge-tools.ts configuration |
| Permission errors | Can't delete messages | Check Slack app OAuth scopes |

### 11. Success Criteria ✅

Your bot is working perfectly when:
- [ ] Bot-only channels enforce message deletion
- [ ] AI responses are contextual and helpful
- [ ] Commission calculations are accurate
- [ ] Knowledge base tools provide relevant information
- [ ] Admin commands execute successfully
- [ ] Response times are under 3 seconds
- [ ] No errors in production logs
- [ ] Users report positive experience

## Quick Test Script

Run this complete test in your Slack workspace:

1. **Setup Test**: Create channels, invite bot
2. **Channel Test**: Post in `#announcements` → should be deleted
3. **AI Test**: `@assistant Calculate commission for $5000 sale` → should get detailed response
4. **Tool Test**: `@assistant What's our vacation policy?` → should get policy info
5. **Admin Test**: `/announce Test message` → should post to announcements
6. **Thread Test**: Start conversation, continue in thread → should maintain context

If all tests pass, your bot is production-ready! 🚀
