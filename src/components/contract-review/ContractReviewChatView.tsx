
import React, { useEffect, useRef } from "react";
import ContractReviewMessageItem from "./ContractReviewMessageItem";
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
    <div className="flex-grow overflow-y-auto p-4 bg-background/70">
      {messages.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-muted-foreground mb-2">No messages yet.</p>
          <p className="text-sm text-muted-foreground">
            Upload a contract and start discussing it with the AI assistant to get legal insights and advice.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message, index) => (
            <ContractReviewMessageItem
              key={message.id || index}
              message={message}
            />
          ))}
          {isLoading && (
            <div className="flex justify-center items-center py-2">
              <div className="flex space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-bounce delay-75"></div>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-bounce delay-100"></div>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-bounce delay-150"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}></div>
        </div>
      )}
    </div>
  );
};

export default ContractReviewChatView;
