import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Search, 
  Zap, 
  FileText, 
  ExternalLink,
  Lightbulb,
  TrendingUp,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedSimilarCasesSearch } from "@/hooks/useEnhancedSimilarCasesSearch";
import { SimilarCase } from "@/components/case-analysis/SimilarCasesSection";

interface ContextualResearchWidgetProps {
  clientId: string;
  caseId?: string;
  currentText?: string;
  isVisible: boolean;
  onToggle: () => void;
}

interface ResearchResult {
  type: "case" | "statute" | "citation";
  title: string;
  description: string;
  relevance: number;
  source: string;
  url?: string;
}

interface AutoSuggestion {
  query: string;
  reason: string;
  confidence: number;
}

const ContextualResearchWidget: React.FC<ContextualResearchWidgetProps> = ({
  clientId,
  caseId,
  currentText = "",
  isVisible,
  onToggle
}) => {
  const [researchResults, setResearchResults] = useState<ResearchResult[]>([]);
  const [autoSuggestions, setAutoSuggestions] = useState<AutoSuggestion[]>([]);
  const [isAutoSearching, setIsAutoSearching] = useState(false);
  const [lastAnalyzedText, setLastAnalyzedText] = useState("");
  const { toast } = useToast();

  const { searchCases, isLoading } = useEnhancedSimilarCasesSearch();

  // Debounced text analysis
  const analyzeText = useCallback(
    debounce(async (text: string) => {
      if (!text || text.length < 50 || text === lastAnalyzedText) return;
      
      setIsAutoSearching(true);
      setLastAnalyzedText(text);

      try {
        const suggestions = extractLegalConcepts(text);
        setAutoSuggestions(suggestions);

        // Auto-search for the most relevant concept
        if (suggestions.length > 0) {
          const topSuggestion = suggestions[0];
          await performContextualSearch(topSuggestion.query);
        }
      } catch (error) {
        console.error("Text analysis error:", error);
      } finally {
        setIsAutoSearching(false);
      }
    }, 2000),
    [lastAnalyzedText]
  );

  useEffect(() => {
    if (currentText && isVisible) {
      analyzeText(currentText);
    }
  }, [currentText, isVisible, analyzeText]);

  const extractLegalConcepts = (text: string): AutoSuggestion[] => {
    const suggestions: AutoSuggestion[] = [];
    const lowercaseText = text.toLowerCase();

    // Legal concept patterns
    const conceptPatterns = [
      {
        pattern: /\b(breach of contract|contract breach)\b/gi,
        query: "breach of contract cases",
        reason: "Contract law violation detected"
      },
      {
        pattern: /\b(negligence|negligent)\b/gi,
        query: "negligence liability cases",
        reason: "Negligence claim identified"
      },
      {
        pattern: /\b(discrimination|discriminatory)\b/gi,
        query: "employment discrimination cases",
        reason: "Discrimination claim detected"
      },
      {
        pattern: /\b(personal injury|injuries)\b/gi,
        query: "personal injury damages",
        reason: "Personal injury matter identified"
      },
      {
        pattern: /\b(wrongful termination|fired|dismissed)\b/gi,
        query: "wrongful termination cases",
        reason: "Employment termination issue"
      },
      {
        pattern: /\b(medical malpractice|medical negligence)\b/gi,
        query: "medical malpractice cases",
        reason: "Medical malpractice claim detected"
      },
      {
        pattern: /\b(defamation|libel|slander)\b/gi,
        query: "defamation cases",
        reason: "Defamation claim identified"
      },
      {
        pattern: /\b(intellectual property|trademark|copyright|patent)\b/gi,
        query: "intellectual property disputes",
        reason: "IP matter detected"
      }
    ];

    conceptPatterns.forEach(({ pattern, query, reason }) => {
      const matches = text.match(pattern);
      if (matches) {
        suggestions.push({
          query,
          reason,
          confidence: Math.min(0.9, matches.length * 0.3)
        });
      }
    });

    // Sort by confidence and return top 3
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  };

  const performContextualSearch = async (query: string) => {
    try {
      const results = await searchCases(query, {
        clientId,
        caseId,
        includeSemanticSearch: true,
        limit: 5
      });

      const formattedResults: ResearchResult[] = (results.cases || []).map(case_ => ({
        type: "case" as const,
        title: case_.clientName,
        description: case_.relevantFacts,
        relevance: case_.similarity,
        source: case_.source === "courtlistener" ? "Court Opinion" : "Firm Database",
        url: case_.url
      }));

      setResearchResults(formattedResults);
    } catch (error) {
      console.error("Contextual search error:", error);
    }
  };

  const handleSuggestionClick = async (suggestion: AutoSuggestion) => {
    await performContextualSearch(suggestion.query);
    toast({
      title: "Research Updated",
      description: `Found relevant cases for: ${suggestion.query}`,
    });
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 writing-mode-vertical-rl rotate-180"
      >
        <BookOpen className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Card className="fixed right-4 top-4 w-80 h-[70vh] z-50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Research Assistant
            {isAutoSearching && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 h-full pb-4">
        {/* Auto Suggestions */}
        {autoSuggestions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Zap className="h-4 w-4 text-yellow-500" />
              AI Suggestions
            </h3>
            <div className="space-y-2">
              {autoSuggestions.map((suggestion, index) => (
                <Card 
                  key={index}
                  className="p-2 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{suggestion.query}</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(suggestion.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.reason}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Research Results */}
        <div className="flex-1">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
            <Search className="h-4 w-4" />
            Relevant Cases
            {researchResults.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {researchResults.length}
              </Badge>
            )}
          </h3>

          <ScrollArea className="h-[40vh]">
            {researchResults.length > 0 ? (
              <div className="space-y-3">
                {researchResults.map((result, index) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{result.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(result.relevance)}%
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {result.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {result.source}
                        </span>
                        {result.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => window.open(result.url, "_blank")}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isAutoSearching 
                    ? "Analyzing content..." 
                    : "Start typing case details to get relevant research"
                  }
                </p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {/* Open full research panel */}}
          >
            <Search className="h-3 w-3 mr-1" />
            Open Full Research
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default ContextualResearchWidget;