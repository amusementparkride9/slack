import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';

export interface KnowledgeSource {
  filename: string;
  content: string;
  type: 'text' | 'instruction' | 'persona' | 'provider' | 'policy';
  lastModified: Date;
}

class SimpleKnowledgeManager {
  private knowledge: KnowledgeSource[] = [];
  private lastLoaded: number = 0;
  private knowledgeDir = join(process.cwd(), 'knowledge');
  private cacheTimeout = 2 * 60 * 1000; // 2 minutes cache

  constructor() {
    this.loadAllKnowledge();
  }

  private async loadAllKnowledge() {
    this.knowledge = [];
    
    // Try to load from GitHub first (live updates)
    if (process.env.KNOWLEDGE_GITHUB_REPO) {
      try {
        await this.loadFromGitHub();
        console.log(`📚 Loaded knowledge from GitHub`);
        this.lastLoaded = Date.now();
        return;
      } catch (error) {
        console.log('GitHub knowledge not available, using local files');
      }
    }
    
    // Fallback to local files
    this.loadFromLocal();
    this.lastLoaded = Date.now();
  }

  private async loadFromGitHub() {
    const repo = process.env.KNOWLEDGE_GITHUB_REPO; // e.g., "yourusername/your-repo"
    const branch = process.env.KNOWLEDGE_GITHUB_BRANCH || 'main';
    const path = process.env.KNOWLEDGE_GITHUB_PATH || 'knowledge';
    
    // Get list of files from GitHub API
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;
    const response = await fetch(apiUrl);
    const files = await response.json();
    
    if (!Array.isArray(files)) {
      throw new Error('Invalid GitHub response');
    }
    
    // Load each file
    for (const file of files) {
      if (file.type === 'file' && file.download_url) {
        try {
          const content = await fetch(file.download_url);
          const text = await content.text();
          
          this.knowledge.push({
            filename: file.name,
            content: text,
            type: this.determineFileType(file.name),
            lastModified: new Date()
          });
        } catch (error) {
          console.log(`Failed to load ${file.name}:`, error);
        }
      }
    }
  }

  private loadFromLocal() {
    if (!existsSync(this.knowledgeDir)) {
      console.log('Knowledge directory not found');
      return;
    }

    const files = readdirSync(this.knowledgeDir, { recursive: true });
    
    for (const file of files) {
      const filePath = join(this.knowledgeDir, file.toString());
      
      if (statSync(filePath).isDirectory()) continue;
      
      try {
        const content = readFileSync(filePath, 'utf-8');
        const filename = file.toString();
        
        this.knowledge.push({
          filename,
          content,
          type: this.determineFileType(filename),
          lastModified: statSync(filePath).mtime
        });
      } catch (error) {
        console.log(`Skipping file ${file}: ${error}`);
      }
    }
    
    console.log(`📚 Loaded ${this.knowledge.length} local knowledge files`);
  }

  private determineFileType(filename: string): KnowledgeSource['type'] {
    const lower = filename.toLowerCase();
    
    if (lower.includes('persona') || lower.includes('personality') || lower.includes('character')) {
      return 'persona';
    }
    if (lower.includes('instruction') || lower.includes('system') || lower.includes('prompt')) {
      return 'instruction';
    }
    if (lower.includes('provider') || lower.includes('company') || lower.includes('vendor')) {
      return 'provider';
    }
    if (lower.includes('policy') || lower.includes('rule') || lower.includes('procedure')) {
      return 'policy';
    }
    
    return 'text';
  }

  private shouldRefresh(): boolean {
    return Date.now() - this.lastLoaded > this.cacheTimeout;
  }

  // Get all persona/character instructions
  getPersonaInstructions(): string {
    if (this.shouldRefresh()) {
      this.loadAllKnowledge();
    }
    const personaFiles = this.knowledge.filter(k => k.type === 'persona');
    return personaFiles.map(f => f.content).join('\n\n');
  }

  // Get all system instructions
  getSystemInstructions(): string {
    if (this.shouldRefresh()) {
      this.loadAllKnowledge();
    }
    const instructionFiles = this.knowledge.filter(k => k.type === 'instruction');
    return instructionFiles.map(f => f.content).join('\n\n');
  }

  // Search all knowledge for relevant content
  searchKnowledge(query: string): string {
    if (this.shouldRefresh()) {
      this.loadAllKnowledge();
    }
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    const results: Array<{content: string, score: number, filename: string}> = [];
    
    for (const source of this.knowledge) {
      const content = source.content.toLowerCase();
      let score = 0;
      
      for (const term of searchTerms) {
        const matches = (content.match(new RegExp(term, 'g')) || []).length;
        score += matches;
      }
      
      if (score > 0) {
        results.push({
          content: source.content,
          score,
          filename: source.filename
        });
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(r => `**From ${r.filename}:**\n${r.content}`)
      .join('\n\n---\n\n');
  }

  // Get all knowledge as context
  getAllKnowledge(): string {
    if (this.shouldRefresh()) {
      this.loadAllKnowledge();
    }
    return this.knowledge
      .map(k => `**${k.filename}:**\n${k.content}`)
      .join('\n\n---\n\n');
  }

  // Refresh knowledge (call this when files change)
  async refresh(): Promise<void> {
    await this.loadAllKnowledge();
  }

  // Get summary of loaded knowledge
  getSummary(): string {
    if (this.shouldRefresh()) {
      this.loadAllKnowledge();
    }
    
    const byType = this.knowledge.reduce((acc, k) => {
      acc[k.type] = (acc[k.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return `📚 **Knowledge Summary:**
Total files: ${this.knowledge.length}
• Persona files: ${byType.persona || 0}
• Instructions: ${byType.instruction || 0}
• Provider info: ${byType.provider || 0}
• Policies: ${byType.policy || 0}
• Other content: ${byType.text || 0}

Last loaded: ${new Date(this.lastLoaded).toLocaleString()}
Auto-refresh: Every 2 minutes`;
  }
}

export const simpleKnowledge = new SimpleKnowledgeManager();
