
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
        console.log("Question clicked:", question);
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

  // Render markdown with special handling for follow-up questions
  const renderMarkdown = (content: string) => {
    console.log("Rendering markdown content");
    
    // Convert the content to HTML first (basic markdown conversion)
    let html = content
      // Convert headers (both # style and ** style)
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      // Convert bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert italics
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert line breaks
      .replace(/\n/g, '<br />');

    // Process the content line by line for follow-up questions
    const lines = content.split('\n');
    let inQuestionSection = false;
    let questionsFound = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect the recommended follow-up questions section using multiple patterns
      // Match both hash-style headers and bold-text style headers
      if (
        line.match(/^#+\s*RECOMMENDED\s+FOLLOW[\s-]UP\s+QUESTIONS/i) || 
        line.match(/^\*\*RECOMMENDED\s+FOLLOW[\s-]UP\s+QUESTIONS.*\*\*/i)
      ) {
        inQuestionSection = true;
        questionsFound = true;
        console.log(`Found questions section at line ${i}:`, line);
        continue;
      } 
      // Check if we've hit another header to end the questions section
      else if (inQuestionSection && (line.match(/^#+\s/) || line.match(/^\*\*.*\*\*$/))) {
        inQuestionSection = false;
        console.log("Exiting questions section at line:", line);
      }
      
      // Make list items in the questions section clickable
      if (inQuestionSection && (line.match(/^\s*\d+\.\s/) || line.match(/^\s*\-\s/) || line.match(/^\s*\*\s/))) {
        // Extract the question text (remove the list marker)
        const questionText = line.replace(/^\s*(\d+\.|\-|\*)\s/, '').trim();
        
        if (questionText && onQuestionClick) {
          // Create the clickable element with a unique identifier
          const uniqueId = `question-${i}-${Date.now()}`;
          const safeQuestion = questionText.replace(/'/g, "\\'").replace(/"/g, '\\"');
          
          // Define the clickable HTML with inline event handler
          const clickableHtml = `
            <div 
              id="${uniqueId}"
              class="list-item ml-6 mb-3 p-2 px-3 rounded text-[#1EAEDB] bg-blue-50 hover:bg-blue-100 hover:text-blue-800 cursor-pointer flex items-center transition-all duration-200 border border-[#1EAEDB30]" 
              style="color: #1EAEDB; border: 1px solid rgba(30, 174, 219, 0.2);"
              onclick="window.handleQuestionClick('${safeQuestion}')"
            >
              ${questionText}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 ml-1">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </div>
          `;
          
          // Replace the original line in the HTML
          html = html.replace(`${line}<br />`, clickableHtml);
          console.log(`Added clickable question at line ${i}:`, questionText);
        }
      }
      // Process regular numbered and bullet lists outside question section
      else if (!inQuestionSection) {
        if (line.match(/^\s*\d+\.\s/)) {
          // Regular numbered list item
          const listText = line.replace(/^\s*\d+\.\s/, '').trim();
          html = html.replace(`${line}<br />`, `<div class="list-decimal ml-6 mb-2">${listText}</div>`);
        } 
        else if (line.match(/^\s*[\-\*]\s/)) {
          // Regular bullet list item
          const listText = line.replace(/^\s*[\-\*]\s/, '').trim();
          html = html.replace(`${line}<br />`, `<div class="list-disc ml-6 mb-2">${listText}</div>`);
        }
      }
    }
    
    if (questionsFound) {
      console.log("Found and processed follow-up questions section");
    } else {
      console.log("No follow-up questions section found in content");
    }
    
    return html;
  };

  // Add client-side script to ensure click handler works after hydration
  useEffect(() => {
    // Function to add click handlers directly to DOM elements
    const setupClickHandlers = () => {
      if (onQuestionClick) {
        // Find all question elements and attach event listeners directly
        document.querySelectorAll('[id^="question-"]').forEach(element => {
          element.addEventListener('click', (e) => {
            // Extract the question text from the element (minus the arrow icon)
            const questionText = element.textContent?.trim().slice(0, -1) || '';
            console.log("Direct DOM click on question:", questionText);
            onQuestionClick(questionText);
          });
        });
      }
    };
    
    // Run setup after a short delay to ensure DOM is fully rendered
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
