
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, BarChart3, Users, FileText, Mic } from "lucide-react";

const ClientDetailTabsList: React.FC = () => {
  return (
    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
      <TabsTrigger value="client-intake" className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <span className="hidden sm:inline">Client Intake</span>
        <span className="sm:hidden">Intake</span>
      </TabsTrigger>
      <TabsTrigger value="case-analysis" className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        <span className="hidden sm:inline">Case Analysis</span>
        <span className="sm:hidden">Analysis</span>
      </TabsTrigger>
      <TabsTrigger value="case-discussion" className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <span className="hidden sm:inline">Case Discussion</span>
        <span className="sm:hidden">Discussion</span>
      </TabsTrigger>
      <TabsTrigger value="voice-transcripts" className="flex items-center gap-2">
        <Mic className="h-4 w-4" />
        <span className="hidden sm:inline">Voice Transcripts</span>
        <span className="sm:hidden">Voice</span>
      </TabsTrigger>
    </TabsList>
  );
};

export default ClientDetailTabsList;
