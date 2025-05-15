
import { marked } from 'marked';

// Process Texas law references in a text, adding links and highlights
export const processLawReferencesSync = (text: string): string => {
  if (!text) return '';

  // Texas statutes pattern (e.g., Texas Family Code § 154.001)
  const texasStatutePattern = /(Texas\s+[A-Za-z]+\s+Code\s+§\s+\d+\.\d+(?:\(\w+\))?)/g;
  
  // Texas case law pattern (e.g., Smith v. Jones, 123 S.W.3d 456 (Tex. 2005))
  const texasCasePattern = /([A-Za-z]+\s+v\.\s+[A-Za-z]+,\s+\d+\s+S\.W\.\d+\s+\d+\s+\(Tex\.\s+\d{4}\))/g;
  
  // Replace statutes with links
  let processedText = text.replace(texasStatutePattern, 
    '<span class="law-reference statute">$1</span>');
  
  // Replace case law with links
  processedText = processedText.replace(texasCasePattern, 
    '<span class="law-reference case">$1</span>');
  
  return processedText;
};

// Process markdown in text
export const processMarkdown = (text: string): string => {
  if (!text) return '';
  
  // Use marked to process markdown
  return marked(text) as string;
};
