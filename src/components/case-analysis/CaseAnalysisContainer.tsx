
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";
import { useCaseAnalysis } from "@/hooks/useCaseAnalysis";
import CaseOutcomePrediction from "./CaseOutcomePrediction";
import DetailedLegalAnalysis from "./DetailedLegalAnalysis";
import CaseStrengthsWeaknesses from "./CaseStrengthsWeaknesses";
import SearchSimilarCasesButton from "./SearchSimilarCasesButton";
import SimilarCasesDialog from "./SimilarCasesDialog";
import ConversationSummary from "./ConversationSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { searchSimilarCases } from "@/utils/openaiService";
import { SimilarCase } from "./SimilarCasesDialog";

interface CaseAnalysisContainerProps {
  clientId: string;
}

const CaseAnalysisContainer: React.FC<CaseAnalysisContainerProps> = ({ clientId }) => {
  const { analysisData, isLoading, error, generateNewAnalysis } = useCaseAnalysis(clientId);
  const [isSearchingCases, setIsSearchingCases] = useState(false);
  const [similarCases, setSimilarCases] = useState<SimilarCase[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRefreshAnalysis = () => {
    if (isLoading) return;
    
    generateNewAnalysis();
  };

  const handleSearchSimilarCases = async () => {
    if (isSearchingCases) return;
    
    setIsSearchingCases(true);
    setIsDialogOpen(true);
    setSearchError(null);
    
    try {
      const { similarCases, error } = await searchSimilarCases(clientId);
      
      if (error) {
        setSearchError(error);
        toast({
          title: "Search Failed",
          description: error,
          variant: "destructive",
        });
      } else {
        setSimilarCases(similarCases);
        
        if (similarCases.length === 0) {
          toast({
            title: "No Similar Cases Found",
            description: "We couldn't find any cases with similar facts or legal issues.",
          });
        } else {
          toast({
            title: "Similar Cases Found",
            description: `Found ${similarCases.length} cases with similar facts or legal issues.`,
          });
        }
      }
    } catch (err: any) {
      console.error("Error searching for similar cases:", err);
      setSearchError(err.message || "An unexpected error occurred");
      toast({
        title: "Search Error",
        description: err.message || "An unexpected error occurred while searching for similar cases.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingCases(false);
    }
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

          {/* Add the Search Similar Cases button here */}
          <SearchSimilarCasesButton 
            onClick={handleSearchSimilarCases}
            isLoading={isSearchingCases}
          />

          <ConversationSummary 
            summary={analysisData.conversationSummary}
            isLoading={isLoading}
            clientId={clientId}
          />

          {/* Add the Similar Cases Dialog */}
          <SimilarCasesDialog 
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            similarCases={similarCases}
            isLoading={isSearchingCases}
            error={searchError}
          />
        </>
      )}
    </div>
  );
};

export default CaseAnalysisContainer;
