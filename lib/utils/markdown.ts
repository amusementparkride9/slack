import { marked, MarkedExtension } from "marked";

/**
 * Custom renderer for converting Markdown to Slack's mrkdwn format
 * Docs: https://marked.js.org/using_pro#renderer
 */
const renderer = {
  // Block-level renderers
  space(token) {
    return token.raw;
  },

  code(token) {
    return `\`\`\`${token.lang ?? ""}\n${token.text}\n\`\`\``;
  },

  blockquote(token) {
    // Process each line of the blockquote and prefix with >
    return token.tokens
      .map((t) => {
        const parsed = this.parser.parse([t]).trim();
        // Split by newlines to ensure each line has the > prefix
        return parsed.split("\n").map(line => `> ${line}`).join("\n");
      })
      .join("\n") + "\n\n";
  },

  html(token) {
    // Handle <hr> tags specifically
    if (token.text.includes('<hr>')) {
      return "🔹🔹🔹🔹🔹🔹🔹🔹🔹\n\n";
    }
    
    return token.text
      .replace(/<br\s*\/{0,1}>/g, "\n")
      .replace(/<\/{0,1}del>/g, "~")
      .replace(/<\/{0,1}s>/g, "~")
      .replace(/<\/{0,1}strike>/g, "~");
  },

  heading(token) {
    // Make headings bold and add newlines
    return `*${token.text}*\n\n`;
  },

  hr() {
    // Use a horizontal line that Slack will recognize
    return "🔹🔹🔹🔹🔹🔹🔹🔹🔹\n\n";
  },

  list(token) {
    // Process list items with proper markers and Slack-friendly formatting
    const processListItems = (items: any[], isOrdered: boolean, level = 0, startNum = 1) => {
      return items.map((item: any, i: number) => {
        // Use visible marker for sub-items (Slack doesn't support indentation)
        const marker = isOrdered
          ? `${level === 0 ? (startNum + i) + '.' : '→'}`
          : `${level === 0 ? '•' : '→'}`;
        // Parse all markdown in the item using the custom renderer
        let content = this.parser.parse(item.tokens).trim();
        // Remove extra newlines
        content = content.replace(/^\n+|\n+$/g, '');
        return `${marker} ${content}`;
      }).join('\n');
    };
    
    const start = typeof token.start === 'number' ? token.start : 1;
    return processListItems(token.items, token.ordered, 0, start) + '\n\n';
  },

  listitem() {
    return "";
  },

  checkbox() {
    return "";
  },

  paragraph(token) {
    return this.parser.parseInline(token.tokens) + "\n\n";
  },

  table() {
    // Tables aren't well supported in mrkdwn
    return "";
  },

  tablerow() {
    return "";
  },

  tablecell() {
    return "";
  },

  // Inline-level renderers
  strong(token) {
    const text = this.parser.parseInline(token.tokens);
    return `*${text}*`;
  },

  em(token) {
    const text = this.parser.parseInline(token.tokens);
    return `_${text}_`;
  },

  codespan(token) {
    // Ensure code spans are properly formatted
    const code = token.raw.replace(/`/g, "");
    return `\`${code}\``;
  },

  br() {
    return "\n";
  },

  del(token) {
    const text = this.parser.parseInline(token.tokens);
    return `~${text}~`;
  },

  link(token) {
    const text = this.parser.parseInline(token.tokens);
    const url = cleanUrl(token.href);

    return url === text || url === `mailto:${text}` || !text
      ? `<${url}>`
      : `<${url}|${text}>`;
  },

  image(token) {
    // For images, we'll just show the alt text and the URL
    return token.text ? `[Image: ${token.text}] <${token.href}>` : `<${token.href}>`;
  },

  text(token) {
    return (
      token.text
        // Escape special characters in Slack
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
    );
  },
} satisfies MarkedExtension["renderer"];

/**
 * Clean and encode URLs
 */
function cleanUrl(href: string) {
  try {
    return encodeURI(href).replace(/%25/g, "%");
  } catch {
    return href;
  }
}

// Additional preprocessing for markdown text
function preprocessMarkdown(markdown: string): string {
  // Handle horizontal rules (---) which might not be properly detected
  return markdown
    .replace(/^-{3,}$/gm, '<hr>')
    .replace(/^\*{3,}$/gm, '<hr>')
    .replace(/^_{3,}$/gm, '<hr>');
}

// Configure marked with our custom renderer
marked.use({ 
  renderer,
  // Enable GitHub Flavored Markdown features
  gfm: true,
  breaks: true
});

/**
 * Convert markdown to Slack's mrkdwn format
 * @param markdown The markdown string to convert
 * @returns A string formatted in Slack's mrkdwn
 */
export function markdownToMrkdwn(markdown: string): string {
  if (!markdown) return '';
  
  // Preprocess the markdown
  const preprocessed = preprocessMarkdown(markdown);
  
  return marked
    .parse(preprocessed, {
      async: false,
      gfm: true, // GitHub Flavored Markdown
      breaks: true // Convert line breaks to <br>
    })
    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
    .trimEnd();
}
