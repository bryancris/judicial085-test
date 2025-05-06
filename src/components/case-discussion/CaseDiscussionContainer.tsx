
import React from "react";
import CaseDiscussionChatView from "./CaseDiscussionChatView";
import CaseDiscussionInput from "./CaseDiscussionInput";
import { useCaseDiscussion } from "@/hooks/useCaseDiscussion";
import { Skeleton } from "@/components/ui/skeleton";

interface CaseDiscussionContainerProps {
  clientId: string;
}

const CaseDiscussionContainer: React.FC<CaseDiscussionContainerProps> = ({ clientId }) => {
  const {
    messages,
    isLoading,
    isLoadingHistory,
    handleSendMessage,
    formatTimestamp
  } = useCaseDiscussion(clientId);

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
    <div className="flex flex-col h-[calc(100vh-400px)] min-h-[500px]">
      <div className="flex flex-col flex-grow overflow-hidden border rounded-lg">
        <div className="bg-[#9b87f5] text-white p-3">
          <h3 className="font-medium">Case Discussion</h3>
          <div className="text-xs opacity-80">{formatTimestamp()}</div>
        </div>
        
        <CaseDiscussionChatView 
          messages={messages} 
          isLoading={isLoading} 
        />
        
        <CaseDiscussionInput 
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default CaseDiscussionContainer;
