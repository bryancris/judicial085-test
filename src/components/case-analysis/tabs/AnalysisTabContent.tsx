
import React from "react";
import { CaseAnalysisData } from "@/types/caseAnalysis";
import DetailedLegalAnalysis from "../DetailedLegalAnalysis";
import CaseStrengthsWeaknesses from "../CaseStrengthsWeaknesses";
import SearchSimilarCasesSection from "../SearchSimilarCasesSection";
import LawReferencesSection from "../LawReferencesSection";
import ClientDocumentsSection from "../documents/ClientDocumentsSection";
import { ScholarlyArticle } from "@/utils/api/scholarApiService";

interface AnalysisTabContentProps {
  analysisData: CaseAnalysisData;
  isLoading: boolean;
  clientId: string;
  scholarlyReferences: ScholarlyArticle[];
  isScholarlyReferencesLoading: boolean;
  onScholarSearch: (query: string) => void;
  clientDocuments: any[];
  documentsLoading: boolean;
  processDocument: (file: File) => Promise<void>;
  isProcessingDocument: boolean;
}

const AnalysisTabContent: React.FC<AnalysisTabContentProps> = ({
  analysisData,
  isLoading,
  clientId,
  scholarlyReferences,
  isScholarlyReferencesLoading,
  onScholarSearch,
  clientDocuments,
  documentsLoading,
  processDocument,
  isProcessingDocument
}) => {
  return (
    <div className="space-y-8">
      {/* Law References Section */}
      {analysisData.lawReferences && analysisData.lawReferences.length > 0 && (
        <LawReferencesSection
          references={analysisData.lawReferences}
          isLoading={isLoading}
          caseType={analysisData.caseType}
        />
      )}

      {/* Strengths and Weaknesses */}
      <CaseStrengthsWeaknesses
        strengths={analysisData.strengths}
        weaknesses={analysisData.weaknesses}
        isLoading={isLoading}
        caseType={analysisData.caseType}
      />

      {/* Similar Cases with integrated Outcome Prediction */}
      <SearchSimilarCasesSection clientId={clientId} caseType={analysisData.caseType} />

      {/* Detailed Legal Analysis */}
      <DetailedLegalAnalysis
        relevantLaw={analysisData.legalAnalysis.relevantLaw}
        preliminaryAnalysis={analysisData.legalAnalysis.preliminaryAnalysis}
        potentialIssues={analysisData.legalAnalysis.potentialIssues}
        followUpQuestions={analysisData.legalAnalysis.followUpQuestions}
        isLoading={isLoading}
        remedies={analysisData.remedies}
        caseType={analysisData.caseType}
        scholarlyReferences={scholarlyReferences}
        isScholarlyReferencesLoading={isScholarlyReferencesLoading}
        onScholarSearch={onScholarSearch}
      />
      
      {/* Client Documents Section - At the bottom */}
      <ClientDocumentsSection
        clientId={clientId}
        documents={clientDocuments}
        isLoading={documentsLoading}
        onProcessDocument={processDocument}
        isProcessing={isProcessingDocument}
      />
    </div>
  );
};

export default AnalysisTabContent;
