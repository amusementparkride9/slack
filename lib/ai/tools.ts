import { knowledgeBaseTools } from './knowledge-tools'

export const tools = {
  // Gemini has built-in web search capabilities, so we primarily use knowledge base tools
  ...knowledgeBaseTools,
}