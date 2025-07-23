import React, { useState, useEffect } from "react";
import { Loader2, Search, BookOpen, Brain, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResearchLoadingProps {
  isVisible: boolean;
  stage?: 'analyzing' | 'researching' | 'formatting' | 'saving';
  researchType?: 'similar-cases' | 'legal-research' | 'general';
}

const ResearchLoading: React.FC<ResearchLoadingProps> = ({
  isVisible,
  stage = 'analyzing',
  researchType = 'general'
}) => {
  const [dots, setDots] = useState('');
  const [currentStage, setCurrentStage] = useState(stage);

  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    
    // Simulate stage progression
    const stageProgression = ['analyzing', 'researching', 'formatting', 'saving'];
    let currentIndex = 0;
    
    const stageInterval = setInterval(() => {
      if (currentIndex < stageProgression.length - 1) {
        currentIndex++;
        setCurrentStage(stageProgression[currentIndex] as typeof stage);
      }
    }, 2000);

    return () => clearInterval(stageInterval);
  }, [isVisible]);

  if (!isVisible) return null;

  const getStageIcon = () => {
    switch (currentStage) {
      case 'analyzing':
        return <Brain className="h-4 w-4 animate-pulse" />;
      case 'researching':
        return researchType === 'similar-cases' ? 
          <BookOpen className="h-4 w-4 animate-bounce" /> : 
          <Search className="h-4 w-4 animate-bounce" />;
      case 'formatting':
        return <Sparkles className="h-4 w-4 animate-spin" />;
      case 'saving':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStageText = () => {
    switch (currentStage) {
      case 'analyzing':
        return 'Analyzing your request';
      case 'researching':
        return researchType === 'similar-cases' ? 
          'Finding similar cases' : 
          'Researching legal authorities';
      case 'formatting':
        return 'Organizing research results';
      case 'saving':
        return 'Saving findings';
      default:
        return 'Processing';
    }
  };

  const getProgressSteps = () => {
    const steps = [
      { key: 'analyzing', label: 'Analyze' },
      { key: 'researching', label: 'Research' },
      { key: 'formatting', label: 'Format' },
      { key: 'saving', label: 'Save' }
    ];

    return steps.map((step, index) => {
      const isActive = step.key === currentStage;
      const isCompleted = steps.findIndex(s => s.key === currentStage) > index;
      
      return (
        <div key={step.key} className="flex items-center">
          <div className={cn(
            "w-2 h-2 rounded-full transition-colors",
            isActive ? "bg-blue-600 animate-pulse" : 
            isCompleted ? "bg-green-600" : "bg-gray-300"
          )} />
          <span className={cn(
            "ml-2 text-xs",
            isActive ? "text-blue-600 font-medium" : 
            isCompleted ? "text-green-600" : "text-gray-500"
          )}>
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div className="w-4 h-px bg-gray-300 mx-2" />
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
        {getStageIcon()}
      </div>
      
      <div className="flex flex-col flex-1">
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {getStageText()}{dots}
            </span>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-1 overflow-x-auto">
            {getProgressSteps()}
          </div>
          
          {/* Research Type Indicator */}
          {currentStage === 'researching' && researchType && (
            <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
              Using {researchType === 'similar-cases' ? 'case law databases' : 'legal research tools'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchLoading;