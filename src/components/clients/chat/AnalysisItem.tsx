
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
    if (!contentRef.current) return;
    
    // NUCLEAR OPTION: Force statute/case text to 14px using DOM manipulation
    const forceStatuteStyles = () => {
      const h2Elements = contentRef.current?.querySelectorAll('h2');
      h2Elements?.forEach(h2 => {
        const nextElement = h2.nextElementSibling;
        if (nextElement?.tagName === 'P') {
          const strongElements = nextElement.querySelectorAll('strong');
          strongElements.forEach(strong => {
            const text = strong.textContent || '';
            if (text.includes('Texas Civil Practice') || 
                text.includes('Code Chapter') || 
                text.includes('Tex.') || 
                text.includes('Civil Practice') || 
                text.includes('§') || 
                text.includes('Section') || 
                text.includes('Article')) {
              // Force styles directly via DOM
              strong.style.fontSize = '14px';
              strong.style.lineHeight = '1.6';
              strong.style.fontWeight = '600';
              strong.style.display = 'inline-block';
              // Add debugging border
              strong.style.border = '2px solid red';
              strong.style.backgroundColor = 'yellow';
            }
          });
        }
      });
    };

    // Function to add click handlers to question elements
    const setupClickHandlers = () => {
      if (!onQuestionClick) return;
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
    
    // Run both setup functions after rendering completes
    forceStatuteStyles();
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
