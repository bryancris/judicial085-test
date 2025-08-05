
import React, { useState, useCallback } from "react";
import { TabsContent } from "@/components/ui/tabs";
import ClientIntakeChat from "@/components/clients/chat/ClientIntakeChat";

import CaseDiscussionContainer from "@/components/case-discussion/CaseDiscussionContainer";
import DiscoveryTabContent from "./DiscoveryTabContent";
import ContractsTabContent from "./ContractsTabContent";
import DocumentsTabContent from "./DocumentsTabContent";
import KnowledgeTabContent from "./KnowledgeTabContent";
import { TemplatesTabContent } from "./TemplatesTabContent";
import { Client } from "@/types/client";
import { useCase } from "@/contexts/CaseContext";
import { useCaseAnalysis } from "@/hooks/useCaseAnalysis";
import { useScholarlyReferencesData } from "@/components/case-analysis/hooks/useScholarlyReferencesData";
import { loadSimilarCases } from "@/utils/api/similarCasesApiService";
import { searchSimilarCases } from "@/utils/api/analysisApiService";
import EmptyAnalysisState from "@/components/case-analysis/EmptyAnalysisState";
import CaseAnalysisLoadingSkeleton from "@/components/case-analysis/CaseAnalysisLoadingSkeleton";
import CaseAnalysisErrorState from "@/components/case-analysis/CaseAnalysisErrorState";
import CaseAnalysisHeader from "@/components/case-analysis/CaseAnalysisHeader";
import TabsContainer from "@/components/case-analysis/tabs/TabsContainer";
import { SimilarCase } from "@/components/case-analysis/SimilarCasesSection";
import { supabase } from "@/integrations/supabase/client";

interface ClientDetailTabContentProps {
  client: Client;
  activeTab: string;
}

