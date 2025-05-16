
import React, { useEffect, useRef } from "react";
import EmptyAnalysisState from "./EmptyAnalysisState";
import AnalysisLoadingState from "./AnalysisLoadingState";
import AnalysisItem from "./AnalysisItem";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AnalysisItem {
  content: string;
  timestamp: string;
}

interface LegalAnalysisViewProps {
  analysisItems: AnalysisItem[];
  isLoading: boolean;
  error?: string | null;
  onQuestionClick?: (question: string) => void;
}

const LegalAnalysisView = ({ analysisItems, isLoading, error, onQuestionClick }: LegalAnalysisViewProps) => {
  const analysisEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when analysis items change
    if (analysisEndRef.current) {
      analysisEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [analysisItems]);

  return (
    <div className="flex-grow overflow-y-auto p-4 bg-card">
      {error && !isLoading && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {analysisItems.length === 0 ? (
        <EmptyAnalysisState isLoading={isLoading} />
      ) : (
        <div className="legal-analysis-container">
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
      <AnalysisLoadingState isLoading={isLoading} error={error} />
    </div>
  );
};

export default LegalAnalysisView;
