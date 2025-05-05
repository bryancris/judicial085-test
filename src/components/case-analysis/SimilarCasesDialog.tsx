
import React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export interface SimilarCase {
  clientId: string;
  clientName: string;
  similarity: number;
  relevantFacts: string;
  outcome: string;
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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Similar Cases
          </DialogTitle>
          <DialogDescription>
            Cases with similar facts and legal issues from your database
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
          <div className="space-y-4 py-2">
            {similarCases.map((similarCase, index) => (
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
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SimilarCasesDialog;
