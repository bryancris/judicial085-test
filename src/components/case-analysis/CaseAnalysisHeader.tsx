
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, MessageCircle, StickyNote, Upload, Sparkles, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExportButton } from "./export/ExportButton";

interface CaseAnalysisHeaderProps {
  title: string;
  clientId: string;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  caseType?: string;
  hasUnincorporatedFindings?: boolean;
}

const CaseAnalysisHeader: React.FC<CaseAnalysisHeaderProps> = ({
  title,
  clientId,
  selectedTab,
  setSelectedTab,
  isGenerating,
  onGenerate,
  caseType,
  hasUnincorporatedFindings = false
}) => {
  const handleRegenerateClick = () => {
    console.log("Regenerating real-time analysis...");
    onGenerate();
  };

  const tabs = [
    { id: "analysis", label: "Analysis", icon: FileText },
    { id: "conversation", label: "Conversation", icon: MessageCircle },
    { id: "notes", label: "Notes", icon: StickyNote },
    { id: "documents", label: "Documents", icon: Upload },
  ];

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {caseType && (
            <p className="text-sm text-muted-foreground mt-1">
              Case Type: {caseType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          )}
        </div>
        
        {selectedTab === "analysis" && (
          <div className="flex gap-2">
            <ExportButton
              clientId={clientId}
              disabled={isGenerating}
            />
            
            <Button
              onClick={handleRegenerateClick}
              disabled={isGenerating}
              variant="outline"
              size="sm"
              className={cn(
                "flex items-center gap-2",
                hasUnincorporatedFindings && !isGenerating && "animate-pulse bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
              )}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {hasUnincorporatedFindings ? "Update Analysis" : "Regenerate Analysis"}
                </>
              )}
            </Button>
            
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Real-Time Analysis
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full">
        <div className="grid w-full grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2",
                  isActive 
                    ? "bg-background text-foreground shadow-sm" 
                    : "hover:bg-background/50"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CaseAnalysisHeader;
