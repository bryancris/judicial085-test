
import React from "react";
import ChatView from "./ChatView";
import ChatInput from "./ChatInput";
import LegalAnalysisView from "./LegalAnalysisView";
import { useClientChat } from "@/hooks/useClientChat";

interface ClientIntakeChatProps {
  clientId: string;
}

const ClientIntakeChat = ({ clientId }: ClientIntakeChatProps) => {
  const {
    activeTab,
    setActiveTab,
    messages,
    legalAnalysis,
    isLoading,
    isAnalysisLoading,
    handleSendMessage,
    formatTimestamp
  } = useClientChat(clientId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-400px)] min-h-[500px]">
      {/* Attorney Input Side */}
      <div className="flex flex-col border rounded-lg overflow-hidden">
        <div className="bg-primary text-primary-foreground p-3">
          <h3 className="font-medium">Attorney Input</h3>
          <div className="text-xs opacity-80">{formatTimestamp()}</div>
        </div>
        
        <ChatView 
          messages={messages} 
          isLoading={isLoading} 
        />
        
        <ChatInput 
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Legal Analysis Side */}
      <div className="flex flex-col border rounded-lg overflow-hidden">
        <div className="bg-brand-burgundy text-white p-3">
          <h3 className="font-medium">Legal Analysis</h3>
          <div className="text-xs opacity-80">{formatTimestamp()}</div>
        </div>
        
        <LegalAnalysisView 
          analysisItems={legalAnalysis}
          isLoading={isAnalysisLoading}
        />
      </div>
    </div>
  );
};

export default ClientIntakeChat;
