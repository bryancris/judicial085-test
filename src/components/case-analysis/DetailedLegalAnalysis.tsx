
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, BookOpen, CheckCircle2, Scale, HelpCircle } from "lucide-react";
import { processLawReferences } from "@/utils/lawReferences";
import RelevantLawSection from "./sections/RelevantLawSection";

interface DetailedLegalAnalysisProps {
  relevantLaw: string;
  preliminaryAnalysis: string;
  potentialIssues: string;
  followUpQuestions: string[];
  isLoading?: boolean;
}

const DetailedLegalAnalysis: React.FC<DetailedLegalAnalysisProps> = ({
  relevantLaw,
  preliminaryAnalysis,
  potentialIssues,
  followUpQuestions,
  isLoading = false
}) => {
  const [openSection, setOpenSection] = useState<string>("relevantLaw");
  const [processedLawSection, setProcessedLawSection] = useState<string>(relevantLaw);
  const [isProcessingLaw, setIsProcessingLaw] = useState<boolean>(false);
  
  // Process relevant law section to add links to Texas law references
  useEffect(() => {
    const processLawSection = async () => {
      if (relevantLaw) {
        setIsProcessingLaw(true);
        try {
          const processed = await processLawReferences(relevantLaw);
          setProcessedLawSection(processed);
        } catch (err) {
          console.error("Error processing law references:", err);
        } finally {
          setIsProcessingLaw(false);
        }
      }
    };
    
    processLawSection();
  }, [relevantLaw]);
  
  const handleToggle = (section: string) => {
    setOpenSection(openSection === section ? "" : section);
  };

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-[#0EA5E9]" />
          Detailed Legal Analysis
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
