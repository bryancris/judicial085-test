import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  Database, 
  Brain, 
  Activity,
  RefreshCw,
  ExternalLink,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PendingCase {
  id: string;
  courtlistener_id: string;
  case_name: string;
  court?: string | null;
  citation?: string | null;
  date_decided?: string | null;
  snippet: string | null;
  last_updated_at: string;
  api_fetch_count: number;
  has_embeddings?: boolean;
  has_concepts?: boolean;
}

interface PendingCasesPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalPending: number;
}

const PendingCasesPreviewDialog: React.FC<PendingCasesPreviewDialogProps> = ({
  open,
  onOpenChange,
  totalPending,
}) => {
  const [cases, setCases] = useState<PendingCase[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPendingCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_cases_needing_enrichment', { batch_size: 50 });

      if (error) throw error;
      setCases(data || []);
    } catch (error: any) {
      console.error("Error fetching pending cases:", error);
      toast({
        title: "Error",
        description: "Failed to load pending cases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPendingCases();
    }
  }, [open]);

  const getMissingEnrichmentTypes = (caseItem: PendingCase) => {
    const missing = [];
    if (!caseItem.has_embeddings) missing.push("Embeddings");
    if (!caseItem.has_concepts) missing.push("Concepts");
    return missing;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Cases Pending Enrichment
          </DialogTitle>
          <DialogDescription>
            {totalPending} cases need enrichment processing. Showing up to 50 cases.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            Displaying {cases.length} of {totalPending} pending cases
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPendingCases}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending cases found
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-2">
                        <h4 className="font-medium text-sm leading-tight">
                          {caseItem.case_name}
                        </h4>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          ID: {caseItem.courtlistener_id}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {caseItem.court && (
                          <div className="flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            {caseItem.court}
                          </div>
                        )}
                        
                        {caseItem.citation && (
                          <div className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {caseItem.citation}
                          </div>
                        )}
                        
                        {caseItem.date_decided && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(caseItem.date_decided)}
                          </div>
                        )}
                      </div>

                      {caseItem.snippet && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {caseItem.snippet}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 space-y-2">
                      <div className="flex flex-col gap-1">
                        {getMissingEnrichmentTypes(caseItem).map((type) => (
                          <Badge 
                            key={type} 
                            variant="secondary" 
                            className="text-xs flex items-center gap-1"
                          >
                            {type === "Embeddings" ? (
                              <Brain className="h-3 w-3" />
                            ) : (
                              <Activity className="h-3 w-3" />
                            )}
                            Missing {type}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="text-xs text-muted-foreground text-right">
                        Fetched {caseItem.api_fetch_count}x
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Cases missing embeddings or legal concept extraction
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendingCasesPreviewDialog;