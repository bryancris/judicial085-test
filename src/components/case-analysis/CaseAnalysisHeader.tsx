
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Scale } from "lucide-react";

interface CaseAnalysisHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  caseType?: string;
}

const CaseAnalysisHeader: React.FC<CaseAnalysisHeaderProps> = ({
  onRefresh,
  isLoading,
  caseType
}) => {
  const getCaseTypeLabel = () => {
    switch (caseType) {
      case "consumer-protection":
        return "Consumer Protection";
      case "personal-injury":
        return "Personal Injury";
      case "premises-liability":
        return "Premises Liability";
      case "contract-dispute":
        return "Contract Dispute";
      case "employment":
        return "Employment";
      case "medical-malpractice":
        return "Medical Malpractice";
      case "motor-vehicle-accident":
        return "Motor Vehicle Accident";
      default:
        return null;
    }
  };

  const caseTypeLabel = getCaseTypeLabel();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
      <div className="flex items-center gap-2">
        <Scale className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold leading-tight">Case Analysis</h2>
        {caseTypeLabel && (
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            caseType === "consumer-protection" 
              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200" 
              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
          }`}>
            {caseTypeLabel}
          </span>
        )}
      </div>
      <Button
        onClick={onRefresh}
        className="mt-2 sm:mt-0"
        disabled={isLoading}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        {isLoading ? "Generating..." : "Generate New Analysis"}
      </Button>
    </div>
  );
};

export default CaseAnalysisHeader;
