
import React from "react";
import { Loader2 } from "lucide-react";

interface AnalysisLoadingStateProps {
  isLoading: boolean;
}

const AnalysisLoadingState: React.FC<AnalysisLoadingStateProps> = ({ isLoading }) => {
  if (!isLoading) return null;
  
  return (
    <div className="flex items-center gap-2 text-muted-foreground mt-4">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Generating legal analysis...</span>
    </div>
  );
};

export default AnalysisLoadingState;
