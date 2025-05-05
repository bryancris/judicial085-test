
import React, { useEffect } from "react";
import { renderMarkdown } from "@/utils/markdownProcessor";

interface AnalysisItemProps {
  content: string;
  timestamp: string;
  onQuestionClick?: (question: string) => void;
}

const AnalysisItem: React.FC<AnalysisItemProps> = ({ content, timestamp, onQuestionClick }) => {
  // Set up click handler for the follow-up questions when they're rendered
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
  }, [content, onQuestionClick]);

  return (
    <div className="mb-6 border-b pb-4 last:border-b-0">
      <div className="prose prose-sm max-w-none">
        <div 
          dangerouslySetInnerHTML={{ 
            __html: renderMarkdown(content)
          }} 
        />
      </div>
      <div className="text-xs text-muted-foreground mt-3">{timestamp}</div>
    </div>
  );
};

export default AnalysisItem;
