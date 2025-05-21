
import React, { useState } from "react";
import { SimilarCase } from "./SimilarCasesDialog";
import { searchSimilarCases } from "@/utils/openaiService";
import { useToast } from "@/hooks/use-toast";
import SearchSimilarCasesButton from "./SearchSimilarCasesButton";
import SimilarCasesDialog from "./SimilarCasesDialog";
import CaseOutcomePrediction from "./CaseOutcomePrediction";

export interface SearchSimilarCasesSectionProps {
  clientId: string;
  caseType?: string;
}

const SearchSimilarCasesSection: React.FC<SearchSimilarCasesSectionProps> = ({ 
  clientId,
  caseType
}) => {
  const [isSearchingCases, setIsSearchingCases] = useState(false);
  const [similarCases, setSimilarCases] = useState<SimilarCase[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Default outcome prediction values - will be updated based on case analysis
  const [outcomeDefense, setOutcomeDefense] = useState(75); // Default to 75% client win likelihood
  const [outcomeProsecution, setOutcomeProsecution] = useState(25); // Default to 25% case loss risk

  const handleSearchSimilarCases = async () => {
    if (isSearchingCases) return;
    
    setIsSearchingCases(true);
    setIsDialogOpen(true);
    setSearchError(null);
    
    try {
      console.log("Starting search for similar cases for client:", clientId);
      const { similarCases, error, fallbackUsed, analysisFound } = await searchSimilarCases(clientId);
      
      if (error) {
        setSearchError(error);
        toast({
          title: "Search Failed",
          description: error,
          variant: "destructive",
        });
      } else {
        setSimilarCases(similarCases || []);
        
        // Update the prediction percentages based on similar cases
        if (similarCases?.length > 0) {
          let favorableCases = 0;
          similarCases.forEach(c => {
            const outcome = c.outcome?.toLowerCase() || '';
            if (outcome.includes('favorable') || outcome.includes('victory') || 
                outcome.includes('ruled in favor') || outcome.includes('prevailed') ||
                outcome.includes('for the plaintiff') || outcome.includes('for plaintiff') ||
                outcome.includes('awarded') || outcome.includes('damages')) {
              favorableCases++;
            }
          });
          
          // Calculate win likelihood based on similar case outcomes
          if (similarCases.length > 0) {
            const winRate = (favorableCases / similarCases.length) * 100;
            // Adjust the win percentage but keep it between 25-85% to avoid extreme predictions
            const adjustedDefense = Math.min(Math.max(winRate, 25), 85);
            setOutcomeDefense(Math.round(adjustedDefense));
            setOutcomeProsecution(100 - Math.round(adjustedDefense));
          }
        }
        
        if (!analysisFound) {
          toast({
            title: "Legal Analysis Required",
            description: "Please generate a legal analysis first to find relevant similar cases.",
            variant: "warning",
          });
        } else if (fallbackUsed) {
          toast({
            title: "Using Similar Case Examples",
            description: "Showing sample cases with similar legal issues from our database.",
            variant: "default",
          });
        } else if (similarCases.length === 0) {
          toast({
            title: "No Similar Cases Found",
            description: "We couldn't find any cases with similar facts or legal issues.",
          });
        } else {
          // Determine case type from results
          const caseType = determineCaseTypeFromResults(similarCases);
          
          toast({
            title: `Similar ${caseType} Cases Found`,
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
      
      // Set fallback cases if there's an error
      setSimilarCases([
        {
          source: "courtlistener",
          clientId: null,
          clientName: "Error Retrieving Cases",
          similarity: 0,
          relevantFacts: "There was an error retrieving similar cases. Please try again later.",
          outcome: "No outcome available",
          court: "N/A",
          citation: "N/A",
          dateDecided: "N/A",
          url: null
        }
      ]);
    } finally {
      setIsSearchingCases(false);
    }
  };
  
  // Helper function to determine case type from results
  const determineCaseTypeFromResults = (cases: SimilarCase[]): string => {
    if (!cases || cases.length === 0) return "Legal";
    
    // Check for case type indicators in the results
    const allText = cases.map(c => 
      (c.relevantFacts || "") + " " + (c.outcome || "")
    ).join(" ").toLowerCase();
    
    if (allText.includes("hoa") || allText.includes("homeowner") || 
        allText.includes("property code") || allText.includes("209.006")) {
      return "HOA";
    } else if (allText.includes("bailment") || allText.includes("vehicle theft") || 
        allText.includes("property") && allText.includes("stolen")) {
      return "Bailment/Property";
    } else if (allText.includes("slip and fall") || allText.includes("premises liability")) {
      return "Premises Liability";
    } else if (allText.includes("car accident") || allText.includes("motor vehicle")) {
      return "Motor Vehicle";
    } else if (allText.includes("medical malpractice") || allText.includes("hospital")) {
      return "Medical Malpractice";
    } else if (allText.includes("product liability") || allText.includes("defective")) {
      return "Product Liability";
    } else if (allText.includes("contract") || allText.includes("agreement")) {
      return "Contract";
    } else if (allText.includes("employment") || allText.includes("workplace")) {
      return "Employment";
    } else if (allText.includes("deceptive") || allText.includes("trade practice") || 
               allText.includes("dtpa") || allText.includes("consumer")) {
      return "Consumer Protection";
    }
    
    // Default to the provided case type or "Legal" if not available
    return caseType ? caseType.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Legal";
  };

  return (
    <>
      {/* Add the case outcome prediction bar */}
      <div className="mb-6">
        <CaseOutcomePrediction 
          defense={outcomeDefense} 
          prosecution={outcomeProsecution}
          caseType={caseType}
        />
      </div>
      
      <SearchSimilarCasesButton 
        onClick={handleSearchSimilarCases}
        isLoading={isSearchingCases}
      />

      <SimilarCasesDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        similarCases={similarCases}
        isLoading={isSearchingCases}
        error={searchError}
      />
    </>
  );
};

export default SearchSimilarCasesSection;
