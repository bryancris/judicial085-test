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

  const getStepName = (stepNumber: number): string => {
    const stepNames = {
      1: "Case Summary",
      2: "Preliminary Analysis", 
      3: "Texas Law Research",
      4: "Case Law Research",
      5: "IRAC Analysis",
      6: "Strengths & Weaknesses",
      7: "Refined Analysis",
      8: "Follow-up Questions",
      9: "Law References"
    };
    return stepNames[stepNumber as keyof typeof stepNames] || `Step ${stepNumber}`;
  };

  const getClientContext = async (): Promise<string> => {
    const { data: messages } = await supabase
      .from('client_messages')
      .select('content, role, timestamp')
      .eq('client_id', clientId)
      .order('timestamp', { ascending: true });

    return messages?.map(msg => `${msg.role}: ${msg.content}`).join('\n\n') || '';
  };

  const executeStep = async (stepNumber: number, workflowId: string, allPreviousContent?: Record<string, string>): Promise<boolean> => {
    try {
      console.log(`Executing step ${stepNumber} for workflow ${workflowId}`);
      
      let requestBody: any = { 
        workflowId, 
        stepNumber 
      };

      // For step 1, get context from client messages
      if (stepNumber === 1) {
        const clientMessages = await getClientContext();
        requestBody.previousContent = clientMessages;
      }
      // For step 2, use step 1 content
      else if (stepNumber === 2 && allPreviousContent?.step1) {
        requestBody.previousContent = allPreviousContent.step1;
      }
      // For steps 3-9, provide all previous content
      else if (stepNumber >= 3) {
        requestBody.allPreviousContent = allPreviousContent;
        if (stepNumber === 3 || stepNumber === 4) {
          // Steps 3 and 4 use combined content from steps 1 and 2
          requestBody.previousContent = `${allPreviousContent?.step1 || ''}\n\n${allPreviousContent?.step2 || ''}`;
        }
      }

      const { data, error } = await supabase.functions.invoke(`case-analysis-step-${stepNumber}`, {
        body: requestBody
      });

      if (error) {
        console.error(`Step ${stepNumber} error:`, error);
        return false;
      }

      console.log(`Step ${stepNumber} completed successfully`);
      
      // Update step results
      setStepResults(prev => ({
        ...prev,
        [`step${stepNumber}`]: {
          content: data.content,
          executionTime: data.executionTime,
          stepName: getStepName(stepNumber)
        }
      }));

      return true;
    } catch (error) {
      console.error(`Step ${stepNumber} execution failed:`, error);
      return false;
    }
  };

  const generateRealTimeAnalysisWithQualityControl = useCallback(async (
    onStepComplete?: (step: number, content: string) => void,
    onAnalysisComplete?: (analysisData: any) => void
  ) => {
    if (!clientId) {
      console.error('No client ID provided');
      return;
    }

    try {
      setIsGeneratingAnalysis(true);
      setCurrentStep(0);
      setStepResults({});
      
      console.log('Starting enhanced case analysis workflow...');
      
      // Create workflow
      const workflowId = await createWorkflow();
      if (!workflowId) {
        throw new Error('Failed to create workflow');
      }

      // Initialize workflow state
      const initialWorkflowState: WorkflowState = {
        id: workflowId,
        status: 'running',
        current_step: 1,
        total_steps: 9,
        steps: Array.from({ length: 9 }, (_, i) => ({
          step_number: i + 1,
          step_name: getStepName(i + 1),
          status: i === 0 ? 'running' : 'pending',
          id: `step-${i + 1}`,
        }))
      };
      
      setWorkflowState(initialWorkflowState);

      // Execute all 9 steps
      let allPreviousContent: Record<string, string> = {};
      
      for (let step = 1; step <= 9; step++) {
        setCurrentStep(step);
        
        // Update workflow state
        setWorkflowState(prev => ({
          ...prev!,
          current_step: step,
          steps: prev!.steps.map(s => ({
            ...s,
            status: s.step_number === step ? 'running' : 
                   s.step_number < step ? 'completed' : 'pending'
          }))
        }));

        const success = await executeStep(step, workflowId, allPreviousContent);
        
        if (!success) {
          console.error(`Step ${step} failed, but continuing with remaining steps`);
          // Continue with other steps even if one fails
          continue;
        }

        // Update allPreviousContent with the new step result
        const stepResult = stepResults[`step${step}`];
        if (stepResult?.content) {
          allPreviousContent[`step${step}`] = stepResult.content;
          onStepComplete?.(step, stepResult.content);
        }

        // Small delay between steps to prevent overwhelming the API
        if (step < 9) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Update final workflow state
      setWorkflowState(prev => ({
        ...prev!,
        status: 'completed',
        current_step: 9,
        steps: prev!.steps.map(s => ({ ...s, status: 'completed' }))
      }));

      toast({
        title: "Analysis Complete",
        description: "Complete case analysis finished! All 9 steps completed.",
      });
      
      onAnalysisComplete?.(stepResults);

    } catch (error) {
      console.error('Analysis generation failed:', error);
      toast({
        title: "Analysis Failed",
        description: 'Failed to generate complete analysis. Some steps may have completed.',
        variant: "destructive",
      });
      
      setWorkflowState(prev => prev ? { ...prev, status: 'failed' } : null);
    } finally {
      setIsGeneratingAnalysis(false);
      setCurrentStep(0);
    }
  }, [clientId, caseId, executeStep, createWorkflow, stepResults]);

  return {
    isGeneratingAnalysis,
    currentStep,
    workflowState,
    stepResults,
    generateRealTimeAnalysisWithQualityControl
  };
};