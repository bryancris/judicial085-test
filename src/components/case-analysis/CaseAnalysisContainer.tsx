
import React, { useState } from "react";
import CaseAnalysisErrorState from "./CaseAnalysisErrorState";
import CaseAnalysisLoadingSkeleton from "./CaseAnalysisLoadingSkeleton";
import CaseAnalysisHeader from "./CaseAnalysisHeader";
import { useScholarlyReferences } from "@/hooks/useScholarlyReferences";
import { useCaseAnalysisChat } from "@/hooks/useCaseAnalysisChat";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import EmptyAnalysisState from "./EmptyAnalysisState";
import TabsContainer from "./tabs/TabsContainer";
import { AnalysisData } from "@/hooks/useAnalysisData";
import { useCase } from "@/contexts/CaseContext";
import { useClientChatAnalysis } from "@/hooks/useClientChatAnalysis";
import { useState as useAnalysisState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CaseAnalysisContainerProps {
  clientId: string;
  clientName: string;
  caseId?: string;
}

const CaseAnalysisContainer: React.FC<CaseAnalysisContainerProps> = ({
  clientId,
  clientName,
  caseId: propCaseId,
}) => {
  const [selectedTab, setSelectedTab] = useState("analysis");
  const [legalAnalysis, setLegalAnalysis] = useAnalysisState<any[]>([]);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { currentCase } = useCase();
  const { toast } = useToast();
  
  // Use caseId from props or from context
  const caseId = propCaseId || currentCase?.id;

  // Use the same analysis system as Client Intake with document-only capability
  const { generateAnalysis } = useClientChatAnalysis(clientId, setLegalAnalysis);
    
  // Add scholarly references hook
  const {
    references: scholarlyReferences,
    isLoading: isScholarlyReferencesLoading,
    searchReferences
  } = useScholarlyReferences(clientId, "general");
  
  // Get conversation and notes for the respective tabs
  const {
    conversation,
    notes, 
    loading: conversationLoading,
    isLoading: notesLoading
  } = useCaseAnalysisChat(clientId);

  // Client documents hook - still needed for the documents tab
  const {
    documents: clientDocuments,
    loading: documentsLoading,
    processDocument: processDocumentContent,
    isProcessing: isProcessingDocument
  } = useClientDocuments(clientId);

  // Create a wrapper function to adapt processDocumentContent to expect a File
  const processDocument = async (title: string, content: string, metadata: any = {}): Promise<any> => {
    try {
      return await processDocumentContent(title, content, metadata);
    } catch (error) {
      console.error("Error processing document content:", error);
    }
  };

  // Generate analysis using the same system as Client Intake but allow document-only analysis
  const generateRealTimeAnalysis = async () => {
    setIsAnalysisLoading(true);
    setAnalysisError(null);

    try {
      // Fetch the client messages for this client
      const { data: messages, error: messagesError } = await supabase
        .from("client_messages")
        .select("content, role, timestamp")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      
      // Check if we have a conversation or should use documents
      const hasConversation = messages && messages.length > 0;
      
      if (!hasConversation) {
        // Check for documents marked for analysis
        const documentsQuery = supabase
          .from("document_metadata")
          .select("id, title, include_in_analysis")
          .eq("client_id", clientId)
          .eq("include_in_analysis", true);
        
        // If we have a specific case, filter by case_id, otherwise get all client documents
        if (caseId) {
          documentsQuery.eq("case_id", caseId);
        }
        
        const { data: documents, error: documentsError } = await documentsQuery;
        
        if (documentsError) throw documentsError;
        
        if (!documents || documents.length === 0) {
          throw new Error("No client conversation or documents marked for analysis found. Please either start a conversation with the client or upload documents and mark them for inclusion in analysis.");
        }
      }
      
      // Format messages for the analysis (empty array if no conversation)
      const formattedMessages = hasConversation ? messages.map(msg => ({
        content: msg.content,
        role: msg.role as "attorney" | "client",
        timestamp: msg.timestamp
      })) : [];
      
      // Use the same analysis generation as Client Intake but allow document-only analysis
      await generateAnalysis(formattedMessages, true); // true = allow document-only analysis
      
      toast({
        title: "Analysis Generated",
        description: "Real-time case analysis generated successfully.",
      });
    } catch (err: any) {
      console.error("Error generating real-time analysis:", err);
      setAnalysisError(err.message || "Failed to generate analysis");
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate real-time analysis.",
        variant: "destructive",
      });
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // Convert the analysis from Client Intake format to Case Analysis format
  const convertToAnalysisData = (analysisItems: any[]): AnalysisData | null => {
    if (!analysisItems || analysisItems.length === 0) return null;
    
    const latestAnalysis = analysisItems[analysisItems.length - 1];
    const content = latestAnalysis.content || "";
    
    // Parse the analysis content (same logic as useAnalysisData)
    const sections = content.split(/(\*\*.*?:\*\*)/).filter(Boolean);
    const data: any = {};
    let currentSection = null;

    for (const section of sections) {
      if (section.startsWith("**") && section.endsWith("**")) {
        currentSection = section.slice(2, -2).replace(/:$/, '').trim();
        data[currentSection] = "";
      } else if (currentSection) {
        data[currentSection] = section.trim();
        currentSection = null;
      }
    }

    const parseFollowUpQuestions = (questions: string): string[] => {
      const questionList = questions.split(/\n\d+\.\s/).filter(Boolean);
      return questionList.map(q => q.trim());
    };

    return {
      legalAnalysis: {
        relevantLaw: data["RELEVANT TEXAS LAW"] || "",
        preliminaryAnalysis: data["PRELIMINARY ANALYSIS"] || "",
        potentialIssues: data["POTENTIAL LEGAL ISSUES"] || "",
        followUpQuestions: parseFollowUpQuestions(data["RECOMMENDED FOLLOW-UP QUESTIONS"] || ""),
      },
      strengths: [],
      weaknesses: [],
      conversationSummary: "",
      outcome: {
        defense: 0.5,
        prosecution: 0.5,
      },
      remedies: data["REMEDIES"] || "",
      timestamp: latestAnalysis.timestamp || new Date().toISOString(),
      lawReferences: latestAnalysis.lawReferences || [], // Use the actual law references from the analysis
      caseType: content.includes("Animal") || content.includes("Cruelty") ? "animal-protection" : 
                content.includes("Consumer Protection") || content.includes("Deceptive Trade Practices") ? "consumer-protection" : "general"
    };
  };

  // Get the current analysis data
  const analysisData = convertToAnalysisData(legalAnalysis);

  // Handle error state
  if (analysisError) {
    return <CaseAnalysisErrorState error={analysisError} onRefresh={generateRealTimeAnalysis} />;
  }

  // Handle loading state
  if (isAnalysisLoading && !analysisData) {
    return <CaseAnalysisLoadingSkeleton />;
  }

  // Handle case where there is no analysis data yet
  if (!analysisData) {
    return (
      <EmptyAnalysisState 
        clientName={clientName}
        clientId={clientId}
        caseId={caseId}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        isGenerating={isAnalysisLoading}
        onGenerate={generateRealTimeAnalysis}
      />
    );
  }
  
  // Handle the search for scholarly references
  const handleScholarSearch = (query: string) => {
    if (query) {
      searchReferences(query);
    }
  };

  const title = caseId && currentCase 
    ? `${clientName} - ${currentCase.case_title} Analysis`
    : `${clientName} - Case Analysis`;

  return (
    <div className="container mx-auto py-8">
      <CaseAnalysisHeader
        title={title}
        clientId={clientId}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        isGenerating={isAnalysisLoading}
        onGenerate={generateRealTimeAnalysis}
        caseType={analysisData?.caseType}
      />

      {/* Main content area with tabs */}
      <TabsContainer 
        selectedTab={selectedTab}
        analysisData={analysisData}
        isLoading={isAnalysisLoading}
        clientId={clientId}
        conversation={conversation}
        conversationLoading={conversationLoading}
        notes={notes}
        notesLoading={notesLoading}
        clientDocuments={clientDocuments}
        documentsLoading={documentsLoading}
        processDocument={processDocument}
        isProcessingDocument={isProcessingDocument}
        scholarlyReferences={scholarlyReferences}
        isScholarlyReferencesLoading={isScholarlyReferencesLoading}
        onScholarSearch={handleScholarSearch}
      />
    </div>
  );
};

export default CaseAnalysisContainer;
