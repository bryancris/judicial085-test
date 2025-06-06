
import React from "react";
import { Switch } from "@/components/ui/switch";

interface InterviewModeToggleProps {
  interviewMode: boolean;
  onInterviewModeChange: (enabled: boolean) => void;
}

const InterviewModeToggle = ({ interviewMode, onInterviewModeChange }: InterviewModeToggleProps) => {
  return (
    <div className="flex items-center justify-between mb-3 pb-2 border-b">
      <div className="flex items-center space-x-2">
        <div className={`p-1 rounded-lg transition-colors ${interviewMode ? 'bg-primary/10' : ''}`}>
          <Switch
            id="interview-mode"
            checked={interviewMode}
            onCheckedChange={onInterviewModeChange}
            className={interviewMode ? 'data-[state=checked]:bg-primary' : ''}
          />
        </div>
        <label 
          htmlFor="interview-mode" 
          className="text-sm font-medium cursor-pointer"
        >
          Interview Mode
        </label>
      </div>
      <div className="text-xs text-muted-foreground">
        {interviewMode ? "Role-based input" : "Direct fact entry"}
      </div>
    </div>
  );
};

export default InterviewModeToggle;
