
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

  // Add client-side script to ensure click handler works after hydration
  useEffect(() => {
    // Function to add click handlers directly to DOM elements
    const setupClickHandlers = () => {
      if (onQuestionClick) {
        // Find all question elements and attach event listeners directly
        document.querySelectorAll('[id^="question-"]').forEach(element => {
          console.log("Setting up direct click handler for:", element.textContent);
          element.addEventListener('click', (e) => {
            // Extract the question text from the element (minus the arrow icon)
            const questionText = element.textContent?.replace("➡", "").trim() || '';
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

  // Render markdown with special handling for follow-up questions
  const renderMarkdown = (content: string) => {
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

    // Process the content for follow-up questions section
    const lines = content.split('\n');
    let inQuestionSection = false;
    let questionsFound = false;
    
    console.log("Processing content with", lines.length, "lines");
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect the recommended follow-up questions section using multiple patterns
      if (
        line.match(/^#+\s*RECOMMENDED\s+FOLLOW[\s-]UP\s+QUESTIONS/i) || 
        line.match(/^\*\*RECOMMENDED\s+FOLLOW[\s-]UP\s+QUESTIONS.*\*\*/i)
      ) {
        inQuestionSection = true;
        questionsFound = true;
        console.log(`Found questions section at line ${i}:`, line);
        continue;
      } 
      // Check if we're starting a completely new major section (not just a sub-header)
      else if (inQuestionSection && 
               line.match(/^#+\s+(?!RECOMMENDED|FOLLOW)/i) && 
               !line.match(/^#+\s+\d+\./) // Not a numbered header
      ) {
        // Only exit if it's a major new section (level 1 or 2 header)
        if (line.match(/^#{1,2}\s/)) {
          console.log("Exiting questions section at line:", line);
          inQuestionSection = false;
        }
      }
      
      // Process numbered list items in the questions section
      if (inQuestionSection && line.match(/^\s*\d+\.\s/)) {
        // Extract the question text (remove the list marker)
        let questionText = line.replace(/^\s*\d+\.\s/, '').trim();
        
        if (questionText && onQuestionClick) {
          console.log("Processing question item:", questionText);
          
          // Create the clickable element with a unique identifier
          const uniqueId = `question-${i}-${Date.now()}`;
          const safeQuestion = questionText.replace(/'/g, "\\'").replace(/"/g, '\\"');
          
          // Define the clickable HTML with inline event handler and styling
          const clickableHtml = `
            <div 
              id="${uniqueId}"
              class="list-item ml-6 mb-3 p-2 px-3 rounded text-[#1EAEDB] bg-blue-50 hover:bg-blue-100 hover:text-blue-800 cursor-pointer flex items-center transition-all duration-200 border border-[#1EAEDB30]" 
              style="color: #1EAEDB !important; border: 1px solid rgba(30, 174, 219, 0.2) !important; cursor: pointer !important; background-color: #EBF8FC !important;"
              onclick="window.handleQuestionClick('${safeQuestion}')"
            >
              ${questionText}
              <span style="margin-left: 4px;">➡</span>
            </div>
          `;
          
          // Replace the original line in the HTML
          const lineWithBr = `${line}<br />`;
          if (html.includes(lineWithBr)) {
            html = html.replace(lineWithBr, clickableHtml);
            console.log(`Styled question at line ${i}:`, questionText);
          } else {
            // Fallback if exact match not found - look for the numbered item
            const pattern = new RegExp(`\\d+\\.\\s+${questionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<br />`, 'i');
            html = html.replace(pattern, clickableHtml);
          }
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
