
import React from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface AnalysisLoadingStateProps {
  isLoading: boolean;
  error?: string | null;
}

const AnalysisLoadingState: React.FC<AnalysisLoadingStateProps> = ({ isLoading, error }) => {
  if (!isLoading && !error) return null;
  
  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive mt-4">
        <AlertCircle className="h-4 w-4" />
        <span>Error generating analysis: {error}</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 text-muted-foreground mt-4">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Generating legal analysis...</span>
    </div>
  );
};

export default AnalysisLoadingState;
