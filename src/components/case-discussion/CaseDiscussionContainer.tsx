
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Mic } from "lucide-react";
import CaseDiscussionChatView from "./CaseDiscussionChatView";
import CaseDiscussionInput from "./CaseDiscussionInput";
import VoiceDiscussionInterface from "./VoiceDiscussionInterface";
import { useCaseDiscussion } from "@/hooks/useCaseDiscussion";
import { Skeleton } from "@/components/ui/skeleton";

interface CaseDiscussionContainerProps {
  clientId: string;
  clientName: string;
}

const CaseDiscussionContainer: React.FC<CaseDiscussionContainerProps> = ({ 
  clientId, 
  clientName 
}) => {
  const [activeTab, setActiveTab] = useState("text-chat");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const {
    messages,
    isLoading,
    isLoadingHistory,
    handleSendMessage,
    formatTimestamp
  } = useCaseDiscussion(clientId);

  const handleFindingsAdded = () => {
    // Trigger a refresh or notification that findings were added
    setRefreshTrigger(prev => prev + 1);
    console.log("Research findings added to case analysis");
  };

  if (isLoadingHistory) {
    return (
      <Card className="h-[600px]">
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
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Case Discussion - {clientName}
          <div className="text-xs text-muted-foreground ml-auto">
            {formatTimestamp()}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow flex flex-col p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
            <TabsTrigger value="text-chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Text Chat
            </TabsTrigger>
            <TabsTrigger value="voice-chat" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Chat
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text-chat" className="flex-grow flex flex-col mt-0">
            <CaseDiscussionChatView 
              messages={messages}
              isLoading={isLoading}
              clientId={clientId}
              onFindingsAdded={handleFindingsAdded}
            />
            <CaseDiscussionInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="voice-chat" className="flex-grow flex flex-col mt-0">
            <VoiceDiscussionInterface 
              clientId={clientId}
              clientName={clientName}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CaseDiscussionContainer;
