
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import ScholarResearchButton from "./ScholarResearchButton";

interface CaseAnalysisHeaderProps {
  title: string;
  clientId: string;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  isGenerating?: boolean;
  onGenerate?: () => void;
  caseType?: string;
}

const CaseAnalysisHeader = ({
  title,
  clientId,
  selectedTab,
  setSelectedTab,
  isGenerating = false,
  onGenerate,
  caseType
}: CaseAnalysisHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <div className="flex gap-2">
          {caseType && caseType !== "general" && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {caseType === "consumer-protection" ? "Consumer Protection" : caseType}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-auto">
        {onGenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating..." : "Generate Analysis"}
          </Button>
        )}
        
        <ScholarResearchButton clientId={clientId} caseType={caseType} />
        
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="hidden md:block"
        >
          <TabsList>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="conversation">Conversation</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="block md:hidden w-full"
      >
        <TabsList className="w-full">
          <TabsTrigger value="analysis" className="flex-1">
            Analysis
          </TabsTrigger>
          <TabsTrigger value="conversation" className="flex-1">
            Conversation
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex-1">
            Notes
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default CaseAnalysisHeader;
