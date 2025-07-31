import { tool } from 'ai'
import { z } from 'zod'

// Knowledge base integration tools
export const knowledgeBaseTools = {
  // Commission calculation tool - Updated for tiered commission structure
  calculateCommission: tool({
    description: 'Calculate weekly commission for sales agents based on product tiers and sales volume using our tiered commission structure',
    parameters: z.object({
      sales: z.array(z.object({
        productTier: z.enum(['platinum', 'gold', 'silver', 'bronze']).describe('Product tier'),
        provider: z.string().optional().describe('Provider name (e.g., Xfinity, Frontier)'),
        productName: z.string().optional().describe('Specific product name')
      })).describe('Array of sales made in the week'),
      vasAttachments: z.number().optional().describe('Number of Value-Added Services attached this month'),
      totalMonthlySales: z.number().optional().describe('Total sales for the month (for VAS bonus calculation)'),
      installationWeek: z.string().optional().describe('Week of installation (format: YYYY-MM-DD)')
    }),
    execute: async ({ sales, vasAttachments = 0, totalMonthlySales = 0, installationWeek }) => {
      // Commission rates by tier and volume
      const commissionRates = {
        platinum: { entry: 130, pro: 155, elite: 180 },
        gold: { entry: 100, pro: 125, elite: 150 },
        silver: { entry: 80, pro: 95, elite: 110 },
        bronze: { entry: 35, pro: 45, elite: 60 }
      }
      
      const totalSales = sales.length
      let volumeTier: 'entry' | 'pro' | 'elite'
      
      // Determine volume tier
      if (totalSales >= 9) {
        volumeTier = 'elite'
      } else if (totalSales >= 5) {
        volumeTier = 'pro'
      } else {
        volumeTier = 'entry'
      }
      
      // Calculate base commission
      let totalCommission = 0
      const breakdown = sales.map(sale => {
        const rate = commissionRates[sale.productTier][volumeTier]
        totalCommission += rate
        return {
          productTier: sale.productTier,
          provider: sale.provider,
          productName: sale.productName,
          commission: rate,
          volumeTier
        }
      })
      
      // Calculate VAS bonus if applicable
      let vasBonus = 0
      let vasRate = 0
      if (totalMonthlySales > 0 && vasAttachments > 0) {
        const vasPercentage = (vasAttachments / totalMonthlySales) * 100
        
        if (vasPercentage >= 50) {
          vasRate = 30
        } else if (vasPercentage >= 35) {
          vasRate = 20
        } else if (vasPercentage >= 20) {
          vasRate = 10
        }
        
        vasBonus = vasAttachments * vasRate
      }
      
      const grandTotal = totalCommission + vasBonus
      
      return {
        weeklyCommission: totalCommission,
        vasBonus,
        grandTotal,
        totalSales,
        volumeTier,
        breakdown,
        vasInfo: {
          attachments: vasAttachments,
          totalMonthlySales,
          rate: vasRate,
          percentage: totalMonthlySales > 0 ? (vasAttachments / totalMonthlySales) * 100 : 0
        },
        installationWeek,
        summary: `${totalSales} sales at ${volumeTier} tier = $${totalCommission}${vasBonus > 0 ? ` + $${vasBonus} VAS bonus` : ''} = $${grandTotal} total`
      }
    }
  }),

  // Company policy lookup tool
  lookupPolicy: tool({
    description: 'Look up company policies and procedures',
    parameters: z.object({
      topic: z.string().describe('Policy topic to look up (e.g., "commission", "vacation", "chargebacks", "pay schedule")'),
      category: z.enum(['hr', 'sales', 'finance', 'commission', 'general']).optional()
    }),
    execute: async ({ topic, category }) => {
      const policies: Record<string, any> = {
        commission: {
          title: 'Commission Structure',
          content: `**Weekly Commission Tiers:**
• **Entry Rate (1-4 Sales/Week):** Platinum: $130, Gold: $100, Silver: $80, Bronze: $35
• **Pro Rate (5-8 Sales/Week):** Platinum: $155, Gold: $125, Silver: $95, Bronze: $45  
• **Elite Rate (9+ Sales/Week):** Platinum: $180, Gold: $150, Silver: $110, Bronze: $60

**Key Rules:**
• Sales count based on INSTALLATION date, not order date
• Pay period: Monday to Sunday
• Payment: 8-10 days after pay period ends
• VAS bonuses: 20-34% = $10, 35-49% = $20, 50%+ = $30 per attachment`,
          lastUpdated: '2025-01-31'
        },
        'pay schedule': {
          title: 'Payment Schedule',
          content: `**Payment Timeline:**
• Pay period: Monday to Sunday  
• Commission paid: 8-10 days after pay period ends
• Typical payment: Monday-Wednesday of following week

**Why the delay?**
We must receive confirmation and payment from service providers (Xfinity, Frontier, etc.) before issuing commissions. This ensures accuracy and verification.`,
          lastUpdated: '2025-01-31'
        },
        chargebacks: {
          title: 'Chargeback Policy',
          content: `**Important:** If a customer disconnects within the provider's chargeback window (typically first 90 days), the commission will be reversed.

**Reasons for chargebacks:**
• Non-payment by customer
• Voluntary cancellation
• Fraud

**Policy:** Full commission amount will be deducted from future earnings. This policy is non-negotiable as it's tied to provider payments.`,
          lastUpdated: '2025-01-31'
        },
        'product tiers': {
          title: 'Product Tier Classifications',
          content: `**PLATINUM TIER (Highest Value):**
• Brightspeed: Fiber 2G
• Frontier: Fiber Optic 5 Gig, Fiber Internet 2 Gig
• Kinetic: Kinetic Fiber Gig (1 Gig & Greater)
• Metronet: 2 Gig, 3 Gig, or 5 Gig
• Optimum: Broadband 5 Gbps, Broadband 2 Gbps

**GOLD TIER:** Brightspeed Fiber >600M-1G, EarthLink HyperLink 100M+, Frontier Fiber 1 Gig, etc.
**SILVER TIER:** Mid-tier products including DIRECTV packages, Spectrum 1 Gig, Xfinity 1-2 Gig
**BRONZE TIER:** Entry-level products under 500M speeds`,
          lastUpdated: '2025-01-31'
        },
        vas: {
          title: 'Value-Added Services (VAS) Bonus',
          content: `**VAS includes:** Voice/Phone, Security/Secure, Video/TV Packages
**Excluded:** Mobile plans (have separate flat rates)

**Monthly Bonus Tiers:**
• Pro Attachment Rate (20-34%): $10 per attached order
• Elite Attachment Rate (35-49%): $20 per attached order  
• Top Performer Rate (50%+): $30 per attached order

**How it works:** Calculate % of monthly sales with VAS attachments to determine bonus tier.`,
          lastUpdated: '2025-01-31'
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
        }
      }
      
      const policy = policies[topic.toLowerCase()] || {
        title: 'Policy Not Found',
        content: 'I couldn\'t find specific information about that topic. Please check the commission guide or contact your manager.',
        lastUpdated: null
      }
      
      return policy
    }
  }),

  // Product tier lookup tool
  getProductTier: tool({
    description: 'Look up which commission tier a specific product belongs to',
    parameters: z.object({
      provider: z.string().describe('Provider name (e.g., Xfinity, Frontier, Spectrum)'),
      productName: z.string().optional().describe('Specific product name or speed'),
      speed: z.string().optional().describe('Internet speed (e.g., 1 Gig, 500M, 2G)')
    }),
    execute: async ({ provider, productName = '', speed = '' }) => {
      const providerName = provider.toLowerCase()
      const product = `${productName} ${speed}`.toLowerCase()
      
      // Product tier mappings based on your commission guide
      const tierMappings: Record<string, Record<string, string[]>> = {
        brightspeed: {
          platinum: ['fiber 2g', '2 gig', '2g'],
          gold: ['fiber >600m', 'fiber 1g', '1 gig', 'up to 1g'],
          silver: ['fiber 300m', '300m', 'below 300m']
        },
        frontier: {
          platinum: ['fiber optic 5 gig', '5 gig', 'fiber internet 2 gig', '2 gig'],
          gold: ['fiber internet 1 gig', '1 gig'],
          silver: ['fiber internet 500m', '500m'],
          bronze: ['fiber internet under 500m', 'under 500m', 'hsi', 'upgrades']
        },
        kinetic: {
          platinum: ['kinetic fiber gig', 'fiber gig', '1 gig & greater', 'above 1 gig'],
          silver: ['kinetic fiber', '500m to 1 gig'],
          bronze: ['kinetic internet', 'under 500m']
        },
        metronet: {
          platinum: ['2 gig', '3 gig', '5 gig'],
          gold: ['1 gig'],
          silver: ['500 mb']
        },
        optimum: {
          platinum: ['broadband 5 gbps', '5 gbps', 'broadband 2 gbps', '2 gbps'],
          gold: ['broadband 1 gbps', '1 gbps'],
          silver: ['broadband 500 mbps', '500 mbps'],
          bronze: ['broadband 300', 'broadband 400m', '300m', '400m'],
          flat: ['< 300m'] // Special flat rate
        },
        earthlink: {
          gold: ['hyperlink internet 100m+', 'hyperlink', '100m+'],
          silver: ['wireless home internet', 'whi']
        },
        directv: {
          silver: ['all packages', 'low risk'],
          flat: ['medium risk', 'high risk'] // Special flat rate
        },
        spectrum: {
          silver: ['1 gig', 'premier'],
          bronze: ['advantage'],
          flat: ['2-play', '3-play'] // Special flat rate
        },
        xfinity: {
          silver: ['1.2 gig', '2 gig', '1 gig'],
          bronze: ['300 mbps', '500 mbps', 'internet essentials plus'],
          flat: ['mobile'] // Special flat rate
        },
        altafiber: {
          bronze: ['fioptics 750mb', 'fioptics 1g', 'fioptics 100mb', 'fioptics 500mb'],
          flat: ['dsl', '< 50mb'] // Special flat rate
        }
      }
      
      const providerTiers = tierMappings[providerName]
      if (!providerTiers) {
        return {
          provider,
          productName,
          tier: 'unknown',
          commission: 'Provider not found in tier mappings',
          suggestion: 'Please check the provider name or contact your manager'
        }
      }
      
      // Find matching tier
      for (const [tier, products] of Object.entries(providerTiers)) {
        if (products.some((p: string) => product.includes(p) || p.includes(product.trim()))) {
          const rates = tier === 'flat' ? 'Flat rate (see special commissions)' : {
            platinum: 'Entry: $130, Pro: $155, Elite: $180',
            gold: 'Entry: $100, Pro: $125, Elite: $150', 
            silver: 'Entry: $80, Pro: $95, Elite: $110',
            bronze: 'Entry: $35, Pro: $45, Elite: $60'
          }[tier as 'platinum' | 'gold' | 'silver' | 'bronze']
          
          return {
            provider,
            productName,
            tier: tier === 'flat' ? 'special/flat-rate' : tier,
            commission: rates,
            note: tier === 'flat' ? 'This product has special flat-rate commission and does not count toward weekly volume totals' : 'Rates depend on your weekly sales volume (1-4: Entry, 5-8: Pro, 9+: Elite)'
          }
        }
      }
      
      return {
        provider,
        productName,
        tier: 'not found',
        commission: 'Product not found in tier mappings',
        suggestion: 'Please verify the product name or contact your manager for clarification'
      }
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
