
import React from "react";

const ContractReviewEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="max-w-sm">
        <h3 className="text-lg font-medium text-green-700 mb-2">Get Started with Contract Review</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Upload documents through the <strong>Document Hub</strong> first, then return here to review them.
        </p>
        <p className="text-sm text-muted-foreground">
          Use <strong>"Select Documents"</strong> to review uploaded contracts or <strong>"Create"</strong> to generate new ones.
        </p>
      </div>
    </div>
  );
};

export default ContractReviewEmptyState;
