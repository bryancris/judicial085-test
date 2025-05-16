
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import FollowUpQuestionsSection from "./sections/FollowUpQuestionsSection";
import RelevantLawSection from "./sections/RelevantLawSection";
import AnalysisSection from "./sections/AnalysisSection";
import RemediesSection from "./RemediesSection"; // Import the new component

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
  // We'll render the remedies section separately if it exists
  const hasRemedies = remedies && remedies.trim() !== "";

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
            <RelevantLawSection content={relevantLaw} />
            
            <Separator className="my-4" />
            
            <AnalysisSection 
              title="Preliminary Analysis" 
              content={preliminaryAnalysis}
            />
            
            <Separator className="my-4" />
            
            <AnalysisSection 
              title="Potential Legal Issues" 
              content={potentialIssues}
              variant={caseType === "consumer-protection" ? "consumer" : "standard"}
            />
            
            <Separator className="my-4" />
            
            <FollowUpQuestionsSection questions={followUpQuestions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedLegalAnalysis;
