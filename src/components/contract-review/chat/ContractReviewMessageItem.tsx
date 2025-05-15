
import React from "react";
import { ContractReviewMessage } from "@/utils/contractReviewService";
import ContractReviewMessageAvatar from "./ContractReviewMessageAvatar";
import ContractReviewMessageContent from "./ContractReviewMessageContent";
import { cn } from "@/lib/utils";

interface ContractReviewMessageItemProps {
  message: ContractReviewMessage;
}

const ContractReviewMessageItem: React.FC<ContractReviewMessageItemProps> = ({ message }) => {
  const isAttorney = message.role === "attorney";
  
  return (
    <div
      className={cn(
        "flex items-start gap-3 group",
        isAttorney ? "flex-row-reverse" : "",
      )}
    >
      <ContractReviewMessageAvatar isAttorney={isAttorney} />
      <ContractReviewMessageContent message={message} isAttorney={isAttorney} />
    </div>
  );
};

export default ContractReviewMessageItem;
