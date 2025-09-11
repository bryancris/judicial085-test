
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";


interface EmptyAnalysisStateProps {
  clientName: string;
  clientId: string;
  caseId?: string;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onLoadExisting?: () => void;
}

const EmptyAnalysisState: React.FC<EmptyAnalysisStateProps> = ({
  clientName,
  clientId,
  caseId,
  selectedTab,
  setSelectedTab,
  isGenerating,
  onGenerate,
  onLoadExisting,
}) => {
  const [hasDocuments, setHasDocuments] = useState(false);
  const [hasConversation, setHasConversation] = useState(false);
  const [hasExistingAnalysis, setHasExistingAnalysis] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAvailableContent = async () => {
      setIsChecking(true);
      
      try {
        // Check for existing analysis first
        let analysisQuery = supabase
          .from("legal_analyses")
          .select("id")
          .eq("client_id", clientId);
        
        if (caseId) {
          analysisQuery = analysisQuery.eq("case_id", caseId);
        }
        
        const { data: existingAnalysis } = await analysisQuery.limit(1);
        const hasAnalysis = existingAnalysis && existingAnalysis.length > 0;
        setHasExistingAnalysis(hasAnalysis);
        
        // If we have existing analysis, load it instead of showing generate button
        if (hasAnalysis && onLoadExisting) {
          console.log("🔄 Found existing analysis, loading...");
          onLoadExisting();
          return;
        }
        
        // Check for client messages
        const { data: messages } = await supabase
          .from("client_messages")
          .select("id")
          .eq("client_id", clientId)
          .limit(1);
        
        setHasConversation(messages && messages.length > 0);
        
        // Check for documents marked for analysis
        let documentsQuery = supabase
          .from("document_metadata")
          .select("id")
          .eq("client_id", clientId)
          .eq("include_in_analysis", true);
        
        if (caseId) {
          documentsQuery = documentsQuery.eq("case_id", caseId);
        }
        
        const { data: documents } = await documentsQuery.limit(1);
        
        setHasDocuments(documents && documents.length > 0);
      } catch (error) {
        console.error("Error checking available content:", error);
      } finally {
        setIsChecking(false);
      }
    };

    if (clientId) {
      checkAvailableContent();
    }
  }, [clientId, caseId, onLoadExisting]);

  const getDescription = () => {
    if (isChecking) {
      return "Checking for existing analysis...";
    }
    
    if (hasExistingAnalysis) {
      return "Loading existing analysis...";
    }
    
    if (hasConversation || hasDocuments) {
      const sources = [];
      if (hasConversation) sources.push("client conversation");
      if (hasDocuments) sources.push("uploaded documents");
      
      return `Generate analysis from ${sources.join(" and ")} to get started.`;
    }
    
    return "Upload documents and mark them for analysis, or start a client conversation to generate case analysis.";
  };

  const getActionText = () => {
    if (hasConversation || hasDocuments) {
      return "Generate Analysis";
    }
    return "Upload Documents First";
  };

  return (
    <div className="container mx-auto py-8">

      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">No Analysis Available</h2>
        <p className="text-gray-600 mb-6">
          {getDescription()}
        </p>
        
        {(hasConversation || hasDocuments) && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="bg-brand-burgundy text-white px-4 py-2 rounded-md flex items-center gap-2 mx-auto"
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              <>{getActionText()}</>
            )}
          </button>
        )}
        
        {!hasConversation && !hasDocuments && !isChecking && (
          <div className="mt-4 text-sm text-gray-500">
            <p>To generate analysis, you need either:</p>
            <ul className="mt-2 space-y-1">
              <li>• Client conversation messages from the intake chat</li>
              <li>• Documents uploaded and marked for inclusion in analysis</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyAnalysisState;
