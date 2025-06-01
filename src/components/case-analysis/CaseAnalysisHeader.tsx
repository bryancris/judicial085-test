
import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageCircle, StickyNote, Upload, Sparkles, RefreshCw } from "lucide-react";

interface CaseAnalysisHeaderProps {
  title: string;
  clientId: string;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  caseType?: string;
}

const CaseAnalysisHeader: React.FC<CaseAnalysisHeaderProps> = ({
  title,
  clientId,
  selectedTab,
  setSelectedTab,
  isGenerating,
  onGenerate,
  caseType
}) => {
  const handleRegenerateClick = () => {
    console.log("Regenerating real-time analysis...");
    onGenerate();
  };

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
            <Button
              onClick={handleRegenerateClick}
              disabled={isGenerating}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Analysis
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

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="conversation" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default CaseAnalysisHeader;
