
import React from "react";
import { Search, X, ExternalLink, Building, Scale, CalendarDays, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface SimilarCase {
  source: "internal" | "courtlistener";
  clientId: string | null;
  clientName: string;
  similarity: number;
  relevantFacts: string;
  outcome: string;
  court?: string;
  citation?: string;
  dateDecided?: string;
  url?: string | null;
}

interface SimilarCasesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  similarCases: SimilarCase[];
  isLoading: boolean;
  error: string | null;
  searchResult?: {
    message?: string;
    searchStrategy?: string;
    analysisFound?: boolean;
  };
}

const SimilarCasesDialog: React.FC<SimilarCasesDialogProps> = ({
  isOpen,
  onClose,
  similarCases,
  isLoading,
  error,
  searchResult
}) => {
  // Split cases by source
  const internalCases = similarCases.filter(c => c.source === "internal");
  const courtListenerCases = similarCases.filter(c => c.source === "courtlistener");
  
  // Default to "court" tab if we have court cases, otherwise "internal"
  const defaultTab = courtListenerCases.length > 0 ? "court" : "internal";

  // Check if we need to show a message about no analysis
  const needsAnalysis = searchResult?.analysisFound === false;
  const noResultsFound = similarCases.length === 0 && !needsAnalysis && !error;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Similar Cases Search
          </DialogTitle>
          <DialogDescription>
            Search for similar cases from verified legal databases and court records
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Searching legal databases...</span>
            </div>
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <p className="text-destructive font-medium text-lg mb-2">Search Error</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        ) : needsAnalysis ? (
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
            <p className="font-medium text-lg mb-2">Legal Analysis Required</p>
            <p className="text-muted-foreground mb-4">
              Please generate a legal analysis for this client first by clicking the "Refresh Analysis" button at the top of the page. This helps find the most relevant similar cases.
            </p>
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        ) : noResultsFound ? (
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-blue-500 mx-auto mb-2" />
            <p className="font-medium text-lg mb-2">No Similar Cases Found</p>
            <div className="max-w-md mx-auto space-y-3">
              <p className="text-muted-foreground">
                {searchResult?.message || "No similar cases were found in available legal databases."}
              </p>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  This may indicate a unique legal situation, or that similar cases have not been digitized in public databases. Consider consulting additional legal research resources.
                </AlertDescription>
              </Alert>
            </div>
            <Button onClick={onClose} variant="outline" className="mt-4">Close</Button>
          </div>
        ) : (
          <>
            {searchResult?.message && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>{searchResult.message}</AlertDescription>
              </Alert>
            )}
            
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="internal" disabled={internalCases.length === 0}>
                  Firm Cases ({internalCases.length})
                </TabsTrigger>
                <TabsTrigger value="court" disabled={courtListenerCases.length === 0}>
                  Court Opinions ({courtListenerCases.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="internal" className="space-y-4">
                {internalCases.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No similar cases found in your firm's database.</p>
                  </div>
                ) : (
                  internalCases.map((similarCase, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg">{similarCase.clientName}</h3>
                        <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {Math.round(similarCase.similarity)}% similar
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        <h4 className="font-medium text-foreground mb-1">Relevant Facts:</h4>
                        <p className="mb-2">{similarCase.relevantFacts}</p>
                        
                        <h4 className="font-medium text-foreground mb-1">Outcome:</h4>
                        <p>{similarCase.outcome}</p>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.location.href = `/clients/${similarCase.clientId}`}
                        >
                          View Case
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="court" className="space-y-4">
                {courtListenerCases.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No similar court cases found in legal databases.</p>
                  </div>
                ) : (
                  <>
                    <Alert>
                      <Scale className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        These are real cases from verified legal databases. All information has been sourced from official court records.
                      </AlertDescription>
                    </Alert>
                    
                    {courtListenerCases.map((courtCase, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">{courtCase.clientName}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Badge variant="outline" className="font-normal">
                                <Scale className="h-3 w-3 mr-1" /> {courtCase.court || "Court of Record"}
                              </Badge>
                              <Badge variant="outline" className="font-normal">
                                <CalendarDays className="h-3 w-3 mr-1" /> {courtCase.dateDecided || "Date not available"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="secondary" className="font-normal">
                              {courtCase.citation || "Citation not available"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(courtCase.similarity)}% relevance
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-sm">
                          <h4 className="font-medium mb-1">Relevant Excerpt:</h4>
                          <p className="text-muted-foreground mb-3 text-sm bg-muted p-2 rounded">{courtCase.relevantFacts}</p>
                          
                          <h4 className="font-medium mb-1">Outcome:</h4>
                          <p className="text-muted-foreground">{courtCase.outcome}</p>
                        </div>
                        
                        {courtCase.url ? (
                          <div className="flex justify-end mt-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(courtCase.url || "", "_blank")}
                              className="flex items-center"
                            >
                              View Full Opinion <ExternalLink className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end mt-3">
                            <Badge variant="secondary" className="text-xs">
                              Full text not available
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
                {courtListenerCases.length > 0 && (
                  <div className="flex items-center justify-center text-xs text-muted-foreground mt-4 pt-4 border-t">
                    <p>Data sourced from CourtListener and Free Law Project</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SimilarCasesDialog;
