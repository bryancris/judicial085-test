
import { marked } from 'marked';

export const processMarkdown = (text: string): string => {
  if (!text) return '';
  
  // Preserve paragraphs by ensuring double line breaks
  const preprocessedText = text
    .replace(/\n\s*\n/g, '\n\n') // Normalize multiple line breaks to double line breaks
    .replace(/### /g, '\n\n### ') // Ensure headers have proper spacing before them
    .replace(/## /g, '\n\n## ')  // Also ensure proper spacing for h2 headers
    .replace(/# /g, '\n\n# ');   // Also ensure proper spacing for h1 headers

  // Process numbered lists to ensure proper rendering
  const processedLists = preprocessedText
    .replace(/(\d+\.\s+)/g, '\n$1'); // Add newline before numbered list items

  // Use marked to process markdown with enhanced options
  marked.setOptions({
    breaks: true,      // Add line breaks on single newlines
    gfm: true,         // Use GitHub Flavored Markdown
  });
  
  let processedContent = marked(processedLists) as string;
  
  // Post-process to make follow-up questions clickable
  processedContent = makeFollowUpQuestionsClickable(processedContent);
  
  return processedContent;
};

// Function to convert follow-up questions into clickable elements
const makeFollowUpQuestionsClickable = (html: string): string => {
  // Pattern to match follow-up questions sections
  const followUpPattern = /(RECOMMENDED\s+FOLLOW[- ]?UP\s+QUESTIONS?:?|FOLLOW[- ]?UP\s+QUESTIONS?:?)/i;
  
  if (!followUpPattern.test(html)) {
    return html;
  }
  
  // Split content to find the follow-up questions section
  const parts = html.split(new RegExp(`(<h[1-6][^>]*>.*?${followUpPattern.source}.*?</h[1-6]>)`, 'i'));
  
  if (parts.length < 2) {
    return html;
  }
  
  let result = '';
  let inFollowUpSection = false;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Check if this part contains the follow-up questions header
    if (followUpPattern.test(part)) {
      result += part;
      inFollowUpSection = true;
      continue;
    }
    
    // If we're in the follow-up section and encounter another header, we're done
    if (inFollowUpSection && part.match(/<h[1-6]/)) {
      inFollowUpSection = false;
      result += part;
      continue;
    }
    
    // Process follow-up questions in this section
    if (inFollowUpSection) {
      result += processFollowUpQuestions(part);
    } else {
      result += part;
    }
  }
  
  return result;
};

// Function to convert numbered questions into clickable elements
const processFollowUpQuestions = (content: string): string => {
  // Pattern to match numbered questions in lists
  const questionPattern = /<li>(\d+\.\s*)(.*?)<\/li>/g;
  
  return content.replace(questionPattern, (match, number, questionText) => {
    // Clean up the question text and remove any HTML tags for the data attribute
    const cleanQuestionText = questionText.replace(/<[^>]*>/g, '').trim();
    
    // Create clickable question element
    return `<li>${number}<span class="question-item clickable-question" data-question="${cleanQuestionText}" role="button" tabindex="0">${questionText}</span></li>`;
  });
};
