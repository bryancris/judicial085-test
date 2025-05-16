
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, BookOpen, CheckCircle2, Scale, HelpCircle, FileText } from "lucide-react";
import { processLawReferences } from "@/utils/lawReferences";
import RelevantLawSection from "./sections/RelevantLawSection";
import { isConsumerProtectionStatute, enhanceConsumerProtectionAnalysis } from "@/utils/lawReferences/consumerProtectionUtils";

interface DetailedLegalAnalysisProps {
  relevantLaw: string;
  preliminaryAnalysis: string;
  potentialIssues: string;
  followUpQuestions: string[];
  remedies?: string;
  caseType?: string;
  isLoading?: boolean;
}

const DetailedLegalAnalysis: React.FC<DetailedLegalAnalysisProps> = ({
  relevantLaw,
  preliminaryAnalysis,
  potentialIssues,
  followUpQuestions,
  remedies,
  caseType,
  isLoading = false
}) => {
  const [openSection, setOpenSection] = useState<string>("relevantLaw");
  const [processedLawSection, setProcessedLawSection] = useState<string>(relevantLaw);
  const [isProcessingLaw, setIsProcessingLaw] = useState<boolean>(false);
  const isConsumerCase = caseType === "consumer-protection" || 
                        relevantLaw.toLowerCase().includes("deceptive trade practice") ||
                        relevantLaw.toLowerCase().includes("dtpa");
  
  // Process relevant law section to add links to Texas law references
  useEffect(() => {
    const processLawSection = async () => {
      if (relevantLaw) {
        setIsProcessingLaw(true);
        try {
          let processed = await processLawReferences(relevantLaw);
          
          // If this is a consumer protection case, enhance the content with additional context
          if (isConsumerCase) {
            processed = enhanceConsumerProtectionAnalysis(processed);
          }
          
          setProcessedLawSection(processed);
        } catch (err) {
          console.error("Error processing law references:", err);
        } finally {
          setIsProcessingLaw(false);
        }
      }
    };
    
    processLawSection();
  }, [relevantLaw, isConsumerCase]);
  
  const handleToggle = (section: string) => {
    setOpenSection(openSection === section ? "" : section);
  };

  // Extract potential remedies from the potentialIssues section for consumer cases
  const extractedRemedies = React.useMemo(() => {
    if (remedies) return remedies;
    
    if (isConsumerCase && potentialIssues) {
      // Look for remedies discussion in the potential issues section
      const remediesPattern = /(remedies|damages|relief|recovery|compensation).{10,200}/gi;
      const remediesMatches = potentialIssues.match(remediesPattern);
      
      if (remediesMatches && remediesMatches.length > 0) {
        return remediesMatches.join('\n\n');
      }
    }
    
    return null;
  }, [isConsumerCase, potentialIssues, remedies]);

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-[#0EA5E9]" />
          Detailed Legal Analysis
          {isConsumerCase && (
            <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 rounded-full">
              Consumer Protection
            </span>
          )}
          {isLoading && (
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RelevantLawSection
          content={relevantLaw}
          isOpen={openSection === "relevantLaw"}
          isProcessing={isProcessingLaw}
          onToggle={() => handleToggle("relevantLaw")}
          processedContent={processedLawSection}
          isConsumerCase={isConsumerCase}
        />
        
        <div className="border rounded-md">
          <button
            className="flex w-full justify-between p-4 font-semibold"
            onClick={() => handleToggle("preliminaryAnalysis")}
          >
            <span className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 text-[#0EA5E9]" />
              Preliminary Analysis
            </span>
            <span>{openSection === "preliminaryAnalysis" ? "−" : "+"}</span>
          </button>
          {openSection === "preliminaryAnalysis" && (
            <div className="px-4 pb-4">
              <div className="whitespace-pre-line">{preliminaryAnalysis}</div>
            </div>
          )}
        </div>
        
        <div className="border rounded-md">
          <button
            className="flex w-full justify-between p-4 font-semibold"
            onClick={() => handleToggle("potentialIssues")}
          >
            <span className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-[#0EA5E9]" />
              Potential Legal Issues
            </span>
            <span>{openSection === "potentialIssues" ? "−" : "+"}</span>
          </button>
          {openSection === "potentialIssues" && (
            <div className="px-4 pb-4">
              <div className="whitespace-pre-line">{potentialIssues}</div>
            </div>
          )}
        </div>
        
        {extractedRemedies && (
          <div className="border rounded-md">
            <button
              className="flex w-full justify-between p-4 font-semibold"
              onClick={() => handleToggle("remedies")}
            >
              <span className="flex items-center">
                <Scale className="h-4 w-4 mr-2 text-[#0EA5E9]" />
                Available Remedies
              </span>
              <span>{openSection === "remedies" ? "−" : "+"}</span>
            </button>
            {openSection === "remedies" && (
              <div className="px-4 pb-4">
                <div className="whitespace-pre-line">{extractedRemedies}</div>
                {isConsumerCase && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md text-sm">
                    <p className="font-medium mb-1">DTPA Damages Overview:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Economic damages under § 17.50(b)(1)</li>
                      <li>Treble damages for knowing violations (up to 3x economic damages)</li>
                      <li>Mental anguish damages if violations were committed knowingly</li>
                      <li>Court costs and reasonable attorney's fees</li>
                      <li>Potential for injunctive relief</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="border rounded-md">
          <button
            className="flex w-full justify-between p-4 font-semibold"
            onClick={() => handleToggle("followUpQuestions")}
          >
            <span className="flex items-center">
              <HelpCircle className="h-4 w-4 mr-2 text-[#0EA5E9]" />
              Recommended Follow-Up Questions
            </span>
            <span>{openSection === "followUpQuestions" ? "−" : "+"}</span>
          </button>
          {openSection === "followUpQuestions" && (
            <div className="px-4 pb-4">
              <ol className="list-decimal list-outside ml-5 space-y-2">
                {followUpQuestions.map((question, index) => (
                  <li key={index} className="pl-1">{question}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DetailedLegalAnalysis;
