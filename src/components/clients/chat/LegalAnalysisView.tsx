
import React from "react";
import { Loader2 } from "lucide-react";

interface AnalysisItem {
  content: string;
  timestamp: string;
}

interface LegalAnalysisViewProps {
  analysisItems: AnalysisItem[];
  isLoading: boolean;
}

const LegalAnalysisView = ({ analysisItems, isLoading }: LegalAnalysisViewProps) => {
  return (
    <div className="flex-grow overflow-y-auto p-4 bg-card">
      {analysisItems.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Legal analysis will appear here as you conduct the interview.
        </div>
      ) : (
        analysisItems.map((item, index) => (
          <div key={index} className="mb-6">
            <p className="whitespace-pre-wrap">{item.content}</p>
            <div className="text-xs text-muted-foreground mt-1">{item.timestamp}</div>
          </div>
        ))
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

export default LegalAnalysisView;
