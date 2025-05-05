
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";
import { useCaseAnalysis } from "@/hooks/useCaseAnalysis";
import CaseOutcomePrediction from "./CaseOutcomePrediction";
import DetailedLegalAnalysis from "./DetailedLegalAnalysis";
import CaseStrengthsWeaknesses from "./CaseStrengthsWeaknesses";
import ConversationSummary from "./ConversationSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface CaseAnalysisContainerProps {
  clientId: string;
}

const CaseAnalysisContainer: React.FC<CaseAnalysisContainerProps> = ({ clientId }) => {
  const { analysisData, isLoading, error, generateNewAnalysis } = useCaseAnalysis(clientId);
  const { toast } = useToast();

  const handleRefreshAnalysis = () => {
    if (isLoading) return;
    
    generateNewAnalysis();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Case Analysis</h2>
          <Button disabled variant="outline" className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            Generating Analysis...
          </Button>
        </div>
        <Skeleton className="h-[150px] w-full mb-6" />
        <Skeleton className="h-[300px] w-full mb-6" />
        <Skeleton className="h-[200px] w-full mb-6" />
        <Skeleton className="h-[250px] w-full" />
      </div>
    );
  }

  if (error && !analysisData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No Case Analysis Available</h2>
        <p className="text-muted-foreground mb-6">
          {error}
        </p>
        <Button 
          onClick={handleRefreshAnalysis}
          className="flex items-center gap-2"
        >
          <RefreshCwIcon className="h-4 w-4" />
          Generate Analysis
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Case Analysis</h2>
        <Button 
          onClick={handleRefreshAnalysis}
          variant="outline" 
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <RefreshCwIcon className="h-4 w-4" />
          Refresh Analysis
        </Button>
      </div>

      {analysisData && (
        <>
          <CaseOutcomePrediction 
            defense={analysisData.outcome.defense} 
            prosecution={analysisData.outcome.prosecution}
            isLoading={isLoading}
          />

          <DetailedLegalAnalysis 
            relevantLaw={analysisData.legalAnalysis.relevantLaw}
            preliminaryAnalysis={analysisData.legalAnalysis.preliminaryAnalysis}
            potentialIssues={analysisData.legalAnalysis.potentialIssues}
            followUpQuestions={analysisData.legalAnalysis.followUpQuestions}
            isLoading={isLoading}
          />

          <CaseStrengthsWeaknesses 
            strengths={analysisData.strengths}
            weaknesses={analysisData.weaknesses}
            isLoading={isLoading}
          />

          <ConversationSummary 
            summary={analysisData.conversationSummary}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
};

export default CaseAnalysisContainer;
