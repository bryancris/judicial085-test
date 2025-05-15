
import React from 'react';

interface ApproachSectionProps {
  suggestedApproach: string;
}

const ApproachSection: React.FC<ApproachSectionProps> = ({ suggestedApproach }) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Suggested Approach</p>
      <div className="bg-green-50/50 p-3 rounded-md">
        <p className="text-sm">{suggestedApproach}</p>
      </div>
    </div>
  );
};

export default ApproachSection;
