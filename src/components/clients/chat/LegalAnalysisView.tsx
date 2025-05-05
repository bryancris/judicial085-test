
import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface AnalysisItem {
  content: string;
  timestamp: string;
}

interface LegalAnalysisViewProps {
  analysisItems: AnalysisItem[];
  isLoading: boolean;
  onQuestionClick?: (question: string) => void;
}

const LegalAnalysisView = ({ analysisItems, isLoading, onQuestionClick }: LegalAnalysisViewProps) => {
  const analysisEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when analysis items change
    if (analysisEndRef.current) {
      analysisEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [analysisItems]);

  // Set up the global click handler for the follow-up questions
  useEffect(() => {
    if (onQuestionClick) {
      // Add a global function that the onClick handlers can call
      window.handleQuestionClick = (question: string) => {
        console.log("Question clicked via global handler:", question);
        onQuestionClick(question);
      };
    }
    
    // Cleanup when component is unmounted
    return () => {
      if (window.handleQuestionClick) {
        delete window.handleQuestionClick;
      }
    };
  }, [onQuestionClick]);

  // Process markdown and enhance follow-up questions
  const renderMarkdown = (content: string) => {
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

    // Second pass: Identify and enhance the follow-up questions section
    const contentLines = content.split('\n');
    let processedHtml = html;
    let questionSectionStartIndex = -1;
    let questionSectionEndIndex = -1;

    // First, locate the RECOMMENDED FOLLOW-UP QUESTIONS section
    for (let i = 0; i < contentLines.length; i++) {
      const line = contentLines[i].trim();
      // Match various forms of the header (with ** or # formatting)
      if (
        line.match(/^#+\s*RECOMMENDED\s+FOLLOW[\s\-]UP\s+QUESTIONS/i) || 
        line.match(/^\*\*RECOMMENDED\s+FOLLOW[\s\-]UP\s+QUESTIONS.*\*\*/i)
      ) {
        questionSectionStartIndex = i;
        break;
      }
    }

    // If we found the section, process it
    if (questionSectionStartIndex >= 0) {
      // Find the end of the questions section (next header or end of content)
      for (let i = questionSectionStartIndex + 1; i < contentLines.length; i++) {
        const line = contentLines[i].trim();
        // Look for the next major section header (only level 1 or 2)
        if (
          (line.match(/^#{1,2}\s+[^0-9]/i) && !line.match(/FOLLOW[\s\-]UP\s+QUESTIONS/i)) || 
          line.match(/^\*\*[^*]+\*\*$/) // Bold text that could be a new section header
        ) {
          questionSectionEndIndex = i - 1;
          break;
        }
      }
      
      // If we didn't find an end, it goes to the end of the content
      if (questionSectionEndIndex === -1) {
        questionSectionEndIndex = contentLines.length - 1;
      }

      // Now process all the question items in this section
      for (let i = questionSectionStartIndex + 1; i <= questionSectionEndIndex; i++) {
        const line = contentLines[i].trim();
        
        // Look for numbered list items (allowing for different spacing)
        const questionMatch = line.match(/^\s*(\d+)\.\s+(.*)/);
        if (questionMatch && questionMatch[2]) {
          const questionNumber = questionMatch[1];
          const questionText = questionMatch[2].trim();
          
          if (questionText && onQuestionClick) {
            // Create a unique ID for this question
            const uniqueId = `question-${i}-${Date.now()}`;
            
            // Escape the question text for use in JavaScript
            const safeQuestion = questionText
              .replace(/'/g, "\\'")
              .replace(/"/g, '\\"');
            
            // Create the HTML for a styled, clickable question item
            const clickableHtml = `
              <div 
                id="${uniqueId}"
                class="list-item ml-6 mb-3 p-2 px-3 rounded bg-blue-50 hover:bg-blue-100 cursor-pointer flex items-center transition-all duration-200 border border-blue-200"
                style="color: #1EAEDB !important; cursor: pointer !important; background-color: #EBF8FC !important; border: 1px solid rgba(30, 174, 219, 0.3) !important;"
                onclick="window.handleQuestionClick('${safeQuestion}')"
              >
                <span class="mr-2 font-medium">${questionNumber}.</span>
                <span>${questionText}</span>
                <span class="ml-auto text-blue-500">➡</span>
              </div>
            `;
            
            // Replace the original line in the HTML
            // First, try to replace the exact HTML that would have been generated for this line
            const lineHtml = `${questionNumber}. ${questionText}<br />`;
            const lineRegex = new RegExp(lineHtml.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            
            if (processedHtml.includes(lineHtml)) {
              processedHtml = processedHtml.replace(lineRegex, clickableHtml);
            } else {
              // Fallback: Try a more flexible match
              const flexRegex = new RegExp(`\\s*${questionNumber}\\.\\s*${questionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<br\\s*\\/?>`, 'i');
              processedHtml = processedHtml.replace(flexRegex, clickableHtml);
            }
          }
        }
      }
    }

    return processedHtml;
  };

  // Add direct DOM manipulation after rendering to ensure clickable elements work
  useEffect(() => {
    if (!onQuestionClick) return;
    
    // Function to add click handlers to all question elements
    const setupClickHandlers = () => {
      const questionElements = document.querySelectorAll('[id^="question-"]');
      console.log(`Found ${questionElements.length} question elements to set up handlers for`);
      
      questionElements.forEach(element => {
        // Remove any existing handlers to prevent duplicates
        const clone = element.cloneNode(true);
        element.parentNode?.replaceChild(clone, element);
        
        // Get the question text (everything except the arrow)
        let questionText = '';
        const textNodes = Array.from(clone.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE || (node as Element).tagName !== 'SPAN' || !(node as Element).classList.contains('ml-auto'));
        
        textNodes.forEach(node => {
          questionText += node.textContent || '';
        });
        
        questionText = questionText.trim();
        if (questionText) {
          // Extract the question without the number prefix
          const cleanQuestion = questionText.replace(/^\d+\.\s*/, '');
          
          // Add click handler
          clone.addEventListener('click', () => {
            console.log(`Question clicked: ${cleanQuestion}`);
            onQuestionClick(cleanQuestion);
          });
        }
      });
    };
    
    // Run setup after rendering completes
    const timer = setTimeout(setupClickHandlers, 100);
    return () => clearTimeout(timer);
  }, [analysisItems, onQuestionClick]);

  return (
    <div className="flex-grow overflow-y-auto p-4 bg-card">
      {analysisItems.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Legal analysis will appear here after attorney-client conversation begins.
          <br/><br/>
          Both attorney and client must contribute to the conversation before analysis is generated.
        </div>
      ) : (
        <div>
          {analysisItems.map((item, index) => (
            <div key={index} className="mb-6 border-b pb-4 last:border-b-0">
              <div className="prose prose-sm max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: renderMarkdown(item.content)
                  }} 
                />
              </div>
              <div className="text-xs text-muted-foreground mt-3">{item.timestamp}</div>
            </div>
          ))}
          <div ref={analysisEndRef} />
        </div>
      )}
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground mt-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating legal analysis...</span>
        </div>
      )}
    </div>
  );
};

// Add the global handleQuestionClick to the Window interface
declare global {
  interface Window {
    handleQuestionClick: (question: string) => void;
  }
}

export default LegalAnalysisView;
