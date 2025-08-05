
import { marked } from 'marked';

export const processMarkdown = (text: string): string => {
  if (!text) return '';
  
  // Configure marked with modern API for consistent rendering
  marked.use({
    breaks: true,           // Convert line breaks to <br>
    gfm: true,             // GitHub Flavored Markdown
    pedantic: false,       // Use relaxed parsing rules
  });

  // Clean and normalize the text first
  let cleanedText = text
    .trim()
    .replace(/\r\n/g, '\n')           // Normalize line endings
    .replace(/\n{3,}/g, '\n\n')       // Collapse multiple newlines to double
    .replace(/^[\s\n]+|[\s\n]+$/g, ''); // Remove leading/trailing whitespace

  // Ensure proper spacing around headers
  cleanedText = cleanedText
    .replace(/([^\n])(#{1,6}\s)/g, '$1\n\n$2')  // Add newlines before headers
    .replace(/(#{1,6}[^\n]*)\n([^\n#])/g, '$1\n\n$2'); // Add newlines after headers

  // Process the markdown using marked
  try {
    const htmlContent = marked(cleanedText) as string;
    
    // Post-process to make follow-up questions clickable
    let processedContent = makeFollowUpQuestionsClickable(htmlContent);
    
    // Apply nuclear font size enforcement for statute/case references
    processedContent = enforceStatuteFontSize(processedContent);
    
    return processedContent;
  } catch (error) {
    console.error('Markdown processing error:', error);
    // Fallback: return escaped HTML with basic formatting
    return cleanedText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.)/gm, '<p>$1')
      .replace(/(.*)$/gm, '$1</p>');
  }
};

// Completely rewritten function with better debugging and simpler patterns
const makeFollowUpQuestionsClickable = (html: string): string => {
  console.log('=== FOLLOW-UP QUESTIONS DEBUG START ===');
  console.log('Original HTML length:', html.length);
  console.log('First 1000 characters:', html.substring(0, 1000));
  
  // Check if we have any follow-up questions section
  const followUpPatterns = [
    /RECOMMENDED\s+FOLLOW[- ]?UP\s+QUESTIONS?/i,
    /FOLLOW[- ]?UP\s+QUESTIONS?/i,
    /Recommended\s+Follow[- ]?up\s+Questions?/i,
    /Follow[- ]?up\s+Questions?/i
  ];
  
  let hasFollowUpSection = false;
  let matchedPattern = '';
  
  for (const pattern of followUpPatterns) {
    if (pattern.test(html)) {
      hasFollowUpSection = true;
      matchedPattern = pattern.toString();
      console.log('Found follow-up questions pattern:', matchedPattern);
      break;
    }
  }
  
  if (!hasFollowUpSection) {
    console.log('No follow-up questions section found');
    console.log('=== FOLLOW-UP QUESTIONS DEBUG END ===');
    return html;
  }

  console.log('Processing follow-up questions...');
  
  // Strategy 1: Handle questions in <li> tags (proper list format)
  let result = processListQuestions(html);
  
  // Strategy 2: Handle questions in <p> tags with numbers
  result = processParagraphQuestions(result);
  
  // Strategy 3: Handle plain numbered text (most likely format based on image)
  result = processPlainNumberedText(result);
  
  // Count how many questions we made clickable
  const questionCount = (result.match(/class="question-item/g) || []).length;
  console.log('Total questions made clickable:', questionCount);
  
  if (questionCount > 0) {
    console.log('✅ Successfully processed follow-up questions');
  } else {
    console.log('❌ No questions were made clickable - investigating...');
    
    // Debug: Find all numbered content after follow-up headers
    const numberedContentPattern = /\d+\.\s+[^\n\r<]+/g;
    const numberedMatches = html.match(numberedContentPattern) || [];
    console.log('Found numbered content:', numberedMatches);
    
    // Debug: Check content structure around follow-up sections
    const followUpIndex = html.search(/FOLLOW[- ]?UP\s+QUESTIONS?/i);
    if (followUpIndex >= 0) {
      const contextBefore = html.substring(Math.max(0, followUpIndex - 200), followUpIndex);
      const contextAfter = html.substring(followUpIndex, followUpIndex + 500);
      console.log('Context before follow-up:', contextBefore);
      console.log('Context after follow-up:', contextAfter);
    }
  }
  
  console.log('=== FOLLOW-UP QUESTIONS DEBUG END ===');
  return result;
};

// Process questions in <li> tags
const processListQuestions = (html: string): string => {
  console.log('Processing list questions...');
  
  const questionPattern = /<li>(\d+\.\s*)(.*?)<\/li>/g;
  let matchCount = 0;
  
  const result = html.replace(questionPattern, (match, number, questionText) => {
    matchCount++;
    console.log(`List question ${matchCount}:`, questionText.substring(0, 100));
    const cleanQuestionText = questionText.replace(/<[^>]*>/g, '').trim();
    
    return `<li>${number}<span class="question-item clickable-question" data-question="${cleanQuestionText}" role="button" tabindex="0">${questionText}</span></li>`;
  });
  
  console.log('List questions processed:', matchCount);
  return result;
};

// Process questions in <p> tags with numbers
const processParagraphQuestions = (html: string): string => {
  console.log('Processing paragraph questions...');
  
  // Check if we're in a follow-up questions context
  const followUpPattern = /FOLLOW[- ]?UP\s+QUESTIONS?/i;
  
  const paragraphPattern = /<p>(\d+\.\s+)(.*?)<\/p>/g;
  let matchCount = 0;
  
  const result = html.replace(paragraphPattern, (match, number, questionText) => {
    // Check if this paragraph appears after a follow-up questions header
    const htmlBeforeMatch = html.substring(0, html.indexOf(match));
    const hasFollowUpBefore = followUpPattern.test(htmlBeforeMatch);
    
    if (hasFollowUpBefore) {
      matchCount++;
      console.log(`Paragraph question ${matchCount}:`, questionText.substring(0, 100));
      const cleanQuestionText = questionText.replace(/<[^>]*>/g, '').trim();
      
      return `<p>${number}<span class="question-item clickable-question" data-question="${cleanQuestionText}" role="button" tabindex="0">${questionText}</span></p>`;
    }
    
    return match; // Return unchanged if not in follow-up context
  });
  
  console.log('Paragraph questions processed:', matchCount);
  return result;
};

// Process plain numbered text (most likely the actual format)
const processPlainNumberedText = (html: string): string => {
  console.log('Processing plain numbered text...');
  
  // Find follow-up questions headers and process content after them
  const headerPattern = /(FOLLOW[- ]?UP\s+QUESTIONS?[:\s]*)/i;
  const headerMatch = html.match(headerPattern);
  
  if (!headerMatch) {
    console.log('No follow-up header found for plain text processing');
    return html;
  }
  
  const headerIndex = html.indexOf(headerMatch[0]);
  const beforeHeader = html.substring(0, headerIndex + headerMatch[0].length);
  const afterHeader = html.substring(headerIndex + headerMatch[0].length);
  
  console.log('Processing content after header...');
  console.log('Content after header (first 300 chars):', afterHeader.substring(0, 300));
  
  // Process any numbered content in the section after the header
  let processedAfter = afterHeader;
  let matchCount = 0;
  
  // Pattern to match numbered questions that might be in various formats
  const numberedPatterns = [
    // Pattern 1: Direct numbered text
    /(\d+\.\s+)([^\n\r<]+)/g,
    // Pattern 2: Numbered text in spans or other elements
    /(>\s*\d+\.\s+)([^<\n\r]+)/g
  ];
  
  for (const pattern of numberedPatterns) {
    processedAfter = processedAfter.replace(pattern, (match, number, questionText) => {
      // Only process if it looks like a question (has enough length and question-like content)
      if (questionText.trim().length > 10) {
        matchCount++;
        console.log(`Plain text question ${matchCount}:`, questionText.trim().substring(0, 100));
        const cleanQuestionText = questionText.trim();
        
        return `${number}<span class="question-item clickable-question" data-question="${cleanQuestionText}" role="button" tabindex="0">${questionText}</span>`;
      }
      return match;
    });
  }
  
  console.log('Plain text questions processed:', matchCount);
  return beforeHeader + processedAfter;
};

/**
 * Nuclear option: Force 14px font size on statute and case references
 */
function enforceStatuteFontSize(html: string): string {
  // Strategy 1: Target ANY strong element after h2
  let processedHtml = html.replace(
    /(<h2[^>]*>.*?<\/h2>)([\s\S]*?)(?=<h2|$)/g,
    (match, h2, content) => {
      const processedContent = content.replace(
        /<strong([^>]*)>/g,
        '<strong$1 style="font-size: 14px !important; line-height: 1.6 !important; font-weight: 600 !important;" data-statute="true">'
      );
      return h2 + processedContent;
    }
  );

  // Strategy 2: Target paragraphs after h2 elements
  processedHtml = processedHtml.replace(
    /(<h2[^>]*>.*?<\/h2>\s*)(<p[^>]*>)/g,
    '$1<p style="font-size: 14px !important; line-height: 1.6 !important;">'
  );

  // Strategy 3: Content-based targeting for legal references
  processedHtml = processedHtml.replace(
    /<strong([^>]*)>([^<]*(?:Texas|Civil Practice|Code|DTPA|Deceptive Trade|§)[^<]*)<\/strong>/g,
    '<strong$1 style="font-size: 14px !important; line-height: 1.6 !important; font-weight: 600 !important;" data-statute="true" title="$2">$2</strong>'
  );

  return processedHtml;
}
