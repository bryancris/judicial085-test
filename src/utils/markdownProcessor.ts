
import { marked } from 'marked';

export const processMarkdown = (text: string): string => {
  if (!text) return '';
  
  // Preserve paragraphs by ensuring double line breaks
  const preprocessedText = text
    .replace(/\n\s*\n/g, '\n\n') // Normalize multiple line breaks to double line breaks
    .replace(/### /g, '\n\n### ') // Ensure headers have proper spacing before them
    .replace(/## /g, '\n\n## ')  // Also ensure proper spacing for h2 headers
    .replace(/# /g, '\n\n# ');   // Also ensure proper spacing for h1 headers

  // Use marked to process markdown with enhanced options
  marked.setOptions({
    breaks: true,      // Add line breaks on single newlines
    gfm: true,         // Use GitHub Flavored Markdown
  });
  
  return marked(preprocessedText) as string;
};
