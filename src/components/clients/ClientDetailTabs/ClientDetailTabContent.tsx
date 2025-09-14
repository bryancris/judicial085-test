
import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Layout } from "lucide-react";
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
import EmptyAnalysisState from "@/components/case-analysis/EmptyAnalysisState";
import CaseAnalysisLoadingSkeleton from "@/components/case-analysis/CaseAnalysisLoadingSkeleton";
import CaseAnalysisErrorState from "@/components/case-analysis/CaseAnalysisErrorState";
import CaseAnalysisHeader from "@/components/case-analysis/CaseAnalysisHeader";
import TabsContainer from "@/components/case-analysis/tabs/TabsContainer";
import PIAnalysisContent from "@/components/personal-injury/PIAnalysisContent";
import { supabase } from "@/integrations/supabase/client";
import { useCaseStrengthAnalysis } from "@/hooks/useCaseStrengthAnalysis";


interface ClientDetailTabContentProps {
  client: Client;
  activeTab: string;
}

const ClientDetailTabContent: React.FC<ClientDetailTabContentProps> = ({
  client,
  activeTab,
}) => {
  const { currentCase } = useCase();
  const [analysisRefreshTrigger, setAnalysisRefreshTrigger] = useState(0);
  const [analysisTab, setAnalysisTab] = useState("analysis");
  
  // Use case strength analysis hook for Personal Injury cases
  const { 
    metrics: piMetrics, 
    isAnalyzing: isPIAnalyzing, 
    error: piError 
  } = useCaseStrengthAnalysis(client.id);
  
  
  // Use case analysis hook
  const {
    analysisData,
    isLoading: isAnalysisLoading,
    error: analysisError,
    generateNewAnalysis,
    loadExistingAnalysis,
    regenerateStep7,
    regenerateStep8,
    isRegeneratingStep7,
    isRegeneratingStep8
  } = useCaseAnalysis(client.id, currentCase?.id);

  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | undefined>();

  // Conversation and notes state
  const [conversation, setConversation] = useState<any[]>([]);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  // Auto-load existing analysis when case-analysis tab is accessed (one-time only)
  useEffect(() => {
    if ((activeTab === "analysis" || activeTab === "case-analysis") && !isAnalysisLoading && !analysisData) {
      console.log("🔄 Auto-loading existing analysis data for tab access...");
      loadExistingAnalysis();
    }
  }, [activeTab, loadExistingAnalysis, isAnalysisLoading, analysisData]);

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


  
  const renderTabContent = () => {
    console.log("=== RENDERING TAB CONTENT DEBUG ===");
    console.log("Active tab:", activeTab);
    console.log("Is analysis loading:", isAnalysisLoading);
    console.log("Analysis error:", analysisError);
    console.log("Has analysis data:", !!analysisData);
    console.log("Analysis data:", analysisData);
    
    switch (activeTab) {
      case "client-intake":
        return (
          <ClientIntakeChat 
            clientId={client.id} 
            clientName={`${client.first_name} ${client.last_name}`}
          />
        );

      case "analysis":
      case "case-analysis":
        console.log("✅ Entering case-analysis case");
        
        // Check if this is a Personal Injury case
        console.log("🔍 Current case type:", currentCase?.case_type);
        if (currentCase?.case_type === "personal_injury") {
          console.log("🏥 Rendering Personal Injury module");
          return (
            <PIAnalysisContent 
              clientId={client.id}
              caseId={currentCase?.id}
              analysisMetrics={piMetrics}
              isAnalyzing={isPIAnalyzing}
              analysisError={piError}
            />
          );
        }
        
        // Default analysis flow for other case types
        if (isAnalysisLoading) {
          console.log("📊 Showing loading skeleton");
          return <CaseAnalysisLoadingSkeleton />;
        } else if (analysisError) {
          console.log("❌ Showing error state:", analysisError);
          return (
            <CaseAnalysisErrorState 
              error={analysisError} 
              onRefresh={generateNewAnalysis}
            />
          );
        } else if (!analysisData) {
          console.log("📝 Showing empty analysis state");
          return (
            <EmptyAnalysisState 
              clientName={`${client.first_name} ${client.last_name}`}
              clientId={client.id}
              caseId={currentCase?.id}
              selectedTab={analysisTab}
              setSelectedTab={setAnalysisTab}
              isGenerating={isAnalysisLoading}
              onGenerate={generateNewAnalysis}
              onLoadExisting={loadExistingAnalysis}
            />
          );
        } else {
          console.log("🎯 Showing full analysis content");
          return (
            <div className="container mx-auto py-8">
              <CaseAnalysisHeader
                title="Case Analysis"
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
                 regenerateStep7={regenerateStep7}
                 regenerateStep8={regenerateStep8}
                 isRegeneratingStep7={isRegeneratingStep7}
                 isRegeneratingStep8={isRegeneratingStep8}
               />
            </div>
          );
        }

      case "discussion":
      case "case-discussion":
        return (
          <CaseDiscussionContainer 
            clientId={client.id}
            clientName={`${client.first_name} ${client.last_name}`}
            onFindingsAdded={handleAnalysisRefresh}
          />
        );

      case "contracts":
        return <ContractsTabContent clientId={client.id} />;

      case "discovery":
        return <DiscoveryTabContent clientId={client.id} />;

      case "documents":
        return <DocumentsTabContent clientId={client.id} />;

      case "knowledge":
        return <KnowledgeTabContent clientId={client.id} />;

      case "templates":
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Layout className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Placeholder Tab</h3>
            <p className="text-muted-foreground mb-4">
              This tab is currently a placeholder. Templates have been moved to the Document Library for better organization.
            </p>
            <Button 
              onClick={() => window.location.href = '/document-library'}
              variant="outline"
            >
              Go to Document Library
            </Button>
          </div>
        );

      default:
        return <div>Content not found</div>;
    }
  };

  return (
    <div className="mt-6">
      {renderTabContent()}
    </div>
  );
};

export default ClientDetailTabContent;
