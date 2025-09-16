
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, FileText, Scale, Search, BookOpen, CheckCircle2 } from "lucide-react";
import StepProgressIndicator from "./StepProgressIndicator";

interface CaseAnalysisLoadingSkeletonProps {
  currentStep?: number;
  workflowState?: {
    id: string;
    status: string;
    current_step: number;
    total_steps: number;
    steps: Array<{
      step_number: number;
      step_name: string;
      status: 'pending' | 'running' | 'completed' | 'failed';
    }>;
  };
}

const CaseAnalysisLoadingSkeleton: React.FC<CaseAnalysisLoadingSkeletonProps> = ({ 
  currentStep = 0, 
  workflowState 
}) => {

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <Brain className="w-12 h-12 text-primary animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Generating AI Analysis</h2>
        <p className="text-muted-foreground">
          {workflowState ? 
            `Processing Step ${workflowState.current_step} of ${workflowState.total_steps}` :
            currentStep > 0 ? `Processing Step ${currentStep} of 9` : "Initializing analysis..."
          }
        </p>
      </div>

      {/* Step Progress Indicator */}
      {(currentStep > 0 || workflowState) && (
        <div className="bg-card border rounded-lg p-6">
          <StepProgressIndicator
            currentStep={workflowState?.current_step || currentStep}
            totalSteps={workflowState?.total_steps || 9}
            steps={workflowState?.steps}
          />
        </div>
      )}

      {/* Analysis Content Skeletons */}
      <div className="grid gap-6">
        {/* Case Summary Skeleton */}
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>

        {/* Legal Analysis Skeleton */}
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        {/* Research Areas Skeleton */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4 p-6 border rounded-lg bg-card">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>

          <div className="space-y-4 p-6 border rounded-lg bg-card">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        </div>
      </div>

      {/* Processing Message */}
      <div className="text-center p-6 bg-muted/20 rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">
          🤖 AI is analyzing your case using advanced legal reasoning
        </p>
        <p className="text-xs text-muted-foreground">
          This process typically takes 2-3 minutes. Please don't refresh the page.
        </p>
      </div>
    </div>
  );
};

export default CaseAnalysisLoadingSkeleton;
