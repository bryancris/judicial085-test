/**
 * Parser for Step 7 refined analysis content to extract structured data
 * for rendering as React components instead of dangerouslySetInnerHTML
 */

export interface ParsedRefinedContent {
  sections: ContentSection[];
}

export interface ContentSection {
  type: 'heading' | 'paragraph' | 'list' | 'text';
  level?: number; // for headings (1-6)
  content: string;
  items?: string[]; // for lists
}

export function parseRefinedAnalysisContent(rawContent: string): ParsedRefinedContent {
  if (!rawContent?.trim()) {
    return { sections: [] };
  }

  const sections: ContentSection[] = [];
  const lines = rawContent.split('\n');
  
  let currentParagraph = '';
  let currentList: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      // End current paragraph or list if we have content
      if (currentParagraph) {
        sections.push({
          type: 'paragraph',
          content: cleanMarkdown(currentParagraph.trim())
        });
        currentParagraph = '';
      }
      if (currentList.length > 0) {
        sections.push({
          type: 'list',
          content: '',
          items: currentList.map(item => cleanMarkdown(item))
        });
        currentList = [];
        inList = false;
      }
      continue;
    }

    // Check for headings (## or ###)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      // End current content
      if (currentParagraph) {
        sections.push({
          type: 'paragraph',
          content: cleanMarkdown(currentParagraph.trim())
        });
        currentParagraph = '';
      }
      if (currentList.length > 0) {
        sections.push({
          type: 'list',
          content: '',
          items: currentList.map(item => cleanMarkdown(item))
        });
        currentList = [];
        inList = false;
      }

      sections.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: cleanMarkdown(headingMatch[2])
      });
      continue;
    }

    // Check for list items (-, *, •, or numbered)
    const listMatch = line.match(/^[-*•]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
    if (listMatch) {
      // End current paragraph if we have one
      if (currentParagraph) {
        sections.push({
          type: 'paragraph',
          content: cleanMarkdown(currentParagraph.trim())
        });
        currentParagraph = '';
      }
      
      currentList.push(listMatch[1]);
      inList = true;
      continue;
    }

    // Regular text line
    if (inList && currentList.length > 0) {
      // End the current list
      sections.push({
        type: 'list',
        content: '',
        items: currentList.map(item => cleanMarkdown(item))
      });
      currentList = [];
      inList = false;
    }

    // Add to current paragraph
    currentParagraph += (currentParagraph ? ' ' : '') + line;
  }

  // Handle remaining content
  if (currentParagraph) {
    sections.push({
      type: 'paragraph',
      content: cleanMarkdown(currentParagraph.trim())
    });
  }
  if (currentList.length > 0) {
    sections.push({
      type: 'list',
      content: '',
      items: currentList.map(item => cleanMarkdown(item))
    });
  }

  return { sections };
}

/**
 * Clean markdown formatting from text while preserving important emphasis
 */
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown but keep text
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown but keep text
    .replace(/`(.*?)`/g, '$1') // Remove code markdown but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
    .trim();
}

/**
 * Check if text contains strong emphasis markers
 */
export function hasStrongEmphasis(text: string): boolean {
  return /\*\*(.*?)\*\*/g.test(text);
}

/**
 * Extract strong text parts for rendering
 */
export function parseStrongText(text: string): Array<{ text: string; strong: boolean }> {
  const parts: Array<{ text: string; strong: boolean }> = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText) {
        parts.push({ text: beforeText, strong: false });
      }
    }
    
    // Add the strong text
    parts.push({ text: match[1], strong: true });
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push({ text: remainingText, strong: false });
    }
  }

  return parts.length > 0 ? parts : [{ text, strong: false }];
}