import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Lightbulb, FileText, Gavel, Zap } from "lucide-react";
import { SimilarCase } from "@/components/case-analysis/SimilarCasesSection";
import { useEnhancedSimilarCasesSearch } from "@/hooks/useEnhancedSimilarCasesSearch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ClientResearchPanelProps {
  clientId: string;
  clientName: string;
  caseId?: string;
  caseDescription?: string;
  isVisible: boolean;
  onClose: () => void;
}

interface ResearchSuggestion {
  type: "precedent" | "strategy" | "citation";
  title: string;
  description: string;
  confidence: number;
  source: string;
}

const ClientResearchPanel: React.FC<ClientResearchPanelProps> = ({
  clientId,
  clientName,
  caseId,
  caseDescription,
  isVisible,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ResearchSuggestion[]>([]);
  const [similarCases, setSimilarCases] = useState<SimilarCase[]>([]);
  const [autoResearchEnabled, setAutoResearchEnabled] = useState(true);
  const { toast } = useToast();

  const { searchWithCache, isSearching } = useEnhancedSimilarCasesSearch();

  // Auto-generate suggestions based on case description
  useEffect(() => {
    if (caseDescription && autoResearchEnabled) {
      generateAutoSuggestions(caseDescription);
    }
  }, [caseDescription, autoResearchEnabled]);

  const generateAutoSuggestions = async (description: string) => {
    try {
      // Extract key legal concepts from case description
      const concepts = extractLegalConcepts(description);
      
      const newSuggestions: ResearchSuggestion[] = concepts.map(concept => ({
        type: "precedent" as const,
        title: `Research ${concept} precedents`,
        description: `Find similar cases involving ${concept.toLowerCase()}`,
        confidence: 0.8,
        source: "AI Analysis"
      }));

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Error generating auto suggestions:", error);
    }
  };

  const extractLegalConcepts = (text: string): string[] => {
    const concepts = [];
    const lowercaseText = text.toLowerCase();
    
    // Common legal concepts to detect
    const legalTerms = [
      "contract", "breach", "negligence", "liability", "damages", 
      "employment", "discrimination", "harassment", "wrongful termination",
      "personal injury", "medical malpractice", "product liability",
      "property", "real estate", "landlord", "tenant", "lease",
      "divorce", "custody", "alimony", "child support",
      "criminal", "DUI", "assault", "theft", "fraud"
    ];

    legalTerms.forEach(term => {
      if (lowercaseText.includes(term)) {
        concepts.push(term.charAt(0).toUpperCase() + term.slice(1));
      }
    });

    return concepts.slice(0, 3); // Limit to top 3 concepts
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await searchWithCache(searchQuery, {
        clientId,
        caseId,
        includeSemanticSearch: true,
        limit: 5
      });

      setSimilarCases(results.similarCases || []);
      
      toast({
        title: "Research Complete",
        description: `Found ${results.similarCases?.length || 0} relevant cases`,
      });
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: "Unable to complete research. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSuggestionClick = async (suggestion: ResearchSuggestion) => {
    setSearchQuery(suggestion.title);
    await handleSearch();
  };

  if (!isVisible) return null;

  return (
    <Card className="fixed right-4 top-4 w-96 h-[80vh] z-50 shadow-xl border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Legal Research
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {clientName} {caseId && `• Case Research`}
        </div>
      </CardHeader>

      <CardContent className="h-full pb-4">
        <Tabs defaultValue="search" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4 h-full">
            <div className="space-y-4 h-full">
              <div className="flex gap-2">
                <Input
                  placeholder="Search legal precedents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  size="sm"
                >
                  {isSearching ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <ScrollArea className="h-[60vh]">
                {similarCases.length > 0 ? (
                  <div className="space-y-3">
                    {similarCases.map((case_, index) => (
                      <Card key={index} className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm">{case_.clientName}</h4>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(case_.similarity)}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {case_.relevantFacts}
                          </p>
                          <div className="text-xs">
                            <span className="font-medium">Outcome:</span> {case_.outcome}
                          </div>
                          {case_.citation && (
                            <div className="text-xs">
                              <span className="font-medium">Citation:</span> {case_.citation}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isSearching ? "Searching..." : "Enter a search query to find relevant cases"}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="mt-4 h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">AI-Generated Suggestions</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoResearchEnabled(!autoResearchEnabled)}
                  className="text-xs"
                >
                  <Zap className={`h-3 w-3 mr-1 ${autoResearchEnabled ? 'text-yellow-500' : ''}`} />
                  {autoResearchEnabled ? 'On' : 'Off'}
                </Button>
              </div>

              <ScrollArea className="h-[60vh]">
                {suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <Card 
                        key={index} 
                        className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {suggestion.type === "precedent" && <Gavel className="h-4 w-4" />}
                              {suggestion.type === "strategy" && <Lightbulb className="h-4 w-4" />}
                              {suggestion.type === "citation" && <FileText className="h-4 w-4" />}
                              <span className="font-medium text-sm">{suggestion.title}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(suggestion.confidence * 100)}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {suggestion.description}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Source: {suggestion.source}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {autoResearchEnabled 
                        ? "No suggestions available. Add case details for AI recommendations."
                        : "Enable auto-research to get AI suggestions"
                      }
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4 h-full">
            <div className="text-center py-8">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Research history will appear here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ClientResearchPanel;