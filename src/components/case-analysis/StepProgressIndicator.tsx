import React from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps?: Array<{
    step_number: number;
    step_name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
  }>;
}

const STEP_NAMES = [
  'Case Summary',
  'Preliminary Analysis', 
  'Texas Laws',
  'Case Law Research',
  'IRAC Analysis',
  'Strengths & Weaknesses',
  'Refined Analysis',
  'Follow-up Questions',
  'Law References'
];

const StepProgressIndicator: React.FC<StepProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  steps
}) => {
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  const getStepIcon = (stepNumber: number, status?: string) => {
    if (status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    } else if (status === 'running' || stepNumber === currentStep) {
      return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    } else if (status === 'failed') {
      return <AlertCircle className="w-5 h-5 text-destructive" />;
    }
    return <Circle className="w-5 h-5 text-muted-foreground" />;
  };

  const getStepStatus = (stepNumber: number) => {
    if (steps) {
      const step = steps.find(s => s.step_number === stepNumber);
      return step?.status || 'pending';
    }
    
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'running';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Analysis Progress</h3>
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <p className="text-sm text-muted-foreground">
          {progressPercentage}% Complete
        </p>
      </div>

      {/* Step List */}
      <div className="space-y-3">
        {STEP_NAMES.map((stepName, index) => {
          const stepNumber = index + 1;
          const status = getStepStatus(stepNumber);
          
          return (
            <div
              key={stepNumber}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                status === 'completed' && "bg-emerald-50 border-emerald-200",
                status === 'running' && "bg-primary/5 border-primary/20",
                status === 'failed' && "bg-destructive/5 border-destructive/20",
                status === 'pending' && "bg-muted/30 border-muted"
              )}
            >
              {getStepIcon(stepNumber, status)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Step {stepNumber}
                  </span>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full capitalize",
                    status === 'completed' && "bg-emerald-100 text-emerald-700",
                    status === 'running' && "bg-primary/10 text-primary",
                    status === 'failed' && "bg-destructive/10 text-destructive",
                    status === 'pending' && "bg-muted text-muted-foreground"
                  )}>
                    {status === 'running' ? 'In Progress' : status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {stepName}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgressIndicator;