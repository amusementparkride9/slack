import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: string;
}

class KnowledgeBase {
  private cache: Map<string, KnowledgeItem> = new Map();
  private lastLoaded: number = 0;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadKnowledge();
  }

  private loadKnowledge() {
    try {
      // Try to load from external source first (GitHub, API, etc.)
      this.loadFromExternal();
    } catch (error) {
      console.log('External knowledge source not available, using local fallback');
      this.loadFromLocal();
    }
    this.lastLoaded = Date.now();
  }

  private async loadFromExternal() {
    // Option 1: Load from GitHub repository
    if (process.env.KNOWLEDGE_GITHUB_URL) {
      const response = await fetch(process.env.KNOWLEDGE_GITHUB_URL);
      const data = await response.json() as KnowledgeItem[];
      data.forEach(item => this.cache.set(item.id, item));
      return;
    }

    // Option 2: Load from API endpoint
    if (process.env.KNOWLEDGE_API_URL) {
      const response = await fetch(process.env.KNOWLEDGE_API_URL, {
        headers: {
          'Authorization': `Bearer ${process.env.KNOWLEDGE_API_KEY}`,
        },
      });
      const data = await response.json() as KnowledgeItem[];
      data.forEach(item => this.cache.set(item.id, item));
      return;
    }

    throw new Error('No external knowledge source configured');
  }

  private loadFromLocal() {
    // Load from local knowledge files
    const knowledgeDir = join(process.cwd(), 'knowledge');
    
    if (!existsSync(knowledgeDir)) {
      console.log('No local knowledge directory found');
      return;
    }

    // Load base knowledge
    const baseKnowledgePath = join(knowledgeDir, 'base.json');
    if (existsSync(baseKnowledgePath)) {
      const data = JSON.parse(readFileSync(baseKnowledgePath, 'utf-8')) as KnowledgeItem[];
      data.forEach(item => this.cache.set(item.id, item));
    }
  }

  private shouldRefresh(): boolean {
    return Date.now() - this.lastLoaded > this.cacheTimeout;
  }

  async search(query: string, category?: string): Promise<KnowledgeItem[]> {
    if (this.shouldRefresh()) {
      this.loadKnowledge();
    }

    const items = Array.from(this.cache.values());
    const searchTerms = query.toLowerCase().split(' ');
    
    return items
      .filter(item => {
        if (category && item.category !== category) return false;
        
        const searchText = `${item.title} ${item.content} ${item.tags.join(' ')}`.toLowerCase();
        return searchTerms.some(term => searchText.includes(term));
      })
      .sort((a, b) => {
        // Score by relevance (title matches score higher)
        const aScore = a.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 1;
        const bScore = b.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 1;
        return bScore - aScore;
      })
      .slice(0, 5); // Return top 5 results
  }

  async getByCategory(category: string): Promise<KnowledgeItem[]> {
    if (this.shouldRefresh()) {
      this.loadKnowledge();
    }

    return Array.from(this.cache.values())
      .filter(item => item.category === category);
  }

  async getAll(): Promise<KnowledgeItem[]> {
    if (this.shouldRefresh()) {
      this.loadKnowledge();
    }

    return Array.from(this.cache.values());
  }

  // Method to manually refresh knowledge (can be called via admin command)
  async refresh(): Promise<void> {
    this.cache.clear();
    this.loadKnowledge();
  }
}

export const knowledgeBase = new KnowledgeBase();
