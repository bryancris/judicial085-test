
import React from "react";

const ContractReviewEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="bg-blue-50 rounded-lg p-6 max-w-md">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Texas Contract Review Assistant</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload a contract to get analysis based on Texas law standards.
        </p>
        
        <div className="text-sm text-left bg-white rounded-md p-4 border border-blue-100">
          <p className="font-medium mb-2">Our AI will check for:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Non-Texas choice of law provisions</li>
            <li>Overly broad security interests</li>
            <li>Excessive liquidated damages</li>
            <li>Unenforceable waivers of rights</li>
            <li>Invalid limitations of liability</li>
          </ul>
          
          <div className="mt-4 pt-3 border-t border-blue-100">
            <p className="text-xs font-medium mb-1">Our enhanced verification:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>All Texas statute citations are verified against our legal database</li>
              <li>Valid citations are highlighted in green</li>
              <li>Invalid citations are marked in red</li>
              <li>Analysis includes confidence scores based on citation accuracy</li>
            </ul>
          </div>
          
          <div className="mt-4 pt-3 border-t border-blue-100">
            <p className="text-xs text-muted-foreground">
              All analysis is provided with references to relevant Texas statutes and case law, 
              with issues prioritized by severity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractReviewEmptyState;
