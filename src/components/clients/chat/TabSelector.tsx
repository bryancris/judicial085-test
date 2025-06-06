
import React from "react";
import { Button } from "@/components/ui/button";

interface TabSelectorProps {
  activeTab: "attorney" | "client";
  onTabChange: (tab: "attorney" | "client") => void;
  interviewMode: boolean;
}

const TabSelector = ({ activeTab, onTabChange, interviewMode }: TabSelectorProps) => {
  // Vibrant colors for active tabs
  const getTabStyle = (tab: "attorney" | "client") => {
    if (!interviewMode) {
      return "bg-transparent text-muted-foreground opacity-50 cursor-not-allowed";
    }
    
    if (tab === activeTab) {
      return tab === "attorney" 
        ? "bg-[#0EA5E9] text-white" 
        : "bg-[#8B5CF6] text-white";
    }
    return "bg-transparent";
  };

  if (!interviewMode) {
    return null;
  }

  return (
    <div className="flex items-center mb-2">
      <Button 
        variant="ghost" 
        size="sm" 
        className={`transition-colors ${getTabStyle("attorney")}`}
        onClick={() => onTabChange("attorney")}
        disabled={!interviewMode}
      >
        <span className="flex items-center gap-1">
          Attorney
        </span>
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        className={`transition-colors ${getTabStyle("client")}`}
        onClick={() => onTabChange("client")}
        disabled={!interviewMode}
      >
        <span className="flex items-center gap-1">
          Client
        </span>
      </Button>
    </div>
  );
};

export default TabSelector;
