
import { marked } from 'marked';

export const processMarkdown = (text: string): string => {
  if (!text) return '';
  
  // Use marked to process markdown
  // Configure options to format markdown properly
  marked.setOptions({
    breaks: true,      // Add line breaks on single newlines
    gfm: true,         // Use GitHub Flavored Markdown
    smartLists: true   // Use smarter list behavior
  });
  
  return marked(text) as string;
};
