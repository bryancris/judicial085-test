
import { marked } from 'marked';

export const processMarkdown = (text: string): string => {
  if (!text) return '';
  
  // Use marked to process markdown
  return marked(text) as string;
};
