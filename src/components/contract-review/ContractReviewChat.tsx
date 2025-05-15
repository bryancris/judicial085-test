
import React from "react";
import ContractReviewChatView from "./ContractReviewChatView";
import ContractReviewChatInput from "./ContractReviewChatInput";
import { useContractReviewChat } from "@/hooks/useContractReviewChat";
import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContractReviewChatProps {
  clientId: string;
}

const ContractReviewChat: React.FC<ContractReviewChatProps> = ({ clientId }) => {
  const {
    messages,
    isLoading,
    isLoadingHistory,
    handleSendMessage,
    formatTimestamp
  } = useContractReviewChat(clientId);
  
  const { toast } = useToast();

  const handleAddContract = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Contract upload functionality will be implemented soon.",
    });
  };

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="bg-[#4CAF50] text-white p-3">
          <h3 className="font-medium">Contract Review</h3>
          <div className="text-xs opacity-80">{formatTimestamp()}</div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-[250px] bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-[200px] bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
        <div className="h-14 w-full bg-gray-200 animate-pulse rounded-lg mt-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-400px)] min-h-[500px]">
      <div className="flex flex-col flex-grow overflow-hidden border rounded-lg">
        <div className="bg-[#4CAF50] text-white p-3 flex justify-between items-center">
          <div>
            <h3 className="font-medium">Contract Review</h3>
            <div className="text-xs opacity-80">{formatTimestamp()}</div>
          </div>
          <Button 
            onClick={handleAddContract} 
            size="sm" 
            variant="secondary" 
            className="bg-white text-[#4CAF50] font-medium hover:bg-gray-100"
          >
            <FilePlus className="h-4 w-4 mr-2" />
            Add Contract
          </Button>
        </div>
        
        <ContractReviewChatView 
          messages={messages} 
          isLoading={isLoading} 
        />
        
        <ContractReviewChatInput 
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ContractReviewChat;
