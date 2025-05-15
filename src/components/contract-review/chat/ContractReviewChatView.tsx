
import React, { useEffect, useRef } from "react";
import ContractReviewMessageList from "./ContractReviewMessageList";
import ContractReviewEmptyState from "./ContractReviewEmptyState";
import ContractReviewLoadingIndicator from "./ContractReviewLoadingIndicator";
import { ContractReviewMessage } from "@/utils/contractReviewService";

interface ContractReviewChatViewProps {
  messages: ContractReviewMessage[];
  isLoading: boolean;
}

const ContractReviewChatView: React.FC<ContractReviewChatViewProps> = ({ 
  messages, 
  isLoading 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-grow overflow-y-auto p-4 bg-background/70 h-full">
      {messages.length === 0 && !isLoading ? (
        <ContractReviewEmptyState />
      ) : (
        <div className="space-y-4">
          <ContractReviewMessageList messages={messages} />
          {isLoading && <ContractReviewLoadingIndicator />}
          <div ref={messagesEndRef}></div>
        </div>
      )}
    </div>
  );
};

export default ContractReviewChatView;
