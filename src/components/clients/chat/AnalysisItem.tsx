
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
      
      // ULTIMATE CSS ENFORCEMENT
      contentRef.current.setAttribute('data-statute', 'content');
      contentRef.current.style.setProperty('--statute-font-size', '14px', 'important');
      contentRef.current.style.setProperty('--statute-line-height', '1.6', 'important');
      contentRef.current.style.setProperty('--statute-font-weight', '400', 'important');
      
      // Remove any conflicting prose classes
      contentRef.current.classList.remove('prose', 'prose-slate', 'prose-lg', 'prose-xl');
      
      // Add MutationObserver to catch dynamic changes
      const observer = new MutationObserver(() => {
        applyForcedStyles();
      });
      
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      
      const applyForcedStyles = () => {
        if (!contentRef.current) return;
        
        // TARGET RELATED PROVISIONS AND KEY CASES WITH EXTREME SPECIFICITY
        const h2Elements = contentRef.current.querySelectorAll('h2');
        h2Elements.forEach(h2 => {
          const headerText = h2.textContent?.toLowerCase() || '';
          if (headerText.includes('related provisions') || headerText.includes('key cases')) {
            
            // Keep h2 header size normal
            h2.style.setProperty('font-size', '1.5rem', 'important');
            h2.style.setProperty('font-weight', '700', 'important');
            
            // ULTIMATE NUCLEAR OPTION: Force styles on ALL following content
            let nextElement = h2.nextElementSibling;
            while (nextElement && nextElement.tagName !== 'H2') {
              // Apply to the element itself
              const element = nextElement as HTMLElement;
              element.style.setProperty('font-size', '14px', 'important');
              element.style.setProperty('line-height', '1.6', 'important');
              element.style.setProperty('font-weight', '400', 'important');
              element.style.setProperty('color', 'hsl(var(--foreground))', 'important');
              
              // Apply to ALL descendants with maximum specificity
              const allDescendants = element.querySelectorAll('*');
              allDescendants.forEach((child, index) => {
                const childElement = child as HTMLElement;
                childElement.style.setProperty('font-size', '14px', 'important');
                childElement.style.setProperty('line-height', '1.6', 'important');
                
                // Special handling for strong elements
                if (child.tagName === 'STRONG') {
                  childElement.style.setProperty('font-weight', '600', 'important');
                  childElement.style.setProperty('color', 'hsl(var(--primary))', 'important');
                } else {
                  childElement.style.setProperty('font-weight', '400', 'important');
                }
                
                // Add data attribute for CSS targeting
                childElement.setAttribute('data-forced-size', 'true');
              });
              
              nextElement = nextElement.nextElementSibling;
            }
          }
        });
      };
      
      // Apply styles immediately and again after a delay
      applyForcedStyles();
      setTimeout(applyForcedStyles, 100);
      setTimeout(applyForcedStyles, 500);
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