const ClientDetailTabContent: React.FC<ClientDetailTabContentProps> = ({ 
  client, 
  activeTab 
}) => {
  const { currentCase } = useCase();
  const [analysisRefreshTrigger, setAnalysisRefreshTrigger] = useState(0);
  const [analysisTab, setAnalysisTab] = useState("analysis");
  
  // Use case analysis hook
  const {
    analysisData,
    isLoading: isAnalysisLoading,
    error: analysisError,
    generateNewAnalysis
  } = useCaseAnalysis(client.id, currentCase?.id);

  // Scholarly references hook with database persistence
  const {
    scholarlyReferences,
    isScholarlyReferencesLoading,
    handleScholarSearch: onScholarSearch,
    fetchScholarlyReferences: onScholarRefresh
  } = useScholarlyReferencesData(client.id);

  // Similar cases state
  const [similarCases, setSimilarCases] = useState<SimilarCase[]>([]);
  const [isSimilarCasesLoading, setIsSimilarCasesLoading] = useState(false);
  const [analysisFound, setAnalysisFound] = useState(true);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | undefined>();

  // Conversation and notes state
  const [conversation, setConversation] = useState<any[]>([]);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  // Get the legal analysis ID from database
  React.useEffect(() => {
    const getCurrentAnalysisId = async () => {
      if (!analysisData) return;
      
      try {
        let query = supabase
          .from("legal_analyses")
          .select("id")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false });

        if (currentCase?.id) {
          query = query.eq("case_id", currentCase.id);
        }

        const { data, error } = await query.limit(1);
        if (error) throw error;
        
        if (data && data.length > 0) {
          setCurrentAnalysisId(data[0].id);
        }
      } catch (error) {
        console.error("Error getting analysis ID:", error);
      }
    };

    getCurrentAnalysisId();
  }, [analysisData, client.id, currentCase?.id]);

  // Load similar cases when analysis ID is available
  React.useEffect(() => {
    const loadSimilarCasesData = async () => {
      if (!currentAnalysisId) return;
      
      setIsSimilarCasesLoading(true);
      try {
        const result = await loadSimilarCases(client.id, currentAnalysisId);
        setSimilarCases(result.similarCases || []);
        setAnalysisFound(result.metadata?.analysisFound !== false);
        setFallbackUsed(result.metadata?.fallbackUsed || false);
      } catch (error) {
        console.error("Error loading similar cases:", error);
        setSimilarCases([]);
      } finally {
        setIsSimilarCasesLoading(false);
      }
    };

    loadSimilarCasesData();
  }, [currentAnalysisId, client.id]);

  // Fetch scholarly references when analysis ID is available
  React.useEffect(() => {
    if (currentAnalysisId && analysisData?.caseType) {
      onScholarRefresh(analysisData.caseType, currentAnalysisId);
    }
  }, [currentAnalysisId, analysisData?.caseType, onScholarRefresh]);

  // Load conversation data
  React.useEffect(() => {
    const loadConversation = async () => {
      setConversationLoading(true);
      try {
        let query = supabase
          .from("client_messages")
          .select("*")
          .eq("client_id", client.id)
          .order("created_at", { ascending: true });

        if (currentCase?.id) {
          query = query.eq("case_id", currentCase.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        setConversation(data || []);
      } catch (error) {
        console.error("Error loading conversation:", error);
        setConversation([]);
      } finally {
        setConversationLoading(false);
      }
    };

    loadConversation();
  }, [client.id, currentCase?.id]);

  // Load notes data
  React.useEffect(() => {
    const loadNotes = async () => {
      setNotesLoading(true);
      try {
        const { data, error } = await supabase
          .from("case_analysis_notes")
          .select("*")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setNotes(data || []);
      } catch (error) {
        console.error("Error loading notes:", error);
        setNotes([]);
      } finally {
        setNotesLoading(false);
      }
    };

    loadNotes();
  }, [client.id]);
  
  // Callback to trigger analysis refresh when findings are added
  const handleAnalysisRefresh = useCallback(() => {
    setAnalysisRefreshTrigger(prev => prev + 1);
    console.log("Analysis refresh triggered from case discussion");
  }, []);
  
  return (
    <>
      <TabsContent value="client-intake" className="mt-6">
        <ClientIntakeChat 
          clientId={client.id} 
          clientName={`${client.first_name} ${client.last_name}`}
        />
      </TabsContent>

      <TabsContent value="case-analysis" className="mt-6">
        {isAnalysisLoading ? (
          <CaseAnalysisLoadingSkeleton />
        ) : analysisError ? (
          <CaseAnalysisErrorState 
            error={analysisError} 
            onRefresh={generateNewAnalysis}
          />
        ) : !analysisData ? (
          <EmptyAnalysisState 
            clientName={`${client.first_name} ${client.last_name}`}
            clientId={client.id}
            caseId={currentCase?.id}
            selectedTab={analysisTab}
            setSelectedTab={setAnalysisTab}
            isGenerating={isAnalysisLoading}
            onGenerate={generateNewAnalysis}
          />
        ) : (
          <div className="container mx-auto py-8">
            <CaseAnalysisHeader
              title={`${client.first_name} ${client.last_name} - Case Analysis`}
              clientId={client.id}
              selectedTab={analysisTab}
              setSelectedTab={setAnalysisTab}
              isGenerating={isAnalysisLoading}
              onGenerate={generateNewAnalysis}
              caseType={analysisData?.caseType}
            />
            
            <TabsContainer
              selectedTab={analysisTab}
              analysisData={analysisData}
              isLoading={isAnalysisLoading}
              clientId={client.id}
              caseId={currentCase?.id}
              currentAnalysisId={currentAnalysisId}
              conversation={conversation}
              conversationLoading={conversationLoading}
              notes={notes}
              notesLoading={notesLoading}
              scholarlyReferences={scholarlyReferences}
              isScholarlyReferencesLoading={isScholarlyReferencesLoading}
              onScholarSearch={onScholarSearch}
              onScholarRefresh={onScholarRefresh}
              similarCases={similarCases}
              isSimilarCasesLoading={isSimilarCasesLoading}
              analysisFound={analysisFound}
              fallbackUsed={fallbackUsed}
            />
          </div>
        )}
      </TabsContent>

      <TabsContent value="case-discussion" className="mt-6">
        <CaseDiscussionContainer 
          clientId={client.id}
          clientName={`${client.first_name} ${client.last_name}`}
          onFindingsAdded={handleAnalysisRefresh}
        />
      </TabsContent>

      <TabsContent value="contracts" className="mt-6">
        <ContractsTabContent clientId={client.id} />
      </TabsContent>

      <TabsContent value="discovery" className="mt-6">
        <DiscoveryTabContent clientId={client.id} />
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        <DocumentsTabContent clientId={client.id} />
      </TabsContent>

      <TabsContent value="knowledge" className="mt-6">
        <KnowledgeTabContent clientId={client.id} />
      </TabsContent>

      <TabsContent value="templates" className="mt-6">
        <TemplatesTabContent />
      </TabsContent>
    </>
  );
};

export default ClientDetailTabContent;
