
import React from "react";
import { Search, X, ExternalLink, Building, Scale, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
}

const SimilarCasesDialog: React.FC<SimilarCasesDialogProps> = ({
  isOpen,
  onClose,
  similarCases,
  isLoading,
  error
}) => {
  // Split cases by source
  const internalCases = similarCases.filter(c => c.source === "internal");
  const courtListenerCases = similarCases.filter(c => c.source === "courtlistener");
  
  // Default to "court" tab if we have court cases, otherwise "internal"
  const defaultTab = courtListenerCases.length > 0 ? "court" : "internal";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Similar Cases
          </DialogTitle>
          <DialogDescription>
            Cases with similar facts and legal issues from your database and public Texas court records
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive font-medium text-lg mb-2">Error Finding Similar Cases</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        ) : similarCases.length === 0 ? (
          <div className="text-center py-8">
            <p className="font-medium text-lg mb-2">No Similar Cases Found</p>
            <p className="text-muted-foreground mb-4">We couldn't find any cases with similar facts or legal issues.</p>
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        ) : (
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
                        {Math.round(similarCase.similarity * 100)}% similar
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
                  <p className="text-muted-foreground">No similar court cases found.</p>
                </div>
              ) : (
                courtListenerCases.map((courtCase, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{courtCase.clientName}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Badge variant="outline" className="font-normal">
                            <Scale className="h-3 w-3 mr-1" /> {courtCase.court || "Texas Court"}
                          </Badge>
                          <Badge variant="outline" className="font-normal">
                            <CalendarDays className="h-3 w-3 mr-1" /> {courtCase.dateDecided || "Unknown date"}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-normal">
                        {courtCase.citation || "No citation"}
                      </Badge>
                    </div>
                    
                    <div className="mt-3 text-sm">
                      <h4 className="font-medium mb-1">Relevant Excerpt:</h4>
                      <p className="text-muted-foreground mb-3 text-sm bg-muted p-2 rounded">{courtCase.relevantFacts}</p>
                      
                      <h4 className="font-medium mb-1">Outcome:</h4>
                      <p className="text-muted-foreground">{courtCase.outcome}</p>
                    </div>
                    
                    {courtCase.url && (
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
                    )}
                  </div>
                ))
              )}
              <div className="flex items-center justify-center text-xs text-muted-foreground mt-4">
                <p>Data provided by CourtListener and Free Law Project</p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SimilarCasesDialog;
