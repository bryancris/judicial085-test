
import React from "react";

const ContractReviewLoadingIndicator: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-2">
      <div className="flex space-x-2">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-bounce delay-75"></div>
        <div className="h-2 w-2 rounded-full bg-green-500 animate-bounce delay-100"></div>
        <div className="h-2 w-2 rounded-full bg-green-500 animate-bounce delay-150"></div>
      </div>
    </div>
  );
};

export default ContractReviewLoadingIndicator;
