
import React, { useEffect, useRef } from "react";
import EmptyAnalysisState from "./EmptyAnalysisState";
import AnalysisLoadingState from "./AnalysisLoadingState";
import AnalysisItem from "./AnalysisItem";

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

  return (
    <div className="flex-grow overflow-y-auto p-4 bg-card">
      {analysisItems.length === 0 ? (
        <EmptyAnalysisState isLoading={isLoading} />
      ) : (
        <div>
          {analysisItems.map((item, index) => (
            <AnalysisItem 
              key={index}
              content={item.content}
              timestamp={item.timestamp}
              onQuestionClick={onQuestionClick}
            />
          ))}
          <div ref={analysisEndRef} />
        </div>
      )}
      <AnalysisLoadingState isLoading={isLoading} />
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
