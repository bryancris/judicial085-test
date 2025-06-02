
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import AnalysisItem from "@/components/clients/chat/AnalysisItem";
import RemediesSection from "./RemediesSection";

interface DetailedLegalAnalysisProps {
  relevantLaw: string;
  preliminaryAnalysis: string;
  potentialIssues: string;
  followUpQuestions: string[];
  isLoading?: boolean;
  remedies?: string;
  caseType?: string;
  rawContent?: string; // Add raw content prop
}

const DetailedLegalAnalysis: React.FC<DetailedLegalAnalysisProps> = ({
  relevantLaw,
  preliminaryAnalysis,
  potentialIssues,
  followUpQuestions,
  isLoading = false,
  remedies,
  caseType,
  rawContent
}) => {
  // If we have raw content, use it directly like Client Intake does
  if (rawContent) {
    return (
      <div className="space-y-6">
        {/* Render the remedies section if it exists */}
        {remedies && remedies.trim() !== "" && (
          <RemediesSection 
            remedies={remedies}
            isLoading={isLoading}
            caseType={caseType}
          />
        )}
        
        <Card className="mb-6 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center">
              <ScrollText className="h-5 w-5 mr-2 text-blue-500" />
              Detailed Legal Analysis
              {isLoading && (
                <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
              )}
              {caseType && caseType !== "general" && (
                <span className="ml-2 text-xs font-medium bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-200">
                  {caseType === "consumer-protection" ? "Consumer Protection" : caseType}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Use the same AnalysisItem component that Client Intake uses */}
            <AnalysisItem 
              content={rawContent}
              timestamp={new Date().toISOString()}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback to legacy parsed content if no raw content (shouldn't happen now)
  const hasContent = relevantLaw || preliminaryAnalysis || potentialIssues || followUpQuestions?.length > 0;
  
  if (!hasContent && !isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No detailed analysis available. Please generate an analysis first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="mb-6 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold flex items-center">
            <ScrollText className="h-5 w-5 mr-2 text-blue-500" />
            Detailed Legal Analysis (Legacy View)
            {isLoading && (
              <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Raw content not available. This is the legacy parsed view.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedLegalAnalysis;
