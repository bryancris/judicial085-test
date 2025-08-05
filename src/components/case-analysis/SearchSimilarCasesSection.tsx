import React, { useState, useEffect } from "react";
import { SimilarCase } from "./SimilarCasesDialog";
import { searchSimilarCases } from "@/utils/openaiService";
import { saveSimilarCases } from "@/utils/api/similarCasesApiService";
import { useToast } from "@/hooks/use-toast";
import SearchSimilarCasesButton from "./SearchSimilarCasesButton";
import SimilarCasesDialog from "./SimilarCasesDialog";


export interface SearchSimilarCasesSectionProps {
  clientId: string;
  caseType?: string;
  legalAnalysisId?: string;
}

const SearchSimilarCasesSection: React.FC<SearchSimilarCasesSectionProps> = ({ 
  clientId,
  caseType,
  legalAnalysisId
}) => {
  const [isSearchingCases, setIsSearchingCases] = useState(false);
  const [similarCases, setSimilarCases] = useState<SimilarCase[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<any>(null);
  const { toast } = useToast();
  

  // Clear state when clientId changes to prevent showing cached results from previous client
  useEffect(() => {
    console.log(`SearchSimilarCasesSection: Client changed to ${clientId}, clearing previous search state`);
    setSimilarCases([]);
    setSearchError(null);
    setSearchResult(null);
    setIsDialogOpen(false);
    setIsSearchingCases(false);
  }, [clientId]);

  const handleSearchSimilarCases = async () => {
    if (isSearchingCases) return;
    
    setIsSearchingCases(true);
    setIsDialogOpen(true);
    setSearchError(null);
    setSearchResult(null);
    
    try {
      console.log("Starting search for similar cases for client:", clientId);
      const result = await searchSimilarCases(clientId);
      
      setSearchResult(result);
      
      if (result.error) {
        setSearchError(result.error);
        toast({
          title: "Search Failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setSimilarCases(result.similarCases || []);
        
        
        // Handle different search outcomes
        if (result.analysisFound === false) {
          toast({
            title: "Legal Analysis Required",
            description: "Please generate a legal analysis first to enable similar case search.",
            variant: "destructive",
          });
        } else if (result.searchStrategy === "missing-api-keys") {
          toast({
            title: "Configuration Required",
            description: "API keys not configured for similar case search.",
            variant: "destructive",
          });
        } else if (result.similarCases.length === 0) {
          toast({
            title: "No Similar Cases Found",
            description: result.message || "No similar cases were found in available legal databases.",
          });
        } else {
          // Determine case type from results
          const detectedCaseType = result.caseType || determineCaseTypeFromResults(result.similarCases);
          
          // Save similar cases to database if we have a legal analysis ID
          if (legalAnalysisId && result.similarCases.length > 0) {
            console.log("Saving similar cases to database after manual search");
            saveSimilarCases(
              clientId,
              legalAnalysisId,
              result.similarCases,
              {
                fallbackUsed: result.fallbackUsed,
                analysisFound: result.analysisFound,
                searchStrategy: result.searchStrategy,
                caseType: result.caseType
              }
            ).catch(error => {
              console.error("Failed to save similar cases:", error);
              // Don't show error to user as this is background operation
            });
          }
          
          toast({
            title: `Similar ${detectedCaseType} Cases Found`,
            description: `Found ${result.similarCases.length} verified cases with similar legal issues.`,
          });
        }
      }
    } catch (err: any) {
      console.error("Error searching for similar cases:", err);
      setSearchError(err.message || "An unexpected error occurred");
      setSearchResult(null);
      toast({
        title: "Search Error",
        description: err.message || "An unexpected error occurred while searching for similar cases.",
        variant: "destructive",
      });
      
      // Clear any previous results on error
      setSimilarCases([]);
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
        searchResult={searchResult}
      />
    </>
  );
};

export default SearchSimilarCasesSection;
