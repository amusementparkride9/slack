import { tool } from 'ai'
import { z } from 'zod'

// Knowledge base integration tools
export const knowledgeBaseTools = {
  // Commission calculation tool
  calculateCommission: tool({
    description: 'Calculate commission for sales agents based on sales amount, rate, and period',
    parameters: z.object({
      salesAmount: z.number().describe('Total sales amount'),
      commissionRate: z.number().describe('Commission rate as decimal (e.g., 0.05 for 5%)'),
      period: z.enum(['monthly', 'quarterly', 'yearly']).describe('Commission period'),
      bonusThreshold: z.number().optional().describe('Bonus threshold amount'),
      bonusRate: z.number().optional().describe('Bonus rate as decimal')
    }),
    execute: async ({ salesAmount, commissionRate, period, bonusThreshold, bonusRate }) => {
      const baseCommission = salesAmount * commissionRate
      let bonus = 0
      
      if (bonusThreshold && bonusRate && salesAmount >= bonusThreshold) {
        bonus = (salesAmount - bonusThreshold) * bonusRate
      }
      
      const totalCommission = baseCommission + bonus
      
      return {
        baseCommission,
        bonus,
        totalCommission,
        period,
        salesAmount,
        effectiveRate: totalCommission / salesAmount
      }
    }
  }),

  // Company policy lookup tool
  lookupPolicy: tool({
    description: 'Look up company policies and procedures',
    parameters: z.object({
      topic: z.string().describe('Policy topic to look up (e.g., "vacation", "commission", "expenses")'),
      category: z.enum(['hr', 'sales', 'finance', 'general']).optional()
    }),
    execute: async ({ topic, category }) => {
      // This would integrate with your actual knowledge base
      // For now, returning sample policies
      const policies: Record<string, any> = {
        commission: {
          title: 'Commission Policy',
          content: `**Commission Structure:**
• Base rate: 3% on all confirmed sales
• Bonus tier: Additional 1% on sales above £50k/month
• Payment: Paid monthly, 15 days after month end
• Chargebacks: Applied to following month if customer cancels within 30 days

**Qualification Criteria:**
• Sale must be confirmed and payment received
• Customer must complete onboarding process
• No refunds or cancellations within first 30 days`,
          lastUpdated: '2024-01-15'
        },
        vacation: {
          title: 'Time Off Policy',
          content: `**Annual Leave:**
• 25 days annual leave + bank holidays
• Must be requested 2 weeks in advance
• No more than 2 weeks consecutive without manager approval

**Sick Leave:**
• Up to 10 days paid sick leave per year
• Medical certificate required for 3+ consecutive days`,
          lastUpdated: '2024-01-10'
        },
        expenses: {
          title: 'Expense Policy',
          content: `**Reimbursable Expenses:**
• Travel costs for client meetings (pre-approved)
• Phone/internet allowance: £50/month
• Training and certification costs (pre-approved)

**Submission:**
• Submit via expense portal within 30 days
• Include receipts for all expenses over £25
• Manager approval required for expenses over £200`,
          lastUpdated: '2024-01-20'
        }
      }
      
      const policy = policies[topic.toLowerCase()] || {
        title: 'Policy Not Found',
        content: 'I couldn\'t find specific information about that topic. Please contact your manager or check the employee handbook.',
        lastUpdated: null
      }
      
      return policy
    }
  }),

  // Sales process guidance tool
  getSalesGuidance: tool({
    description: 'Get guidance on sales processes and best practices',
    parameters: z.object({
      stage: z.enum(['prospecting', 'qualifying', 'presenting', 'objection-handling', 'closing', 'follow-up']),
      industry: z.string().optional().describe('Client industry if relevant'),
      dealSize: z.enum(['small', 'medium', 'large']).optional()
    }),
    execute: async ({ stage, industry, dealSize }) => {
      const guidance: Record<string, any> = {
        prospecting: {
          title: 'Prospecting Best Practices',
          tips: [
            'Research the company and decision makers thoroughly',
            'Use LinkedIn to find warm connections',
            'Prepare 3-4 relevant pain points before calling',
            'Time calls for Tuesday-Thursday, 9-11am or 2-4pm',
            'Always have a clear call-to-action for next steps'
          ],
          scripts: {
            coldCall: 'Hi [Name], this is [Your Name] from [Company]. I\'ve been working with companies like [Similar Company] to help them [specific benefit]. Do you have 2 minutes to explore if this might be relevant for [Their Company]?'
          }
        },
        qualifying: {
          title: 'Qualification Framework',
          tips: [
            'Use BANT: Budget, Authority, Need, Timeline',
            'Ask open-ended questions to understand pain points',
            'Identify all decision makers early',
            'Qualify budget range before presenting solutions',
            'Confirm timeline and decision process'
          ],
          questions: [
            'What challenges are you currently facing with [relevant area]?',
            'How are you handling this currently?',
            'What would solving this problem mean for your business?',
            'Who else would be involved in this decision?',
            'What\'s driving the timeline for this project?'
          ]
        },
        closing: {
          title: 'Closing Techniques',
          tips: [
            'Ask for the sale directly and confidently',
            'Use assumptive close when appropriate',
            'Address objections before they become deal-breakers',
            'Create urgency with legitimate time-sensitive offers',
            'Always confirm next steps and timeline'
          ],
          techniques: {
            assumptive: 'Based on everything we\'ve discussed, I\'ll get the contract prepared. When would be the best time to get this signed?',
            direct: 'Are you ready to move forward with this solution?',
            choice: 'Would you prefer to start with the standard package or the premium option?'
          }
        },
        presenting: {
          title: 'Presentation Best Practices',
          tips: ['Focus on customer benefits, not features', 'Use stories and case studies', 'Keep presentations interactive']
        },
        'objection-handling': {
          title: 'Objection Handling',
          tips: ['Listen fully before responding', 'Acknowledge the concern', 'Provide evidence to overcome objection']
        },
        'follow-up': {
          title: 'Follow-up Strategy',
          tips: ['Follow up within 24 hours', 'Provide additional value', 'Set clear next steps']
        }
      }
      
      return guidance[stage] || {
        title: 'General Sales Guidance',
        tips: ['Always focus on customer value', 'Listen more than you talk', 'Follow up consistently']
      }
    }
  }),

  // Training resource finder
  findTraining: tool({
    description: 'Find relevant training resources and materials',
    parameters: z.object({
      topic: z.string().describe('Training topic needed'),
      skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      format: z.enum(['video', 'article', 'course', 'any']).optional()
    }),
    execute: async ({ topic, skillLevel, format }) => {
      // This would integrate with your training platform
      const resources: Record<string, any[]> = {
        'cold calling': [
          {
            title: 'Cold Calling Mastery Course',
            type: 'video',
            duration: '2 hours',
            level: 'intermediate',
            url: 'https://training.company.com/cold-calling',
            description: 'Comprehensive course covering scripts, objection handling, and follow-up strategies'
          },
          {
            title: '10 Cold Calling Scripts That Work',
            type: 'article',
            duration: '15 min read',
            level: 'beginner',
            url: 'https://training.company.com/scripts',
            description: 'Proven scripts for different industries and scenarios'
          }
        ],
        'objection handling': [
          {
            title: 'Overcoming Common Objections',
            type: 'video',
            duration: '45 minutes',
            level: 'intermediate',
            url: 'https://training.company.com/objections',
            description: 'How to handle price, timing, and authority objections'
          }
        ]
      }
      
      const topicResources = resources[topic.toLowerCase()] || []
      
      return {
        topic,
        resources: topicResources,
        additionalHelp: 'Contact training@company.com for personalized training recommendations'
      }
    }
  })
}
