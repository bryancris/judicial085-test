
import React from "react";

interface EmptyAnalysisStateProps {
  isLoading: boolean;
}

const EmptyAnalysisState: React.FC<EmptyAnalysisStateProps> = ({ isLoading }) => {
  if (isLoading) return null;
  
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Legal analysis will appear here after attorney-client conversation begins.
      <br/><br/>
      Both attorney and client must contribute to the conversation before analysis is generated.
    </div>
  );
};

export default EmptyAnalysisState;
