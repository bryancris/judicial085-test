
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
  console.log('Processing HTML for follow-up questions:', html.substring(0, 500) + '...');
  
  // Enhanced pattern to match follow-up questions sections (more flexible)
  const followUpPattern = /(RECOMMENDED\s+FOLLOW[- ]?UP\s+QUESTIONS?:?|FOLLOW[- ]?UP\s+QUESTIONS?:?|Recommended\s+Follow[- ]?up\s+Questions?:?)/i;
  
  if (!followUpPattern.test(html)) {
    console.log('No follow-up questions pattern found in HTML');
    return html;
  }

  console.log('Found follow-up questions pattern, processing...');
  
  // Try multiple approaches to find and process questions
  let result = html;
  
  // Approach 1: Handle questions in list format
  result = processListQuestions(result);
  
  // Approach 2: Handle questions as plain numbered paragraphs
  result = processPlainNumberedQuestions(result);
  
  // Approach 3: Handle questions after specific headers
  result = processQuestionsAfterHeaders(result);
  
  console.log('Processed questions result preview:', result.substring(result.indexOf('question-item') - 100, result.indexOf('question-item') + 200));
  
  return result;
};

// Function to convert numbered questions in lists into clickable elements
const processListQuestions = (html: string): string => {
  const questionPattern = /<li>(\d+\.\s*)(.*?)<\/li>/g;
  
  return html.replace(questionPattern, (match, number, questionText) => {
    console.log('Processing list question:', questionText);
    const cleanQuestionText = questionText.replace(/<[^>]*>/g, '').trim();
    
    return `<li>${number}<span class="question-item clickable-question" data-question="${cleanQuestionText}" role="button" tabindex="0">${questionText}</span></li>`;
  });
};

// Function to handle plain numbered questions (not in lists)
const processPlainNumberedQuestions = (html: string): string => {
  // Pattern to match paragraphs that start with numbers
  const numberedParaPattern = /<p>(\d+\.\s+)(.*?)<\/p>/g;
  
  return html.replace(numberedParaPattern, (match, number, questionText) => {
    // Only process if we're in a follow-up questions context
    const followUpPattern = /(RECOMMENDED\s+FOLLOW[- ]?UP\s+QUESTIONS?:?|FOLLOW[- ]?UP\s+QUESTIONS?:?|Recommended\s+Follow[- ]?up\s+Questions?:?)/i;
    
    // Check if this numbered paragraph appears after a follow-up questions header
    const htmlBeforeMatch = html.substring(0, html.indexOf(match));
    const lastHeaderMatch = htmlBeforeMatch.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/g);
    
    if (lastHeaderMatch && followUpPattern.test(lastHeaderMatch[lastHeaderMatch.length - 1])) {
      console.log('Processing plain numbered question:', questionText);
      const cleanQuestionText = questionText.replace(/<[^>]*>/g, '').trim();
      
      return `<p>${number}<span class="question-item clickable-question" data-question="${cleanQuestionText}" role="button" tabindex="0">${questionText}</span></p>`;
    }
    
    return match; // Return unchanged if not in follow-up context
  });
};

// Function to handle questions that appear after follow-up headers
const processQuestionsAfterHeaders = (html: string): string => {
  const followUpPattern = /(RECOMMENDED\s+FOLLOW[- ]?UP\s+QUESTIONS?:?|FOLLOW[- ]?UP\s+QUESTIONS?:?|Recommended\s+Follow[- ]?up\s+Questions?:?)/i;
  
  // Split by headers to process sections
  const headerPattern = /(<h[1-6][^>]*>.*?<\/h[1-6]>)/gi;
  const parts = html.split(headerPattern);
  
  let result = '';
  let inFollowUpSection = false;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Check if this is a follow-up questions header
    if (headerPattern.test(part) && followUpPattern.test(part)) {
      console.log('Found follow-up questions header:', part);
      result += part;
      inFollowUpSection = true;
      continue;
    }
    
    // If we hit another header, we're no longer in the follow-up section
    if (headerPattern.test(part) && !followUpPattern.test(part)) {
      inFollowUpSection = false;
      result += part;
      continue;
    }
    
    // Process content in follow-up section
    if (inFollowUpSection) {
      console.log('Processing content in follow-up section:', part.substring(0, 200));
      
      // Handle any numbered content in this section
      let processedPart = part;
      
      // Pattern for any line that starts with a number (even without proper paragraph tags)
      const anyNumberedPattern = /(\d+\.\s+)([^\n\r<]+)/g;
      
      processedPart = processedPart.replace(anyNumberedPattern, (match, number, questionText) => {
        console.log('Processing any numbered question:', questionText);
        const cleanQuestionText = questionText.trim();
        
        return `${number}<span class="question-item clickable-question" data-question="${cleanQuestionText}" role="button" tabindex="0">${questionText}</span>`;
      });
      
      result += processedPart;
    } else {
      result += part;
    }
  }
  
  return result;
};
