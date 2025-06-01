
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Mic } from "lucide-react";
import CaseDiscussionChatView from "./CaseDiscussionChatView";
import CaseDiscussionInput from "./CaseDiscussionInput";
import VoiceDiscussionInterface from "./VoiceDiscussionInterface";
import { useCaseDiscussion } from "@/hooks/useCaseDiscussion";
import { Skeleton } from "@/components/ui/skeleton";

interface CaseDiscussionContainerProps {
  clientId: string;
}

const CaseDiscussionContainer: React.FC<CaseDiscussionContainerProps> = ({ clientId }) => {
  const [activeMode, setActiveMode] = useState<"text" | "voice">("text");
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  
  const {
    messages,
    isLoading,
    isLoadingHistory,
    handleSendMessage,
    formatTimestamp
  } = useCaseDiscussion(clientId);

  // Handle voice transcript updates
  const handleVoiceTranscriptUpdate = (transcript: string, isUser: boolean) => {
    // Add voice transcripts as messages to maintain conversation history
    const timestamp = formatTimestamp();
    const role = isUser ? "attorney" : "ai";
    
    // Create a message object similar to text messages
    const voiceMessage = {
      client_id: clientId,
      user_id: "voice-session", // We'll use a placeholder for voice sessions
      content: transcript,
      role: role as "attorney" | "ai",
      timestamp,
      isVoiceMessage: true
    };

    // Note: In a real implementation, you'd want to save these to the database
    // For now, we'll just add them to the local messages state
    console.log("Voice transcript:", voiceMessage);
  };

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <div className="flex items-center space-x-2 justify-end">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-14 w-full rounded-lg mt-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] min-h-[600px]">
      <div className="flex flex-col flex-grow overflow-hidden border rounded-lg">
        <div className="bg-[#9b87f5] text-white p-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Case Discussion</h3>
              <div className="text-xs opacity-80">{formatTimestamp()}</div>
            </div>
            
            {isVoiceConnected && (
              <div className="flex items-center gap-2 text-xs bg-white/20 px-2 py-1 rounded">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Voice Active
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as "text" | "voice")} className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-2 m-2">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Text Chat
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Chat
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="flex-grow flex flex-col m-2 mt-0">
            <CaseDiscussionChatView 
              messages={messages} 
              isLoading={isLoading} 
            />
            
            <CaseDiscussionInput 
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="voice" className="flex-grow flex flex-col m-2 mt-0">
            <VoiceDiscussionInterface
              clientId={clientId}
              onTranscriptUpdate={handleVoiceTranscriptUpdate}
              onConnectionChange={setIsVoiceConnected}
            />
            
            {/* Show recent conversation history for context */}
            <div className="flex-grow overflow-hidden">
              <div className="text-sm text-gray-600 mb-2 px-2">Recent Conversation History:</div>
              <div className="flex-grow overflow-y-auto bg-gray-50 rounded border p-2">
                <CaseDiscussionChatView 
                  messages={messages.slice(-5)} // Show last 5 messages for context
                  isLoading={false}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CaseDiscussionContainer;
