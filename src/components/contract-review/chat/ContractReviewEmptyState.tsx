
import React from "react";

const ContractReviewEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <p className="text-muted-foreground mb-2">No messages yet.</p>
      <p className="text-sm text-muted-foreground">
        Upload a contract and start discussing it with the AI assistant to get legal insights and advice.
      </p>
    </div>
  );
};

export default ContractReviewEmptyState;
