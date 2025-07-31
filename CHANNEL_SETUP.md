# Channel Management Setup Guide

This guide will help you set up the bot to completely manage your sales contractor channels.

## Managed Channels

### #announcements
- **Purpose**: Bot-only channel for important updates and announcements
- **Behavior**: Only the bot can post messages; user messages are automatically deleted
- **Use Cases**: Policy updates, commission changes, training announcements, deadlines

### #questions-and-support  
- **Purpose**: Main interactive support channel for contractors
- **Behavior**: Contractors can ask questions and get AI-powered responses
- **Use Cases**: Commission calculations, sales tips, policy questions, technical support

## Setup Steps

### 1. Create the Channels
1. Create a public channel named `announcements`
2. Create a public channel named `questions-and-support`
3. Invite the bot to both channels

### 2. Configure Channel Settings
For the **#announcements** channel:
- Set the channel topic to: "📢 Bot-managed announcements and updates"
- Consider pinning a message explaining the channel is bot-only
- Add channel description: "Important announcements from management. This channel is managed by our AI assistant."

For the **#questions-and-support** channel:
- Set the channel topic to: "❓ Ask your sales questions here! Get help with commissions, processes, and more."
- Pin a welcome message with common question categories

### 3. Admin Commands

The bot provides several slash commands for management:

#### `/announce [message]`
Post an announcement to the #announcements channel.
```
/announce 🚀 New commission structure takes effect Monday! Check your email for details.
```

#### `/bot-help`
Get help about available features and commands.

#### `/channel-status`
Check the status of managed channels and bot configuration.

## Channel Behaviors

### Announcements Channel (#announcements)
- ✅ **Bot posts**: Announcements, updates, reminders
- ❌ **User posts**: Automatically deleted with redirect message
- 📝 **Message format**: Professional with emojis and clear structure
- ⏰ **Scheduled posts**: Support for scheduled announcements

### Questions & Support Channel (#questions-and-support)
- ✅ **User questions**: Commission, payroll, sales process questions
- ✅ **AI responses**: Context-aware answers with suggested follow-ups
- 🔍 **Web search**: Access to current information when needed
- 📚 **Knowledge base**: Company-specific guidance and policies

## Example Interactions

### In #announcements:
```
🤖 Bot: 📢 Announcement

🎯 New Q4 Sales Targets Released!

• Individual target: $50k
• Team bonus threshold: $200k  
• Deadline: December 31st

Check your dashboard for personalized goals. Questions? Use #questions-and-support!
```

### In #questions-and-support:
```
👤 Contractor: How is my commission calculated for partial month sales?

🤖 Bot: 💰 Commission Calculation for Partial Months

For partial month sales, your commission is calculated as follows:

• **Pro-rated base**: Monthly base ÷ days in month × days worked
• **Sales commission**: Standard rate applies to all confirmed sales
• **Bonuses**: Threshold bonuses are pro-rated based on work days

**Example**: If you worked 15 days in a 30-day month with £10k sales:
• Base: £1000 ÷ 30 × 15 = £500
• Commission: £10k × 3% = £300  
• Total: £800

💡 **Suggested follow-ups:**
• When do bonuses get paid out?
• How do I track my monthly progress?
• What counts as a confirmed sale?
```

## Customization Options

### Channel-Specific Prompts
The bot uses different system prompts for each channel:
- **Announcements**: Professional, clear, actionable
- **Support**: Helpful, encouraging, solution-focused

### Welcome Messages
New channel members receive personalized welcome messages explaining channel purpose and available features.

### Administrative Controls
- Only workspace admins can use `/announce` command
- Channel status monitoring via `/channel-status`
- Error handling and logging for all channel operations

## Best Practices

### For Announcements:
- Keep messages concise and actionable
- Include relevant dates and deadlines
- Use clear subject headings
- Add emojis for visual appeal
- Include next steps or call-to-action

### For Support Interactions:
- Encourage specific questions over general ones
- Use threaded conversations for complex topics
- Regular check-ins and FAQ updates
- Monitor common questions for knowledge base improvements

## Troubleshooting

### Common Issues:

**Bot not deleting messages in #announcements:**
- Check bot permissions (needs `chat:write` and `channels:history`)
- Verify channel name matches exactly: `announcements`

**Assistant not responding in #questions-and-support:**
- Ensure bot has `assistant:write` permission
- Check that Assistant threads are enabled
- Verify bot is invited to the channel

**Slash commands not working:**
- Confirm commands are registered in Slack app manifest
- Check bot has `commands` scope
- Verify app is installed in workspace

### Support:
For technical issues or customization requests, check the bot logs or contact your workspace administrator.
