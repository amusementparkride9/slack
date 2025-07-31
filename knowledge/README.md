# Dynamic Knowledge Base Management

This system allows you to update the bot's knowledge without redeployment through multiple methods:

## Method 1: GitHub Repository (Recommended)
Set up a separate GitHub repository for your knowledge base:

1. Create a new repo: `your-company-knowledge`
2. Add JSON files with knowledge items
3. Set environment variable: `KNOWLEDGE_GITHUB_URL=https://raw.githubusercontent.com/yourusername/your-company-knowledge/main/knowledge.json`

## Method 2: API Endpoint
Host your knowledge on any API:

```bash
# Set these environment variables
KNOWLEDGE_API_URL=https://your-api.com/knowledge
KNOWLEDGE_API_KEY=your-api-key
```

## Method 3: Local Files (Fallback)
Update files in the `knowledge/` directory and redeploy.

## Knowledge Item Format
```json
{
  "id": "unique-identifier",
  "title": "Display Title",
  "content": "Full content with formatting",
  "category": "category-name",
  "tags": ["tag1", "tag2"],
  "lastUpdated": "2025-01-31"
}
```

## Admin Commands
- `!kb refresh` - Refresh knowledge cache
- `!kb search <query>` - Test knowledge search
- `!kb categories` - List all categories

## Easy Update Workflows

### Option A: GitHub File Updates
1. Go to your knowledge repository
2. Edit the JSON file directly on GitHub
3. Commit changes
4. Knowledge updates automatically (cached for 5 minutes)

### Option B: Notion/Airtable Integration
1. Maintain knowledge in Notion or Airtable
2. Use automation tools (Zapier, Make.com) to export to GitHub/API
3. Knowledge syncs automatically

### Option C: Google Sheets
1. Create Google Sheet with knowledge
2. Use Google Apps Script to publish as JSON API
3. Set API URL in environment variables

## Categories
- `compensation` - Pay, commissions, bonuses
- `sales-tips` - Sales techniques and strategies  
- `policies` - Company policies and procedures
- `tools` - How to use company tools/systems
- `onboarding` - New contractor information
- `training` - Training materials and courses
