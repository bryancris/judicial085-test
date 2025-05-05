
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

    // Modified section to handle follow-up questions better
    // Split content into lines for better processing
    const lines = content.split('\n');
    let inQuestionSection = false;
    let processedLines = [];
    
    // Flag to limit questions to 4
    let questionCount = 0;
    const MAX_QUESTIONS = 4;

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
          // Only process up to 4 questions
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
        } else if (line.trim() === '' || (line.trim().startsWith('5.') && questionCount >= 4)) {
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

  // Add direct DOM manipulation after rendering to ensure clickable elements work
  useEffect(() => {
    if (!onQuestionClick) return;
    
    // Function to add click handlers to question elements
    const setupClickHandlers = () => {
      const questionElements = document.querySelectorAll('.question-item');
      
      questionElements.forEach(element => {
        element.addEventListener('click', (e) => {
          // Find the question text (skip the number and the arrow)
          const questionText = element.querySelector('span:nth-child(2)')?.textContent || '';
          if (questionText) {
            console.log(`Question clicked: ${questionText}`);
            onQuestionClick(questionText);
          }
          e.stopPropagation();
        });
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
