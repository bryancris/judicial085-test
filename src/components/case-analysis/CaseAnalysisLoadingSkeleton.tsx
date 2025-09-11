
import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, FileText, Scale, CheckCircle2 } from "lucide-react";

const CaseAnalysisLoadingSkeleton: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { icon: FileText, label: "Analyzing case facts and documents..." },
    { icon: Brain, label: "Generating preliminary analysis..." },
    { icon: Scale, label: "Creating IRAC legal analysis..." },
    { icon: CheckCircle2, label: "Finalizing comprehensive analysis..." }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="space-y-6">
      {/* Header with AI Analysis Status */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Brain className="h-8 w-8 text-primary animate-pulse" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-ping"></div>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Generating AI Analysis</h2>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full max-w-md mb-6">
          <div className="bg-muted rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Current Step Display */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
          {React.createElement(steps[currentStep].icon, { 
            className: "h-5 w-5 text-primary animate-pulse" 
          })}
          <span className="text-foreground font-medium">
            {steps[currentStep].label}
          </span>
        </div>
      </div>

      {/* Enhanced Loading Skeletons */}
      <div className="space-y-6">
        <div className="bg-background border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>

        <div className="bg-background border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-56" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>

        <div className="bg-background border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>

      {/* Estimated Time */}
      <div className="text-center text-sm text-muted-foreground">
        <p>AI analysis typically takes 30-60 seconds</p>
        <p className="mt-1">Please do not refresh the page</p>
      </div>
    </div>
  );
};

export default CaseAnalysisLoadingSkeleton;
