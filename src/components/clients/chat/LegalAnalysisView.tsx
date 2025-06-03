
import React, { useEffect, useRef } from "react";
import EmptyAnalysisState from "./EmptyAnalysisState";
import AnalysisLoadingState from "./AnalysisLoadingState";
import AnalysisItem from "./AnalysisItem";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, File, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AnalysisItem {
  content: string;
  timestamp: string;
  documentsUsed?: any[];
}

interface LegalAnalysisViewProps {
  analysisItems: AnalysisItem[];
  isLoading: boolean;
  error?: string | null;
  onQuestionClick?: (question: string) => void;
  clientId?: string;
}

const LegalAnalysisView = ({ analysisItems, isLoading, error, onQuestionClick, clientId }: LegalAnalysisViewProps) => {
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
            <div key={index} className="relative">
              {/* Show research update badge if content contains research updates */}
              {item.content.includes('**RESEARCH UPDATE') && (
                <div className="mb-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 font-normal text-xs bg-green-50">
                          <RefreshCw className="h-3 w-3" />
                          Research Update
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">This analysis includes findings from case discussion research</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              
              {item.documentsUsed && item.documentsUsed.length > 0 && (
                <div className="mb-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 font-normal text-xs bg-amber-50">
                          <File className="h-3 w-3" />
                          {item.documentsUsed.length} document{item.documentsUsed.length !== 1 ? 's' : ''} used
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs font-medium">Documents used in this analysis:</p>
                        <ul className="text-xs mt-1">
                          {item.documentsUsed.map((doc, idx) => (
                            <li key={idx}>• {doc.title}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              <AnalysisItem 
                content={item.content}
                timestamp={item.timestamp}
                onQuestionClick={onQuestionClick}
              />
            </div>
          ))}
          <div ref={analysisEndRef} />
        </div>
      )}
      <AnalysisLoadingState isLoading={isLoading} error={error} />
    </div>
  );
};

export default LegalAnalysisView;
