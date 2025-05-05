
import React, { useEffect, useRef } from "react";
import { Loader2, ArrowRight } from "lucide-react";

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

  // Render markdown with special handling for followup questions
  const renderMarkdown = (content: string) => {
    // Regular markdown rendering
    let html = content
      // Convert headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      // Convert bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert italics
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert line breaks
      .replace(/\n/g, '<br />');

    // Process lists specially to handle follow-up questions
    const lines = content.split('\n');
    let inQuestionSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect the recommended follow-up questions section (case insensitive)
      if (line.match(/^#+\s*RECOMMENDED\s+FOLLOW[-\s]UP\s+QUESTIONS/i)) {
        inQuestionSection = true;
        console.log("Found questions section at line:", line);
        continue;
      } else if (inQuestionSection && line.match(/^#+\s/)) {
        // If we hit another header, we're out of the questions section
        inQuestionSection = false;
      }
      
      // Make list items in the questions section clickable
      if (inQuestionSection && (line.match(/^\s*\d+\.\s/) || line.match(/^\s*\-\s/))) {
        // Extract the question text (remove the list marker)
        const questionText = line.replace(/^\s*(\d+\.|\-)\s/, '').trim();
        
        // Replace the normal list rendering with a clickable version
        if (onQuestionClick) {
          // Use direct onclick handler with inline JS for reliability
          const clickableItem = `<div 
            class="list-item ml-6 mb-2 p-2 px-3 rounded bg-blue-50 hover:bg-blue-100 text-[#1EAEDB] hover:underline cursor-pointer flex items-center" 
            onclick="window.handleQuestionClick('${questionText.replace(/'/g, "\\'")}')"
          >${questionText} <ArrowRight class="h-4 w-4 ml-1" /></div>`;
          
          html = html.replace(`${line}<br />`, clickableItem);
          console.log("Added clickable item for:", questionText);
        } else {
          const regularItem = `<div class="list-item ml-6 mb-2">${questionText}</div>`;
          html = html.replace(`${line}<br />`, regularItem);
        }
      } else {
        // Process regular lists
        if (line.match(/^\s*\d+\.\s/)) {
          html = html.replace(`${line}<br />`, `<ol class="list-decimal ml-6 mb-2"><li>${line.replace(/^\s*\d+\.\s/, '')}</li></ol>`);
        } else if (line.match(/^\s*\-\s/)) {
          html = html.replace(`${line}<br />`, `<ul class="list-disc ml-6 mb-2"><li>${line.replace(/^\s*\-\s/, '')}</li></ul>`);
        }
      }
    }
    
    return html;
  };

  // Create global function for the onclick handler - ensure it's properly set up
  useEffect(() => {
    if (onQuestionClick) {
      // Add a global function that the onClick can call
      window.handleQuestionClick = (question: string) => {
        console.log("Question clicked:", question);
        onQuestionClick(question);
      };
    }
    
    // Cleanup
    return () => {
      if (window.handleQuestionClick) {
        delete window.handleQuestionClick;
      }
    };
  }, [onQuestionClick]);

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
