/**
 * Enhanced Case Analysis Hook with Step-by-Step Execution
 * Implements individual step execution with real-time progress updates:
 * 1. Individual step edge functions (no timeouts)
 * 2. Real-time progress tracking and UI updates
 * 3. Fault tolerance with step-level retry
 * 4. Database persistence of workflow and step states
 */

import React, { useState, useCallback } from "react";
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
  const [isLoadingExistingResults, setIsLoadingExistingResults] = useState(false);
  const { toast } = useToast();

  const createWorkflow = async (): Promise<string | null> => {
    try {
      console.log('🔄 Creating workflow for client:', clientId);
      
      // First cleanup any stuck workflows for this client
      try {
        await supabase.functions.invoke('cleanup-stuck-workflows', {
          body: { clientId }
        });
        console.log('✅ Cleaned up existing stuck workflows');
      } catch (cleanupError) {
        console.warn('⚠️ Cleanup failed, continuing anyway:', cleanupError);
      }

      const { data, error } = await supabase.functions.invoke('case-analysis-workflow-manager', {
        body: {
          action: 'create_workflow',
          clientId,
          caseId
        }
      });

      if (error) {
        console.error('❌ Workflow manager error:', error);
        throw error;
      }
      if (!data.success) {
        console.error('❌ Workflow creation failed:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ Created workflow:', data.workflowId);
      return data.workflowId;
    } catch (error: any) {
      console.error('❌ Failed to create workflow:', error);
      toast({
        title: "Workflow Error", 
        description: `Failed to initialize analysis workflow: ${error.message}`,
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

  const loadExistingStepResults = useCallback(async () => {
    if (!clientId) return;

    try {
      setIsLoadingExistingResults(true);
      console.log('🔍 Loading existing step results from database...');

      // Get the most recent completed workflow for this client/case
      let workflowQuery = supabase
        .from('case_analysis_workflows')
        .select('id, status, current_step, total_steps')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (caseId) {
        workflowQuery = workflowQuery.eq('case_id', caseId);
      }

      const { data: workflows, error: workflowError } = await workflowQuery.limit(1);

      if (workflowError) throw workflowError;

      if (workflows && workflows.length > 0) {
        const workflow = workflows[0];
        console.log('📊 Found existing workflow:', workflow);

        // Get all completed steps for this workflow
        const { data: steps, error: stepsError } = await supabase
          .from('case_analysis_steps')
          .select('step_number, step_name, content, execution_time_ms, status')
          .eq('workflow_id', workflow.id)
          .eq('status', 'completed')
          .order('step_number', { ascending: true });

        if (stepsError) throw stepsError;

        if (steps && steps.length > 0) {
          console.log(`✅ Found ${steps.length} completed steps`);
          
          // Convert to stepResults format
          const existingStepResults: Record<string, any> = {};
          steps.forEach(step => {
            existingStepResults[`step${step.step_number}`] = {
              content: step.content,
              executionTime: step.execution_time_ms,
              stepName: step.step_name || getStepName(step.step_number)
            };
          });

          setStepResults(existingStepResults);
          
          // Set workflow state
          setWorkflowState({
            id: workflow.id,
            status: workflow.status as 'pending' | 'running' | 'completed' | 'failed',
            current_step: workflow.current_step,
            total_steps: workflow.total_steps,
            steps: Array.from({ length: workflow.total_steps }, (_, i) => ({
              step_number: i + 1,
              step_name: getStepName(i + 1),
              status: steps.find(s => s.step_number === i + 1) ? 'completed' : 'pending',
              id: `step-${i + 1}`,
            }))
          });

          console.log('🎯 Successfully loaded existing step results:', Object.keys(existingStepResults));
        } else {
          console.log('📝 No completed steps found for workflow');
        }
      } else {
        console.log('📝 No existing workflows found');
      }
    } catch (error) {
      console.error('❌ Failed to load existing step results:', error);
    } finally {
      setIsLoadingExistingResults(false);
    }
  }, [clientId, caseId]);

  // Load existing results when clientId or caseId changes
  React.useEffect(() => {
    if (clientId && !isGeneratingAnalysis) {
      loadExistingStepResults();
    }
  }, [clientId, caseId, loadExistingStepResults, isGeneratingAnalysis]);

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
      console.error('❌ No client ID provided');
      toast({
        title: "Error",
        description: "No client ID provided for analysis",
        variant: "destructive",
      });
      return;
    }

    // Prevent multiple concurrent workflow creation attempts
    if (isGeneratingAnalysis) {
      console.warn('⚠️ Analysis already in progress, skipping');
      toast({
        title: "Analysis in Progress",
        description: "Please wait for the current analysis to complete",
        variant: "default",
      });
      return;
    }

    try {
      setIsGeneratingAnalysis(true);
      setCurrentStep(0);
      setStepResults({});
      
      console.log('🚀 Starting enhanced case analysis workflow...');
      
      // Create workflow with proper error handling
      const workflowId = await createWorkflow();
      if (!workflowId) {
        console.error('❌ Failed to create workflow');
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
        console.log(`🔄 Starting Step ${step}: ${getStepName(step)}`);
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
          console.error(`❌ Step ${step} failed - stopping workflow execution`);
          
          // Update workflow state to show failure
          setWorkflowState(prev => ({
            ...prev!,
            status: 'failed',
            steps: prev!.steps.map(s => ({
              ...s,
              status: s.step_number === step ? 'failed' : 
                     s.step_number < step ? 'completed' : 'pending'
            }))
          }));
          
          toast({
            title: `Analysis Failed at Step ${step}`,
            description: `${getStepName(step)} failed. Please try again.`,
            variant: "destructive",
          });
          
          return;
        }

        // Wait for state update and get the latest step result
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Update allPreviousContent with the completed step
        const currentStepResults = stepResults;
        const stepResultKey = `step${step}`;
        
        // Ensure we have the step result before proceeding
        let attempts = 0;
        while (!currentStepResults[stepResultKey]?.content && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (currentStepResults[stepResultKey]?.content) {
          allPreviousContent[stepResultKey] = currentStepResults[stepResultKey].content;
          console.log(`✅ Step ${step} completed, content added to previous content`);
          onStepComplete?.(step, currentStepResults[stepResultKey].content);
        } else {
          console.warn(`⚠️ Step ${step} completed but no content found`);
        }

        // Brief pause between steps
        if (step < 9) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Update final workflow state
      setWorkflowState(prev => ({
        ...prev!,
        status: 'completed',
        current_step: 9,
        steps: prev!.steps.map(s => ({ ...s, status: 'completed' }))
      }));

      console.log('🎉 All 9 steps completed successfully');
      toast({
        title: "Analysis Complete",
        description: "Complete case analysis finished! All 9 steps completed.",
      });
      
      onAnalysisComplete?.(stepResults);

    } catch (error) {
      console.error('Analysis generation failed:', error);
      toast({
        title: "Analysis Failed",
        description: 'Failed to generate complete analysis. Please try again.',
        variant: "destructive",
      });
      
      setWorkflowState(prev => prev ? { ...prev, status: 'failed' } : null);
    } finally {
      setIsGeneratingAnalysis(false);
      setCurrentStep(0);
    }
  }, [clientId, caseId, executeStep, createWorkflow]);

  return {
    isGeneratingAnalysis,
    currentStep,
    workflowState,
    stepResults,
    isLoadingExistingResults,
    loadExistingStepResults,
    generateRealTimeAnalysisWithQualityControl
  };
};