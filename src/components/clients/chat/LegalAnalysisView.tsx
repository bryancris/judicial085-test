
import React, { useEffect, useRef } from "react";
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
  const analysisEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when analysis items change
    if (analysisEndRef.current) {
      analysisEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [analysisItems]);

  return (
    <div className="flex-grow overflow-y-auto p-4 bg-card">
      {analysisItems.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Legal analysis will appear here after attorney-client conversation begins.
        </div>
      ) : (
        <div>
          {analysisItems.map((item, index) => (
            <div key={index} className="mb-6">
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ 
                  __html: item.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert **text** to <strong>
                    .replace(/\n/g, '<br />') // Convert newlines to <br>
                }} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{item.timestamp}</div>
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

export default LegalAnalysisView;
