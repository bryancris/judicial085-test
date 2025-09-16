import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { processMarkdown } from "@/utils/markdownProcessor";

interface StepResult {
  content: string;
  executionTime?: number;
  stepName: string;
}

interface StepContentDisplayProps {
  stepResults: Record<string, StepResult>;
  currentStep: number;
}

const StepContentDisplay: React.FC<StepContentDisplayProps> = ({
  stepResults,
  currentStep
}) => {
  const getStepStatus = (stepKey: string, stepNumber: number) => {
    if (stepResults[stepKey]) return 'completed';
    if (stepNumber === currentStep) return 'running';
    return 'pending';
  };

  const formatExecutionTime = (ms?: number) => {
    if (!ms) return '';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="step-content-unified">
      {Object.entries(stepResults).map(([stepKey, result]) => {
        const stepNumber = parseInt(stepKey.replace('step', ''));
        const status = getStepStatus(stepKey, stepNumber);
        
        return (
          <Card key={stepKey} className="transition-all duration-300">
            <CardHeader className="pb-2 p-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  )}
                  {status === 'running' && (
                    <Clock className="w-5 h-5 text-primary animate-pulse" />
                  )}
                  Step {stepNumber}: {result.stepName}
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={status === 'completed' ? 'default' : 'secondary'}
                    className={cn(
                      status === 'completed' && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
                      status === 'running' && "bg-primary/10 text-primary"
                    )}
                  >
                    {status === 'completed' ? 'Completed' : 'In Progress'}
                  </Badge>
                  
                  {result.executionTime && (
                    <Badge variant="outline" className="text-xs">
                      {formatExecutionTime(result.executionTime)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-2">
              <div className="legal-document max-w-none">
                <div 
                  className="step-content-unified text-sm"
                  dangerouslySetInnerHTML={{ 
                    __html: processMarkdown(result.content) 
                  }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* Show placeholder for current step if running */}
      {currentStep > 0 && !stepResults[`step${currentStep}`] && (
        <Card className="border-dashed">
          <CardHeader className="pb-2 p-2">
            <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
              <Clock className="w-5 h-5 animate-pulse" />
              Step {currentStep}: Processing...
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Analyzing case information and generating content...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StepContentDisplay;