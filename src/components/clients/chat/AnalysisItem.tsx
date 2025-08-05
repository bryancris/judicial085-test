
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
    
    const forceStatuteStyles = () => {
      if (!contentRef.current) return;
      
      // Set CSS custom properties on the container
      contentRef.current.style.setProperty('--statute-font-size', '14px');
      contentRef.current.style.setProperty('--statute-line-height', '1.6');
      contentRef.current.setAttribute('data-processed', 'true');
      
      // NUCLEAR OPTION: Force styles with maximum specificity
      const h2Elements = contentRef.current.querySelectorAll('h2');
      h2Elements.forEach(h2 => {
        let nextElement = h2.nextElementSibling;
        while (nextElement && nextElement.tagName !== 'H2') {
          if (nextElement.tagName === 'P') {
            // Force paragraph styles
            (nextElement as HTMLElement).style.setProperty('font-size', '14px', 'important');
            (nextElement as HTMLElement).style.setProperty('line-height', '1.6', 'important');
            
            // Force all strong elements in this paragraph
            const strongElements = nextElement.querySelectorAll('strong');
            strongElements.forEach(strong => {
              strong.style.setProperty('font-size', '14px', 'important');
              strong.style.setProperty('line-height', '1.6', 'important');
              strong.style.setProperty('font-weight', '600', 'important');
              strong.setAttribute('data-statute', 'true');
              strong.setAttribute('title', strong.textContent || '');
            });
          }
          nextElement = nextElement.nextElementSibling;
        }
      });
      
      // Additional content-based targeting
      const allStrong = contentRef.current.querySelectorAll('strong');
      allStrong.forEach(strong => {
        const text = strong.textContent || '';
        if (text.includes('Texas') || text.includes('Civil Practice') || text.includes('Code') || 
            text.includes('Deceptive Trade') || text.includes('DTPA') || text.includes('§')) {
          strong.style.setProperty('font-size', '14px', 'important');
          strong.style.setProperty('line-height', '1.6', 'important');
          strong.style.setProperty('font-weight', '600', 'important');
          strong.setAttribute('data-statute', 'true');
          strong.setAttribute('title', text);
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
