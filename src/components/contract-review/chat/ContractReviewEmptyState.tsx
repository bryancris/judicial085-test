
import React from "react";

const ContractReviewEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="max-w-sm">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Upload a Contract to Begin</h3>
        <p className="text-sm text-muted-foreground">
          Select the "Add Contract" button to upload a document for review.
        </p>
      </div>
    </div>
  );
};

export default ContractReviewEmptyState;
