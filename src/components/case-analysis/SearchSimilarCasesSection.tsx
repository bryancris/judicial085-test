import React, { useState, useEffect } from "react";
import { SimilarCase } from "./SimilarCasesDialog";
import { searchSimilarCases } from "@/utils/api/analysisApiService";
import { saveSimilarCases, loadSimilarCases, checkSimilarCasesExist } from "@/utils/api/similarCasesApiService";
import { useEnhancedSimilarCasesSearch } from "@/hooks/useEnhancedSimilarCasesSearch";
import { useToast } from "@/hooks/use-toast";
import SearchSimilarCasesButton from "./SearchSimilarCasesButton";
import SimilarCasesDialog from "./SimilarCasesDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


export interface SearchSimilarCasesSectionProps {
  clientId: string;
  caseType?: string;
  legalAnalysisId?: string;
  onCasesFound?: () => void;
}

const SearchSimilarCasesSection: React.FC<SearchSimilarCasesSectionProps> = ({ 
  clientId,
  caseType,
  legalAnalysisId,
  onCasesFound
}) => {
  const [isSearchingCases, setIsSearchingCases] = useState(false);
  const [similarCases, setSimilarCases] = useState<SimilarCase[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [existingCasesCount, setExistingCasesCount] = useState(0);
  const { toast } = useToast();
  const { searchWithCache, isSearching: isEnhancedSearching } = useEnhancedSimilarCasesSearch();
  

  // Clear state when clientId changes to prevent showing cached results from previous client
  useEffect(() => {
    console.log(`SearchSimilarCasesSection: Client changed to ${clientId}, clearing previous search state`);
    setSimilarCases([]);
    setSearchError(null);
    setSearchResult(null);
    setIsDialogOpen(false);
    setIsSearchingCases(false);
    setLastUpdated(null);
    setExistingCasesCount(0);
  }, [clientId]);

  // Check for existing cases when legalAnalysisId changes
  useEffect(() => {
    const checkExistingCases = async () => {
      if (!clientId || !legalAnalysisId) return;
      
      try {
        const { similarCases, metadata } = await loadSimilarCases(clientId, legalAnalysisId);
        if (similarCases.length > 0) {
          setExistingCasesCount(similarCases.length);
          // Try to parse a reasonable timestamp
          const timestamp = new Date(); // Default to now if we can't determine when they were created
          setLastUpdated(timestamp);
        }
      } catch (error) {
        console.error("Error checking existing cases:", error);
      }
    };

    checkExistingCases();
  }, [clientId, legalAnalysisId]);

  const handleSearchSimilarCases = async () => {
    if (isSearchingCases || isEnhancedSearching) return;
    
    // Check if recent cases exist and warn about API costs
    if (existingCasesCount > 0 && lastUpdated) {
      const hoursAgo = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 24) {
        setShowConfirmDialog(true);
        return;
      }
    }

    performSearch();
  };

  const performSearch = async () => {
    setIsSearchingCases(true);
    setIsDialogOpen(true);
    setSearchError(null);
    setSearchResult(null);
    
    try {
      console.log("Starting enhanced search for similar cases for client:", clientId);
      
      // First try the enhanced cache-first search
      const enhancedResult = await searchWithCache(`client:${clientId}`, { clientId });
      
      if (enhancedResult.similarCases.length > 0) {
        console.log("Enhanced search found cached results");
        setSimilarCases(enhancedResult.similarCases);
        setSearchResult({
          similarCases: enhancedResult.similarCases,
          searchStrategy: enhancedResult.searchMetadata.searchStrategy,
          analysisFound: true,
          cacheUsed: enhancedResult.searchMetadata.cacheUsed,
          freshApiCall: enhancedResult.searchMetadata.freshApiCall,
          responseTime: enhancedResult.searchMetadata.responseTime,
          totalResults: enhancedResult.searchMetadata.totalResults
        });
        
        toast({
          title: "Similar Cases Found",
          description: `Found ${enhancedResult.similarCases.length} cases${enhancedResult.searchMetadata.cacheUsed ? ' (from cache)' : ' (fresh search)'}.`,
        });
        
        // Trigger refresh if cases were found
        if (onCasesFound) {
          onCasesFound();
        }
        return;
      }
      
      // Fall back to the original search method
      console.log("Enhanced search found no results, falling back to original search");
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
        } else if ((result as any).searchStrategy === "missing-api-keys") {
          toast({
            title: "Configuration Required",
            description: "API keys not configured for similar case search.",
            variant: "destructive",
          });
        } else if (result.similarCases.length === 0) {
          toast({
            title: "No Similar Cases Found",
            description: "No similar cases were found in available legal databases.",
          });
        } else {
          // Determine case type from results
          const detectedCaseType = determineCaseTypeFromResults(result.similarCases);
          
          // Save similar cases to database if we have a legal analysis ID
          if (legalAnalysisId && result.similarCases.length > 0) {
            console.log("Saving similar cases to database after manual search");
            try {
              await saveSimilarCases(
                clientId,
                legalAnalysisId,
                result.similarCases,
                {
                  fallbackUsed: result.fallbackUsed,
                  analysisFound: result.analysisFound,
                  searchStrategy: ((result as any).searchStrategy) ?? 'basic',
                  caseType: determineCaseTypeFromResults(result.similarCases)
                }
              );
              // Trigger refresh of parent component's similar cases display
              if (onCasesFound) {
                onCasesFound();
              }
            } catch (error) {
              console.error("Failed to save similar cases:", error);
              // Don't show error to user as this is background operation
            }
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

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "less than 1 hour ago";
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
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
        isLoading={isSearchingCases || isEnhancedSearching}
        lastUpdated={lastUpdated ? formatTimestamp(lastUpdated) : undefined}
        existingCasesCount={existingCasesCount}
      />

      <SimilarCasesDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        similarCases={similarCases}
        isLoading={isSearchingCases || isEnhancedSearching}
        error={searchError}
        searchResult={searchResult}
      />

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Fresh Search</AlertDialogTitle>
            <AlertDialogDescription>
              You already have {existingCasesCount} similar cases from {lastUpdated ? formatTimestamp(lastUpdated) : 'recently'}. 
              Running a fresh search will consume API tokens and may return similar results.
              <br /><br />
              <strong>Continue with fresh search?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowConfirmDialog(false);
              performSearch();
            }}>
              Search Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SearchSimilarCasesSection;
