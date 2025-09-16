
import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Layout, CheckCircle } from "lucide-react";
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
import { useEnhancedCaseAnalysis } from "@/hooks/useEnhancedCaseAnalysis";
import EmptyAnalysisState from "@/components/case-analysis/EmptyAnalysisState";
import StepContentDisplay from "@/components/case-analysis/StepContentDisplay";
import CaseAnalysisLoadingSkeleton from "@/components/case-analysis/CaseAnalysisLoadingSkeleton";
import CaseAnalysisErrorState from "@/components/case-analysis/CaseAnalysisErrorState";
import CaseAnalysisHeader from "@/components/case-analysis/CaseAnalysisHeader";
import TabsContainer from "@/components/case-analysis/tabs/TabsContainer";
import PIAnalysisContent from "@/components/personal-injury/PIAnalysisContent";
import { supabase } from "@/integrations/supabase/client";
import { useCaseStrengthAnalysis } from "@/hooks/useCaseStrengthAnalysis";
import { useWorkflowCleanup } from "@/hooks/useWorkflowCleanup";


interface ClientDetailTabContentProps {
  client: Client;
  activeTab: string;
  onRefreshAnalysis?: (refreshFn: () => void) => void;
}

const ClientDetailTabContent: React.FC<ClientDetailTabContentProps> = ({
  client,
  activeTab,
  onRefreshAnalysis,
}) => {
  const { currentCase } = useCase();
  const [analysisRefreshTrigger, setAnalysisRefreshTrigger] = useState(0);
  const [analysisTab, setAnalysisTab] = useState("analysis");
  
  // Workflow cleanup hook
  const { cleanupStuckWorkflows, isCleaningUp } = useWorkflowCleanup();
  
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

  // Enhanced step-by-step case analysis hook
  const {
    isGeneratingAnalysis: isEnhancedGenerating,
    currentStep: enhancedCurrentStep,
    workflowState,
    stepResults,
    isLoadingExistingResults,
    generateRealTimeAnalysisWithQualityControl
  } = useEnhancedCaseAnalysis(client.id, currentCase?.id);

  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | undefined>();
  const [hasLoadedAnalysis, setHasLoadedAnalysis] = useState(false);

  // Conversation, notes, and documents state
  const [conversation, setConversation] = useState<any[]>([]);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [documentCount, setDocumentCount] = useState(0);

  // Auto-load existing analysis when case-analysis tab is accessed (one-time only)
  useEffect(() => {
    if ((activeTab === "analysis" || activeTab === "case-analysis") && !isAnalysisLoading && !analysisData && !hasLoadedAnalysis) {
      console.log("🔄 Auto-loading existing analysis data for tab access... (timestamp:", new Date().toISOString(), ")");
      setHasLoadedAnalysis(true);
      loadExistingAnalysis();
    }
  }, [activeTab, isAnalysisLoading, analysisData, hasLoadedAnalysis]);

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

  // Load document count
  React.useEffect(() => {
    const loadDocumentCount = async () => {
      try {
        const { count, error } = await supabase
          .from("document_metadata")
          .select("*", { count: 'exact', head: true })
          .eq("client_id", client.id);

        if (error) throw error;
        setDocumentCount(count || 0);
      } catch (error) {
        console.error("Error loading document count:", error);
        setDocumentCount(0);
      }
    };

    loadDocumentCount();
  }, [client.id]);

  // Only set up the refresh function when we have analysis data (for the refresh button)
  useEffect(() => {
    if (activeTab === "case-analysis" && onRefreshAnalysis && analysisData && generateNewAnalysis) {
      // Only pass the function when there's existing data to refresh
      onRefreshAnalysis(generateNewAnalysis);
    }
  }, [activeTab, analysisData, onRefreshAnalysis, generateNewAnalysis]);

  // Helper function to generate source summary message
  const getSourceSummary = () => {
    const sources = [];
    
    if (conversation.length > 0) {
      sources.push(`${conversation.length} client intake statement${conversation.length === 1 ? '' : 's'}`);
    }
    
    if (documentCount > 0) {
      sources.push(`${documentCount} uploaded document${documentCount === 1 ? '' : 's'}`);
    }

    if (client.case_description && client.case_description.trim()) {
      sources.push('case description');
    }

    if (sources.length === 0) {
      return "Based on available client information";
    }

    if (sources.length === 1) {
      return `Based on ${sources[0]}`;
    }

    const lastSource = sources.pop();
    return `Based on ${sources.join(', ')} and ${lastSource}`;
  };
  
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
         if (isAnalysisLoading || isEnhancedGenerating || isLoadingExistingResults) {
           console.log("📊 Showing loading skeleton");
           return (
             <div className="space-y-6">
               <CaseAnalysisLoadingSkeleton 
                 currentStep={enhancedCurrentStep} 
                 workflowState={workflowState}
               />
               {workflowState && Object.keys(stepResults).length > 0 && (
                 <StepContentDisplay 
                   stepResults={stepResults}
                   currentStep={enhancedCurrentStep}
                 />
               )}
               <div className="flex justify-center">
                 <button 
                   onClick={() => cleanupStuckWorkflows(client.id)}
                   disabled={isCleaningUp}
                   className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 transition-colors disabled:opacity-50"
                 >
                   {isCleaningUp ? "Cleaning..." : "Stop Analysis & Clear Workflows"}
                 </button>
               </div>
             </div>
           );
         }

        // PRIORITY 1: Show partial results if available (even without errors)  
        if (Object.keys(stepResults).length > 0) {
          console.log("📊 Showing step results, available steps:", Object.keys(stepResults));
          
          // If there's also an error, show error info + partial results
          if (analysisError) {
            console.log("❌ Showing error state with partial results:", analysisError);
            return (
              <div className="space-y-6">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                      <span className="text-destructive-foreground text-xs">!</span>
                    </div>
                    <h3 className="font-semibold text-destructive">Analysis Failed</h3>
                  </div>
                  <p className="text-sm text-destructive/80">
                    The analysis process encountered an error, but some steps were completed successfully.
                  </p>
                   <Button 
                    onClick={generateNewAnalysis}
                    disabled={isAnalysisLoading || isEnhancedGenerating}
                    className="mt-3 mr-3"
                    size="sm"
                  >
                    {isAnalysisLoading || isEnhancedGenerating ? "Generating..." : "Refresh Analysis"}
                  </Button>
                  <button 
                    onClick={() => cleanupStuckWorkflows(client.id)}
                    disabled={isCleaningUp}
                    className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {isCleaningUp ? "Cleaning..." : "Clear Stuck Workflows"}
                  </button>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Partial Results Available</h3>
                  <StepContentDisplay 
                    stepResults={stepResults}
                    currentStep={enhancedCurrentStep}
                  />
                </div>
              </div>
            );
          }
          
          // If no error but we have step results, show them (analysis in progress or completed)
          console.log("✅ Showing partial results without error");
          const isWorkflowCompleted = workflowState?.status === 'completed';
          const isWorkflowRunning = workflowState?.status === 'running';
          
          return (
            <div className="space-y-6">
              {isWorkflowRunning && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">Analysis in Progress</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Generating comprehensive legal analysis step by step...
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {isWorkflowCompleted && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Analysis Complete</h3>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                          {getSourceSummary()}.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={generateNewAnalysis}
                      disabled={isAnalysisLoading || isEnhancedGenerating}
                      variant="outline"
                      size="sm"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                    >
                      {isAnalysisLoading || isEnhancedGenerating ? "Generating..." : "Refresh Analysis"}
                    </Button>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Current Progress</h3>
                <StepContentDisplay 
                  stepResults={stepResults}
                  currentStep={enhancedCurrentStep}
                />
              </div>
            </div>
          );
        }
        
        // PRIORITY 2: Show error state if there's an error and no partial results
        if (analysisError) {
          console.log("❌ Showing error state:", analysisError);
          console.log("📊 Checking for partial results. stepResults keys:", Object.keys(stepResults));
          
          // Show partial results if available, even when there's an error
          if (Object.keys(stepResults).length > 0) {
            console.log("✅ Showing partial results with error");
            return (
              <div className="space-y-6">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                      <span className="text-destructive-foreground text-xs">!</span>
                    </div>
                    <h3 className="font-semibold text-destructive">Analysis Failed</h3>
                  </div>
                  <p className="text-sm text-destructive/80">
                    The analysis process encountered an error, but some steps were completed successfully.
                  </p>
                  <Button 
                    onClick={generateNewAnalysis}
                    disabled={isAnalysisLoading || isEnhancedGenerating}
                    className="mt-3"
                    size="sm"
                  >
                    {isAnalysisLoading || isEnhancedGenerating ? "Generating..." : "Refresh Analysis"}
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Partial Results Available</h3>
                  <StepContentDisplay 
                    stepResults={stepResults}
                    currentStep={enhancedCurrentStep}
                  />
                </div>
              </div>
            );
          }
          
          return (
            <CaseAnalysisErrorState 
              error={analysisError} 
              onRefresh={generateNewAnalysis}
            />
          );
        }
        
        // PRIORITY 3: Show empty state if no analysis data and no step results
        if (!analysisData) {
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
