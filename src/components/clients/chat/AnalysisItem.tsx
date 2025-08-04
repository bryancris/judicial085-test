
import React, { useEffect, useRef } from "react";
import { processMarkdown } from "@/utils/markdownProcessor";

interface AnalysisItemProps {
  content: string;
  timestamp: string;
  onQuestionClick?: (question: string) => void;
}

const AnalysisItem: React.FC<AnalysisItemProps> = ({ content, timestamp, onQuestionClick }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Set up click handler for the follow-up questions when they're rendered
  useEffect(() => {
    if (!onQuestionClick || !contentRef.current) return;
    
    // Function to add click handlers to question elements
    const setupClickHandlers = () => {
      const questionElements = contentRef.current?.querySelectorAll('.question-item');
      console.log(`Found ${questionElements?.length} question elements to attach handlers to`);
      
      questionElements?.forEach(element => {
        element.addEventListener('click', (e) => {
          const questionText = element.getAttribute('data-question');
          if (questionText) {
            console.log(`Question clicked: ${questionText}`);
            onQuestionClick(questionText);
          }
          e.stopPropagation();
        });
      });
    };
    
    // Run setup after rendering completes
    setupClickHandlers();
    
    // Cleanup function to remove event listeners
    return () => {
      const questionElements = contentRef.current?.querySelectorAll('.question-item');
      questionElements?.forEach(element => {
        element.replaceWith(element.cloneNode(true)); // Remove all event listeners
      });
    };
  }, [content, onQuestionClick]);

  return (
    <div className="mb-6 border-b pb-4 last:border-b-0">
      <div className="legal-analysis-content">
        <div 
          ref={contentRef}
          dangerouslySetInnerHTML={{ 
            __html: processMarkdown(content)
          }} 
        />
      </div>
      <div className="text-xs text-muted-foreground mt-3">{timestamp}</div>
    </div>
  );
};

export default AnalysisItem;
