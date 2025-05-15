
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle } from 'lucide-react';
import { DiscoveryAnalysisResult } from '@/types/discovery';

interface DiscoveryAnalysisCardProps {
  analysis: DiscoveryAnalysisResult;
}

const DiscoveryAnalysisCard: React.FC<DiscoveryAnalysisCardProps> = ({ analysis }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Request Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Request Type</p>
            <p className="text-sm">{analysis.requestType}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Request Count</p>
            <p className="text-sm">{analysis.requestCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Complexity Score</p>
            <p className="text-sm">{analysis.complexityScore}/10</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Potential Issues</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            {analysis.potentialIssues.map((issue, index) => (
              <li key={index} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Suggested Approach</p>
          <p className="text-sm">{analysis.suggestedApproach}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscoveryAnalysisCard;
