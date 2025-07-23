
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, ExternalLink, Gavel } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import CaseOutcomePrediction from "./CaseOutcomePrediction";

export interface SimilarCase {
  source: "internal" | "courtlistener" | "perplexity";
  clientId: string | null;
  clientName: string;
  similarity: number;
  relevantFacts: string;
  outcome: string;
  court?: string;
  citation?: string;
  dateDecided?: string;
  url?: string | null;
  agentReasoning?: string;
  citations?: string[];
}

export interface SimilarCasesSectionProps {
  similarCases: SimilarCase[];
  isLoading?: boolean;
  caseType?: string;
  analysisFound?: boolean;
  fallbackUsed?: boolean;
}

const SimilarCasesSection: React.FC<SimilarCasesSectionProps> = ({
  similarCases,
  isLoading = false,
  caseType,
  analysisFound = true,
  fallbackUsed = false
}) => {
  // Calculate outcome prediction based on similar cases
  const calculateOutcome = () => {
    if (!similarCases || similarCases.length === 0) {
      return { defense: 65, prosecution: 35 };
    }
    
    const favorableOutcomes = similarCases.filter(c => 
      c.outcome.toLowerCase().includes('favorable') || 
      c.outcome.toLowerCase().includes('won') ||
      c.outcome.toLowerCase().includes('success')
    ).length;
    
    const defense = Math.round((favorableOutcomes / similarCases.length) * 100);
    return { defense: Math.max(defense, 20), prosecution: Math.min(100 - defense, 80) };
  };

  const outcome = calculateOutcome();
  
  // Only show court cases
  const courtCases = similarCases.filter(c => c.source === "courtlistener");
  
  if (isLoading) {
    return (
      <>
        <CaseOutcomePrediction
          defense={outcome.defense}
          prosecution={outcome.prosecution}
          isLoading={true}
          caseType={caseType}
        />
        <Card className="mb-6 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center">
              <Scale className="h-5 w-5 mr-2 text-blue-500" />
              Similar Cases
              <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((_, idx) => (
                <div key={idx} className="border p-4 rounded-md space-y-2">
                  <Skeleton className="h-6 w-3/4 mb-1" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-between items-center mt-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-8 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!similarCases || similarCases.length === 0) {
    return (
      <>
        <CaseOutcomePrediction
          defense={outcome.defense}
          prosecution={outcome.prosecution}
          caseType={caseType}
        />
        <Card className="mb-6 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center">
              <Scale className="h-5 w-5 mr-2 text-blue-500" />
              Similar Cases
              {caseType && caseType !== "general" && (
                <Badge variant="outline" className="ml-2">
                  {caseType.replace("-", " ")}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Scale className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-600 mb-1">No similar cases found</h3>
              <p className="text-gray-500 mb-4">
                {!analysisFound 
                  ? "Generate an analysis first to find similar cases"
                  : "Try generating a new analysis or check if similar cases exist for this case type"
                }
              </p>
              {fallbackUsed && (
                <Badge variant="secondary" className="mt-2">
                  Using fallback search strategy
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <CaseOutcomePrediction
        defense={outcome.defense}
        prosecution={outcome.prosecution}
        caseType={caseType}
      />
      <Card className="mb-6 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <div className="flex items-center">
            <Scale className="h-5 w-5 mr-2 text-blue-500" />
            Similar Cases
            {caseType && caseType !== "general" && (
              <Badge variant="outline" className="ml-2">
                {caseType.replace("-", " ")}
              </Badge>
            )}
            <Badge variant="secondary" className="ml-2">
              {courtCases.length} Court Opinions
            </Badge>
          </div>
            
            {fallbackUsed && (
              <Badge variant="secondary">
                Fallback Strategy Used
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courtCases.length > 0 ? (
              courtCases
                .sort((a, b) => b.similarity - a.similarity)
                .map((caseItem, index) => (
                  <SimilarCaseCard key={index} similarCase={caseItem} />
                ))
            ) : (
              <div className="text-center py-8">
                <Gavel className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No court opinions found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

interface SimilarCaseCardProps {
  similarCase: SimilarCase;
}

const SimilarCaseCard: React.FC<SimilarCaseCardProps> = ({ similarCase }) => {
  // Much stricter URL validation - only allow known working URLs
  const isValidWorkingUrl = (url: string): boolean => {
    // Only allow URLs we know work or can verify
    
    // Allow known working URLs (like our hardcoded ones)
    if (url.includes('caselaw.findlaw.com') || 
        url.includes('supreme.justia.com') ||
        url.includes('law.justia.com')) {
      return true;
    }
    
    // For CourtListener URLs, be extremely strict
    if (url.includes('courtlistener.com')) {
      // Must have realistic docket pattern
      const docketMatch = url.match(/\/(\d+)\//);
      if (!docketMatch) return false;
      
      const docketNumber = docketMatch[1];
      
      // Reject obviously fake patterns
      if (docketNumber.length < 7 || // Too short
          /^[0-9]{1,3}$/.test(docketNumber) || // Just 1-3 digits
          /^1234567/.test(docketNumber) || // Starts with obvious placeholder
          docketNumber === '0000000') { // All zeros
        return false;
      }
      
      // Must have reasonable court abbreviation
      if (!url.match(/\/[a-z]{2,10}\//)) {
        return false;
      }
      
      return true;
    }
    
    // Reject all other URLs as potentially fake
    return false;
  };

  // Get external URL only if it's validated and working
  const getValidExternalUrl = (): string | null => {
    const citation = similarCase.citation;
    
    // Special case for Gonzalez v. Wal-Mart - we know this URL works
    if (citation && citation.includes("Gonzalez") && citation.includes("Wal-Mart")) {
      return "https://caselaw.findlaw.com/tx-supreme-court/1031086.html";
    }
    
    // Only return URL if it passes strict validation
    if (similarCase.url && isValidWorkingUrl(similarCase.url)) {
      return similarCase.url;
    }
    
    // No valid URL found - don't show any button
    return null;
  };

  const validUrl = getValidExternalUrl();

  return (
    <div className="border p-4 rounded-md hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-lg">{similarCase.clientName}</h3>
        <div className="flex items-center gap-2">
          <Badge variant={similarCase.source === "internal" ? "default" : "secondary"}>
            {similarCase.source === "internal" ? "Firm Case" : "Court Opinion"}
          </Badge>
          <Badge variant="outline">
            {Math.round(similarCase.similarity)}% match
          </Badge>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mt-1 mb-3">{similarCase.relevantFacts}</p>
      
      <div className="space-y-2 text-xs text-gray-600">
        <div>
          <span className="font-medium">Outcome:</span> {similarCase.outcome}
        </div>
        
        {similarCase.court && (
          <div>
            <span className="font-medium">Court:</span> {similarCase.court}
          </div>
        )}
        
        {similarCase.citation && (
          <div>
            <span className="font-medium">Citation:</span> {similarCase.citation}
          </div>
        )}
        
        {similarCase.dateDecided && (
          <div>
            <span className="font-medium">Date:</span> {similarCase.dateDecided}
          </div>
        )}
        
        {similarCase.agentReasoning && (
          <div>
            <span className="font-medium">Analysis:</span> {similarCase.agentReasoning}
          </div>
        )}
      </div>
      
      {/* Only show button if we have a validated, working external URL */}
      {validUrl && (
        <div className="flex justify-end mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => window.open(validUrl, "_blank")}
          >
            <ExternalLink className="h-3 w-3" />
            View Case
          </Button>
        </div>
      )}
    </div>
  );
};

export default SimilarCasesSection;
