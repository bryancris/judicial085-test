
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Mic, FileText } from "lucide-react";
import CaseDiscussionChatView from "./CaseDiscussionChatView";
import CaseDiscussionInput from "./CaseDiscussionInput";
import VoiceDiscussionInterface from "./VoiceDiscussionInterface";
import VoiceTranscriptViewer from "./VoiceTranscriptViewer";
import { useCaseDiscussion } from "@/hooks/useCaseDiscussion";
import { Skeleton } from "@/components/ui/skeleton";

interface CaseDiscussionContainerProps {
  clientId: string;
  clientName: string;
  onFindingsAdded?: () => void;
}

const CaseDiscussionContainer: React.FC<CaseDiscussionContainerProps> = ({ 
  clientId, 
  clientName,
  onFindingsAdded
}) => {
  const [activeTab, setActiveTab] = useState("text-chat");
  
  const {
    messages,
    isLoading,
    isLoadingHistory,
    handleSendMessage,
    formatTimestamp
  } = useCaseDiscussion(clientId);

  const handleFindingsAdded = () => {
    console.log("Research findings added to case analysis");
    // Trigger refresh in parent component (Case Analysis)
    if (onFindingsAdded) {
      onFindingsAdded();
    }
  };

  if (isLoadingHistory) {
    return (
      <Card className="h-[calc(100vh-200px)] min-h-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Case Discussion - {clientName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-[20px] w-full" />
            <Skeleton className="h-[20px] w-3/4" />
            <Skeleton className="h-[20px] w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[calc(100vh-200px)] min-h-[500px] flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Case Discussion - {clientName}
          <div className="text-xs text-muted-foreground ml-auto">
            {formatTimestamp()}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow flex flex-col p-0 min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-2 shrink-0">
            <TabsTrigger value="text-chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Text Chat
            </TabsTrigger>
            <TabsTrigger value="voice-chat" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Chat
            </TabsTrigger>
            <TabsTrigger value="transcripts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Transcripts
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text-chat" className="flex-grow flex flex-col mt-0 min-h-0">
            <div className="flex-grow min-h-0">
              <CaseDiscussionChatView 
                messages={messages}
                isLoading={isLoading}
                clientId={clientId}
                onFindingsAdded={handleFindingsAdded}
              />
            </div>
            <div className="shrink-0 border-t bg-card">
              <CaseDiscussionInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="voice-chat" className="flex-grow flex flex-col mt-0">
            <VoiceDiscussionInterface 
              clientId={clientId}
              onTranscriptUpdate={() => {}}
              onConnectionChange={() => {}}
            />
          </TabsContent>
          
          <TabsContent value="transcripts" className="flex-grow flex flex-col mt-0 p-4">
            <VoiceTranscriptViewer clientId={clientId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CaseDiscussionContainer;
