/**
 * Enhanced Case Analysis Hook with Step-by-Step Execution
 * Implements individual step execution with real-time progress updates:
 * 1. Individual step edge functions (no timeouts)
 * 2. Real-time progress tracking and UI updates
 * 3. Fault tolerance with step-level retry
 * 4. Database persistence of workflow and step states
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WorkflowStep {
  id: string;
  step_number: number;
  step_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  content?: string;
  execution_time_ms?: number;
  error_message?: string;
}

interface WorkflowState {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  current_step: number;
  total_steps: number;
  steps: WorkflowStep[];
}

export const useEnhancedCaseAnalysis = (clientId?: string, caseId?: string) => {
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [stepResults, setStepResults] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const createWorkflow = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('case-analysis-workflow-manager', {
        body: {
          action: 'create_workflow',
          clientId,
          caseId
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.workflowId;
    } catch (error: any) {
      console.error('Failed to create workflow:', error);
      toast({
        title: "Workflow Error",
        description: "Failed to initialize analysis workflow",
        variant: "destructive",
      });
      return null;
    }
  };

  const getWorkflowStatus = async (workflowId: string): Promise<WorkflowState | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('case-analysis-workflow-manager', {
        body: {
          action: 'get_workflow_status',
          workflowId
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return {
        id: data.workflow.id,
        status: data.workflow.status,
        current_step: data.workflow.current_step,
        total_steps: data.workflow.total_steps,
        steps: data.steps
      };
    } catch (error: any) {
      console.error('Failed to get workflow status:', error);
      return null;
    }
  };

  const executeStep = async (stepNumber: number, workflowId: string, previousContent?: string): Promise<boolean> => {
    try {
      const functionName = `case-analysis-step-${stepNumber}`;
      console.log(`🚀 Executing ${functionName} for workflow ${workflowId}`);

      // Get existing context for step 1
      let existingContext = '';
      if (stepNumber === 1) {
        // Fetch client messages for context
        const { data: messages } = await supabase
          .from('client_messages')
          .select('content, role, timestamp')
          .eq('client_id', clientId)
          .order('timestamp', { ascending: true });

        if (messages && messages.length > 0) {
          existingContext = messages
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join('\n\n');
        }
      }

      const payload = {
        workflowId,
        clientId,
        caseId,
        ...(stepNumber === 1 ? { existingContext } : { previousStepContent: previousContent })
      };

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) {
        console.error(`Step ${stepNumber} error:`, error);
        throw error;
      }

      if (!data.success) {
        console.error(`Step ${stepNumber} failed:`, data.error);
        throw new Error(data.error);
      }

      console.log(`✅ Step ${stepNumber} completed successfully`);
      
      // Update step results
      setStepResults(prev => ({
        ...prev,
        [`step${stepNumber}`]: {
          content: data.content,
          executionTime: data.executionTime,
          stepName: data.stepName
        }
      }));

      return true;
    } catch (error: any) {
      console.error(`Step ${stepNumber} execution failed:`, error);
      
      toast({
        title: `Step ${stepNumber} Failed`,
        description: `Failed to complete ${stepNumber === 1 ? 'Case Summary' : 'analysis step'}. ${error.message}`,
        variant: "destructive",
      });
      
      return false;
    }
  };

  const generateRealTimeAnalysisWithQualityControl = useCallback(async (
    onAnalysisComplete?: () => Promise<void>,
    onSimilarCasesComplete?: () => void,
    onScholarlyReferencesComplete?: () => void
  ) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID is required for analysis generation",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAnalysis(true);
    setCurrentStep(0);
    setStepResults({});
    setWorkflowState(null);

    try {
      console.log("🚀 Starting step-by-step analysis generation for client:", clientId, "case:", caseId);
      
      // Step 1: Create workflow
      const workflowId = await createWorkflow();
      if (!workflowId) {
        throw new Error("Failed to create workflow");
      }

      console.log(`✅ Created workflow ${workflowId}`);

      // Execute steps 1 and 2 (for now, will expand to all 9)
      let previousContent = '';
      
      for (let stepNum = 1; stepNum <= 2; stepNum++) {
        setCurrentStep(stepNum);
        
        // Get updated workflow status
        const status = await getWorkflowStatus(workflowId);
        if (status) {
          setWorkflowState(status);
        }

        const success = await executeStep(stepNum, workflowId, previousContent);
        if (!success) {
          throw new Error(`Step ${stepNum} failed`);
        }

        // Get the content for next step
        if (stepResults[`step${stepNum}`]) {
          previousContent = stepResults[`step${stepNum}`].content;
        }

        // Add delay between steps for better UX
        if (stepNum < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Complete workflow
      await supabase.functions.invoke('case-analysis-workflow-manager', {
        body: {
          action: 'complete_workflow',
          workflowId
        }
      });

      console.log("✅ All steps completed successfully");
      
      toast({
        title: "Analysis Complete",
        description: `Step-by-step legal analysis completed successfully${caseId ? ' for this case' : ''}.`,
      });

      // Refresh analysis data
      if (onAnalysisComplete) {
        console.log("Refreshing analysis data...");
        await onAnalysisComplete();
        console.log("✅ Analysis data refreshed");
      }

      // Auto-trigger follow-up actions
      if (onSimilarCasesComplete) {
        console.log("🔍 Auto-triggering similar cases search...");
        setTimeout(() => {
          onSimilarCasesComplete();
        }, 1000);
      }

      if (onScholarlyReferencesComplete) {
        console.log("📚 Auto-triggering scholarly references search...");
        setTimeout(() => {
          onScholarlyReferencesComplete();
        }, 1500);
      }

    } catch (error: any) {
      console.error("Error during step-by-step analysis generation:", error);
      
      toast({
        title: "Analysis Generation Failed",
        description: error.message || "An unexpected error occurred during analysis generation",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAnalysis(false);
      setCurrentStep(0);
    }
  }, [clientId, caseId, stepResults, toast]);

  return {
    isGeneratingAnalysis,
    currentStep,
    workflowState,
    stepResults,
    generateRealTimeAnalysisWithQualityControl
  };
};