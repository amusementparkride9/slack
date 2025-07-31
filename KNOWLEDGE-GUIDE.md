# 📚 Simple Knowledge Management Guide

## 🚀 **Three Ways to Update Knowledge After Deployment**

### **Method 1: GitHub Web Interface (EASIEST - No Redeployment!)**

**Setup (One Time):**
1. Enable live GitHub updates in Vercel:
   - Go to your Vercel project settings
   - Add environment variable: `KNOWLEDGE_GITHUB_REPO=yourusername/slack`
   - Add environment variable: `KNOWLEDGE_GITHUB_BRANCH=main`
   - Add environment variable: `KNOWLEDGE_GITHUB_PATH=knowledge`

**To Update Knowledge:**
1. Go to your GitHub repo in browser
2. Navigate to the `knowledge/` folder
3. Click "Add file" > "Create new file" or edit existing files
4. Make your changes and commit
5. **Knowledge updates automatically within 2 minutes!** ⚡

**Example:** Add new provider info:
- Create `knowledge/provider-xfinity.txt`
- Write the content, commit
- Bot automatically uses new info!

### **Method 2: Slack Commands (Update via Chat)**

Use these commands in Slack:
- `/kb refresh` - Force refresh knowledge from GitHub
- `/kb search provider xfinity` - Test if new knowledge works
- `/kb summary` - See what knowledge is loaded

### **Method 3: Local Files + Redeploy (Backup Method)**

1. Add/edit files in `/workspaces/slack/knowledge/`
2. Commit and push to GitHub
3. Redeploy to Vercel
4. Use `/kb refresh` in Slack

---

## 📝 **How to Add Knowledge Files**

### **File Naming (Auto-Detection)**
The system automatically detects content type based on filename:

**Persona/Character Files:**
- `persona.txt` ✅ (already created)
- `personality.txt` 
- `character-traits.txt`

**System Instructions:**
- `system-instructions.txt` ✅ (already created)
- `instructions.txt`
- `prompt-guidelines.txt`

**Provider Information:**
- `provider-spectrum.txt` ✅ (example created)
- `provider-xfinity.txt`
- `provider-att.txt`
- `company-verizon.txt`

**Policies & Procedures:**
- `commission-policy.txt` ✅ (already created)
- `sales-rules.txt`
- `procedure-refunds.txt`

**General Knowledge:**
- `sales-tips.txt`
- `objection-handling.txt`
- `anything-else.txt`

### **File Content Format**
Just write natural text! No special formatting required:

```
PROVIDER: AT&T Internet

Commission: $150 per sale
Special offer: $200 for gigabit sales this month

Key points:
- Fastest fiber network
- No data caps
- $50 installation fee (can be waived)

Common objections:
"Too expensive" - Focus on value and speed
"Don't need fiber" - Mention work from home needs
```

---

## ⚡ **Live Update Process (Method 1)**

1. **Edit on GitHub** (web interface)
2. **Commit changes**
3. **Wait 2 minutes** (auto-refresh)
4. **Bot uses new knowledge immediately!**

**No redeployment needed!** The bot checks GitHub every 2 minutes for updates.

---

## 🎯 **Pre-Loaded Examples**
✅ **persona.txt** - Makes the AI act like a sales admin
✅ **system-instructions.txt** - How the AI should respond  
✅ **provider-spectrum.txt** - Example provider info
✅ **commission-policy.txt** - Commission rules

---

## 💡 **Quick Tips**
- **Upload PDFs?** Copy/paste the text content into a .txt file
- **Long documents?** Break them into smaller, focused files
- **Multiple providers?** Create one file per provider
- **Complex policies?** One policy per file works best
- **Need immediate update?** Use `/kb refresh` in Slack after editing on GitHub

---

## 🔧 **Testing Your Knowledge**
- Use `/kb search commission rates` to test searches
- Use `/kb summary` to see what's loaded
- Ask the bot questions: "What's Spectrum's commission?"
- The AI will automatically find and use your knowledge!

This system handles hundreds of files easily and updates without technical complexity!
