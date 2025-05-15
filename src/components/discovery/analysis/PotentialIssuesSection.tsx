
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface PotentialIssuesSectionProps {
  issues: string[];
}

const PotentialIssuesSection: React.FC<PotentialIssuesSectionProps> = ({ issues }) => {
  if (issues.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Potential Issues</p>
        <p className="text-sm text-muted-foreground italic">No potential issues identified.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Potential Issues</p>
      <ul className="space-y-2">
        {issues.map((issue, index) => (
          <li key={index} className="flex items-start gap-2 bg-amber-50 p-2 rounded-md">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{issue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PotentialIssuesSection;
