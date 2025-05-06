
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  processLawReferences, 
  processLawReferencesSync, 
  extractCitations, 
  searchLawDocuments 
} from "@/utils/lawReferenceUtils";

import AnalysisSearch from "./AnalysisSearch";
import RelevantLawSection from "./sections/RelevantLawSection";
import AnalysisSection from "./sections/AnalysisSection";
import FollowUpQuestionsSection from "./sections/FollowUpQuestionsSection";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState({
    relevantLaw: true,
    preliminaryAnalysis: true,
    potentialIssues: true,
    followUpQuestions: true
  });
  const [processedRelevantLaw, setProcessedRelevantLaw] = useState("");
  const [isProcessingLawRefs, setIsProcessingLawRefs] = useState(true);
  const [lawCitations, setLawCitations] = useState<string[]>([]);

  // Process the relevant law section to add links
  useEffect(() => {
    // Extract citations for future use
    const citations = extractCitations(relevantLaw);
    setLawCitations(citations);
    
    // Start with a synchronous version for immediate display
    const initialProcessed = processLawReferencesSync(relevantLaw);
    setProcessedRelevantLaw(initialProcessed);
    
    // Then process asynchronously to get direct URLs
    const processAsync = async () => {
      setIsProcessingLawRefs(true);
      try {
        const fullyProcessed = await processLawReferences(relevantLaw);
        setProcessedRelevantLaw(fullyProcessed);
      } catch (error) {
        console.error("Error processing law references:", error);
      } finally {
        setIsProcessingLawRefs(false);
      }
    };
    
    processAsync();
  }, [relevantLaw]);
  
  // Preemptively fetch some citations data when available
  useEffect(() => {
    const preloadCitations = async () => {
      if (lawCitations.length > 0) {
        // Take first 2 citations to avoid overloading
        const sampleCitations = lawCitations.slice(0, 2);
        
        for (const citation of sampleCitations) {
          // Fetch in background, this is just to warm up the cache
          await searchLawDocuments(citation);
        }
      }
    };
    
    preloadCitations();
  }, [lawCitations]);

  const handleToggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold flex items-center">
            Detailed Legal Analysis
            {isLoading && (
              <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            )}
          </CardTitle>
          <AnalysisSearch 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Relevant Law Section */}
        <RelevantLawSection 
          content={relevantLaw}
          isOpen={openSections.relevantLaw}
          isProcessing={isProcessingLawRefs}
          onToggle={() => handleToggleSection('relevantLaw')}
          processedContent={processedRelevantLaw}
        />

        {/* Preliminary Analysis Section */}
        <AnalysisSection 
          title="Preliminary Analysis"
          content={preliminaryAnalysis}
          isOpen={openSections.preliminaryAnalysis}
          searchTerm={searchTerm}
          onToggle={() => handleToggleSection('preliminaryAnalysis')}
        />

        {/* Potential Issues Section */}
        <AnalysisSection 
          title="Potential Legal Issues"
          content={potentialIssues}
          isOpen={openSections.potentialIssues}
          searchTerm={searchTerm}
          onToggle={() => handleToggleSection('potentialIssues')}
        />

        {/* Follow-up Questions Section */}
        <FollowUpQuestionsSection 
          questions={followUpQuestions}
          isOpen={openSections.followUpQuestions}
          searchTerm={searchTerm}
          onToggle={() => handleToggleSection('followUpQuestions')}
        />
      </CardContent>
    </Card>
  );
};

export default DetailedLegalAnalysis;
