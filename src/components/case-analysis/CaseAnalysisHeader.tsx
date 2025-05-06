
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";

interface CaseAnalysisHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const CaseAnalysisHeader: React.FC<CaseAnalysisHeaderProps> = ({ onRefresh, isLoading }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">Case Analysis</h2>
      <Button 
        onClick={onRefresh}
        variant="outline" 
        className="flex items-center gap-2"
        disabled={isLoading}
      >
        <RefreshCwIcon className="h-4 w-4" />
        Refresh Analysis
      </Button>
    </div>
  );
};

export default CaseAnalysisHeader;
