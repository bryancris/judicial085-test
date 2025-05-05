
/**
 * Utility functions for processing markdown and handling follow-up questions
 */

/**
 * Processes markdown content and enhances follow-up questions
 * @param content The raw markdown content to process
 * @param onQuestionClick Optional callback for when a question is clicked
 * @returns Processed HTML content
 */
export const processMarkdown = (content: string): string => {
  // First pass: Convert basic markdown to HTML
  let html = content
    // Convert headers (both # style and ** style)
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    // Convert bold text (including for section headers)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert italics
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert line breaks
    .replace(/\n/g, '<br />');

  return html;
};

/**
 * Processes and enhances follow-up questions in the content
 * @param content The content containing questions
 * @param MAX_QUESTIONS Maximum number of questions to process
 * @returns Processed content with enhanced question items
 */
export const processFollowUpQuestions = (content: string, MAX_QUESTIONS = 4): string => {
  // Split content into lines for better processing
  const lines = content.split('\n');
  let inQuestionSection = false;
  let processedLines = [];
  
  // Flag to limit questions
  let questionCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect when we enter the recommended follow-up questions section
    if (/RECOMMENDED\s+FOLLOW[\s\-]*UP\s+QUESTIONS/i.test(line)) {
      inQuestionSection = true;
      processedLines.push(line);
      continue;
    }
    
    // If we're in the questions section, process numbered questions
    if (inQuestionSection) {
      const questionMatch = line.match(/^(\d+)\.\s+(.*)/);
      
      if (questionMatch && questionMatch[1] && questionMatch[2]) {
        // Only process up to MAX_QUESTIONS
        if (questionCount < MAX_QUESTIONS) {
          const questionNumber = questionMatch[1];
          const questionText = questionMatch[2].trim();
          
          // Create clickable question elements
          const clickableQuestion = `
            <div 
              class="question-item my-2 p-3 rounded bg-blue-50 hover:bg-blue-100 cursor-pointer border border-blue-200 flex items-center"
              style="color: #1E40AF; cursor: pointer; background-color: #EFF6FF; border: 1px solid #BFDBFE;"
              onclick="window.handleQuestionClick('${questionText.replace(/'/g, "\\'").replace(/"/g, '\\"')}')">
              <span class="mr-2 font-medium">${questionNumber}.</span>
              <span>${questionText}</span>
              <span class="ml-auto text-blue-500">➡</span>
            </div>
          `;
          
          processedLines.push(clickableQuestion);
          questionCount++;
        }
      } else if (line.trim() === '' || (line.trim().startsWith('5.') && questionCount >= MAX_QUESTIONS)) {
        // Skip empty lines and the 5th question if we already have 4
        continue;
      } else if (/^[A-Za-z]+:/.test(line) || /^#{1,3}\s+/.test(line) || /^\*\*[^*]+\*\*$/.test(line)) {
        // Detect new section headers to exit question section
        inQuestionSection = false;
        processedLines.push(line);
      } else {
        // Any other content in the question section that's not a question or new header
        processedLines.push(line);
      }
    } else {
      // Not in question section, just pass through
      processedLines.push(line);
    }
  }
  
  // Join lines back together
  return processedLines.join('<br />');
};

/**
 * Combine both markdown processing steps
 * @param content Raw markdown content
 * @param MAX_QUESTIONS Maximum number of questions to process
 * @returns Fully processed HTML content
 */
export const renderMarkdown = (content: string, MAX_QUESTIONS = 4): string => {
  // Process the content for questions first
  const processedQuestionsContent = processFollowUpQuestions(content, MAX_QUESTIONS);
  // Then process the markdown
  return processMarkdown(processedQuestionsContent);
};
