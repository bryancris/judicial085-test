
import React from "react";
import ContractReviewMessageItem from "./ContractReviewMessageItem";
import { ContractReviewMessage } from "@/utils/contractReviewService";

interface ContractReviewMessageListProps {
  messages: ContractReviewMessage[];
}

const ContractReviewMessageList: React.FC<ContractReviewMessageListProps> = ({ 
  messages 
}) => {
  return (
    <>
      {messages.map((message, index) => (
        <ContractReviewMessageItem
          key={message.id || index}
          message={message}
        />
      ))}
    </>
  );
};

export default ContractReviewMessageList;
