import { app } from './bolt-app'
import { postAnnouncement, scheduleAnnouncement } from './channel-config'

// Add slash command handlers for managing the bot
export function registerAdminCommands() {
  // Slash command to post announcements
  app.command('/announce', async ({ command, ack, respond, client }) => {
    await ack()
    
    try {
      const message = command.text.trim()
      
      if (!message) {
        await respond({
          response_type: 'ephemeral',
          text: 'Please provide a message to announce. Usage: `/announce Your announcement message here`'
        })
        return
      }
      
      // Post the announcement
      await postAnnouncement(`📢 **Announcement**\n\n${message}`)
      
      await respond({
        response_type: 'ephemeral',
        text: `✅ Announcement posted successfully to #announcements!`
      })
      
    } catch (error) {
      console.error('Error posting announcement:', error)
      await respond({
        response_type: 'ephemeral',
        text: '❌ Error posting announcement. Please try again.'
      })
    }
  })
  
  // Slash command to get help about the bot
  app.command('/bot-help', async ({ command, ack, respond }) => {
    await ack()
    
    const helpText = `
🤖 **Sales Team Bot Help**

**Managed Channels:**
• **#announcements** - Bot-only channel for important updates and notices
• **#questions-and-support** - Main support channel for agent questions and help

**Available Commands:**
• \`/announce [message]\` - Post an announcement (admins only)
• \`/bot-help\` - Show this help message

**Channel Features:**
• Ask questions about commissions, payroll, and sales processes
• Get help with company policies and procedures  
• Receive training tips and best practices
• Access to web search for up-to-date information

**Tips:**
• Use @AI Assistant to get my attention in any channel
• I provide suggested follow-up questions to help guide conversations
• I can search the web for current information when needed

Need more help? Just ask in #questions-and-support! 🚀
    `
    
    await respond({
      response_type: 'ephemeral',
      text: helpText.trim()
    })
  })
  
  // Slash command to get channel status
  app.command('/channel-status', async ({ command, ack, respond, client }) => {
    await ack()
    
    try {
      // Get list of channels
      const channels = await client.conversations.list({
        types: 'public_channel,private_channel'
      })
      
      const announcementsChannel = channels.channels?.find(c => c.name === 'announcements')
      const supportChannel = channels.channels?.find(c => c.name === 'questions-and-support')
      
      const statusText = `
📊 **Channel Management Status**

**#announcements**
${announcementsChannel ? '✅ Found' : '❌ Not found'} - Bot-only posting enabled

**#questions-and-support**  
${supportChannel ? '✅ Found' : '❌ Not found'} - Interactive support enabled

**Bot Status:** 🟢 Active and monitoring channels

${!announcementsChannel || !supportChannel ? '\n⚠️ Some managed channels are missing. Please create them and invite the bot.' : ''}
      `
      
      await respond({
        response_type: 'ephemeral',
        text: statusText.trim()
      })
      
    } catch (error) {
      console.error('Error getting channel status:', error)
      await respond({
        response_type: 'ephemeral',
        text: '❌ Error getting channel status.'
      })
    }
  })
}

// Helper function to check if user is admin (you can customize this logic)
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const userInfo = await app.client.users.info({ user: userId })
    // For now, consider workspace admins and owners as bot admins
    // You can customize this logic based on your needs
    return userInfo.user?.is_admin === true || userInfo.user?.is_owner === true
  } catch (error) {
    console.error('Error checking user admin status:', error)
    return false
  }
}

// Export the registration function so it can be called from events.ts
export { registerAdminCommands as default }
