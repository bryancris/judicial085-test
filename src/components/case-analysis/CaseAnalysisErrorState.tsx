
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";

interface CaseAnalysisErrorStateProps {
  error: string;
  onRefresh: () => void;
}

const CaseAnalysisErrorState: React.FC<CaseAnalysisErrorStateProps> = ({ error, onRefresh }) => {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold mb-2">No Case Analysis Available</h2>
      <p className="text-muted-foreground mb-6">
        {error}
      </p>
      <Button 
        onClick={onRefresh}
        className="flex items-center gap-2"
      >
        <RefreshCwIcon className="h-4 w-4" />
        Generate Analysis
      </Button>
    </div>
  );
};

export default CaseAnalysisErrorState;
