
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import FollowUpQuestionsSection from "./sections/FollowUpQuestionsSection";
import RelevantLawSection from "./sections/RelevantLawSection";
import AnalysisSection from "./sections/AnalysisSection";
import RemediesSection from "./RemediesSection";

interface DetailedLegalAnalysisProps {
  relevantLaw: string;
  preliminaryAnalysis: string;
  potentialIssues: string;
  followUpQuestions: string[];
  isLoading?: boolean;
  remedies?: string;
  caseType?: string;
}

const DetailedLegalAnalysis: React.FC<DetailedLegalAnalysisProps> = ({
  relevantLaw,
  preliminaryAnalysis,
  potentialIssues,
  followUpQuestions,
  isLoading = false,
  remedies,
  caseType
}) => {
  // Check if we have minimal content to display
  const hasContent = relevantLaw || preliminaryAnalysis || potentialIssues || followUpQuestions?.length > 0;
  
  if (!hasContent && !isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No detailed analysis available. Please generate an analysis first.</p>
      </div>
    );
  }

  // We'll render the remedies section separately if it exists
  const hasRemedies = remedies && remedies.trim() !== "";
  
  // Add state for collapsible sections
  const [isRelevantLawOpen, setIsRelevantLawOpen] = useState(true);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(true);
  
  // For this implementation, we'll use a simplified version of the processed content
  const processedContent = relevantLaw;
  const isConsumerCase = caseType === "consumer-protection";

  return (
    <div className="space-y-6">
      {/* Render the remedies section if it exists */}
      {hasRemedies && (
        <RemediesSection 
          remedies={remedies!}
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
          <div className="space-y-6">
            {relevantLaw && (
              <>
                <RelevantLawSection 
                  content={relevantLaw}
                  isOpen={isRelevantLawOpen}
                  isProcessing={isLoading}
                  onToggle={() => setIsRelevantLawOpen(!isRelevantLawOpen)}
                  processedContent={processedContent}
                  isConsumerCase={isConsumerCase}
                />
                <Separator className="my-4" />
              </>
            )}
            
            {preliminaryAnalysis && (
              <>
                <AnalysisSection 
                  title="Preliminary Analysis" 
                  content={preliminaryAnalysis}
                />
                <Separator className="my-4" />
              </>
            )}
            
            {potentialIssues && (
              <>
                <AnalysisSection 
                  title="Potential Legal Issues" 
                  content={potentialIssues}
                  variant={caseType === "consumer-protection" ? "consumer" : "standard"}
                />
                <Separator className="my-4" />
              </>
            )}
            
            {followUpQuestions && followUpQuestions.length > 0 && (
              <FollowUpQuestionsSection 
                questions={followUpQuestions}
                isOpen={isFollowUpOpen}
                searchTerm=""
                onToggle={() => setIsFollowUpOpen(!isFollowUpOpen)}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedLegalAnalysis;
