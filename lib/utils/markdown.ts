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
    return token.tokens
      .map((t) => ("> " + this.parser.parse([t])).trim())
      .join("\n");
  },

  html(token) {
    return token.text
      .replace(/<br\s*\/{0,1}>/g, "\n")
      .replace(/<\/{0,1}del>/g, "~")
      .replace(/<\/{0,1}s>/g, "~")
      .replace(/<\/{0,1}strike>/g, "~");
  },

  heading(token) {
    // Slack doesn't have true headings, so we'll make them bold and add newlines
    return `*${token.text}*\n\n`;
  },

  hr(token) {
    return token.raw;
  },

  list(token) {
    const items = token.ordered
      ? token.items.map(
          (item, i) =>
            `${Number(token.start) + i}. ${this.parser.parse(item.tokens)}`,
        )
      : token.items.map((item) => {
          const marker = item.task ? (item.checked ? "☑️" : "☐") : "•";
          return `${marker} ${this.parser.parse(item.tokens)}`;
        });

    const firstItem = token.items[0].raw;
    const indentation = firstItem.match(/^(\s+)/)?.[0];
    if (!indentation) {
      return items.join("\n");
    }

    // If we have leading indentation, nest the list and preserve it
    const newLine = token.ordered ? `\n${indentation} ` : `\n${indentation}`;
    return newLine + items.join(newLine);
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
    // Tables aren't well supported in mrkdwn, so we'll skip them
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
    return token.raw;
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

  image() {
    // Images aren't supported in mrkdwn
    return "";
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

// Configure marked with our custom renderer
marked.use({ renderer });

/**
 * Convert markdown to Slack's mrkdwn format
 * @param markdown The markdown string to convert
 * @returns A string formatted in Slack's mrkdwn
 */
export function markdownToMrkdwn(markdown: string): string {
  if (!markdown) return '';
  
  return marked
    .parse(markdown, {
      async: false,
      gfm: true, // GitHub Flavored Markdown
    })
    .trimEnd();
}
