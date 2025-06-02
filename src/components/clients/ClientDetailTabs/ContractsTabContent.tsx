
import React from "react";
import ContractReviewChat from "@/components/contract-review/ContractReviewChat";

interface ContractsTabContentProps {
  clientId: string;
}

const ContractsTabContent: React.FC<ContractsTabContentProps> = ({ clientId }) => {
  return (
    <ContractReviewChat 
      clientId={clientId}
    />
  );
};

export default ContractsTabContent;
