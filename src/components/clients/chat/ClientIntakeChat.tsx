
import React from "react";
import ChatView from "./ChatView";
import ChatInput from "./ChatInput";
import LegalAnalysisView from "./LegalAnalysisView";
import { useClientChat } from "@/hooks/useClientChat";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, Paperclip } from "lucide-react";

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
    isLoadingHistory,
    analysisError,
    prefilledMessage,
    handleSendMessage,
    handleFollowUpQuestionClick,
    formatTimestamp
  } = useClientChat(clientId);

  const handleAddDocuments = () => {
    // This is a placeholder function that will be implemented in the future
    console.log("Add supporting documents clicked");
    // For now, show a toast notification
    const { toast } = require("@/hooks/use-toast");
    toast({
      title: "Feature coming soon",
      description: "Document upload functionality will be implemented soon.",
    });
  };

  if (isLoadingHistory) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-300px)] min-h-[600px]">
        <div className="flex flex-col border rounded-lg overflow-hidden">
          <div className="bg-primary text-primary-foreground p-3">
            <h3 className="font-medium">Attorney / Client Input</h3>
            <div className="text-xs opacity-80">{formatTimestamp()}</div>
          </div>
          <div className="flex-grow p-4">
            <Skeleton className="h-[20px] w-full mb-4" />
            <Skeleton className="h-[20px] w-3/4 mb-4" />
            <Skeleton className="h-[20px] w-5/6 mb-4" />
          </div>
        </div>
        
        <div className="flex flex-col border rounded-lg overflow-hidden">
          <div className="bg-brand-burgundy text-white p-3">
            <h3 className="font-medium">Legal Analysis</h3>
            <div className="text-xs opacity-80">{formatTimestamp()}</div>
          </div>
          <div className="flex-grow p-4">
            <Skeleton className="h-[20px] w-full mb-4" />
            <Skeleton className="h-[20px] w-4/5 mb-4" />
            <Skeleton className="h-[20px] w-full mb-4" />
            <Skeleton className="h-[20px] w-2/3 mb-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-300px)] min-h-[600px]">
      {/* Attorney Input Side */}
      <div className="flex flex-col border rounded-lg overflow-hidden">
        <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center">
          <div>
            <h3 className="font-medium">Attorney / Client Input</h3>
            <div className="text-xs opacity-80">{formatTimestamp()}</div>
          </div>
          <Button 
            onClick={handleAddDocuments} 
            size="sm" 
            variant="secondary" 
            className="bg-white text-primary font-medium px-3 hover:bg-gray-100"
          >
            <Paperclip className="h-4 w-4 mr-2" />
            Add Supporting Documents
          </Button>
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
          prefilledMessage={prefilledMessage}
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
          error={analysisError}
          onQuestionClick={handleFollowUpQuestionClick}
        />
      </div>
    </div>
  );
};

export default ClientIntakeChat;
