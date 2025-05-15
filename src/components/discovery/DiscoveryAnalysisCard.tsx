
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DiscoveryAnalysisResult } from '@/types/discovery';
import AnalysisMetricsSection from './analysis/AnalysisMetricsSection';
import PotentialIssuesSection from './analysis/PotentialIssuesSection';
import ApproachSection from './analysis/ApproachSection';

interface DiscoveryAnalysisCardProps {
  analysis: DiscoveryAnalysisResult;
}

const DiscoveryAnalysisCard: React.FC<DiscoveryAnalysisCardProps> = ({ analysis }) => {
  return (
    <Card className="border border-blue-100 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
        <CardTitle className="text-xl">Request Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <AnalysisMetricsSection 
          requestType={analysis.requestType}
          requestCount={analysis.requestCount}
          complexityScore={analysis.complexityScore}
        />
        
        <Separator className="my-2" />
        
        <PotentialIssuesSection issues={analysis.potentialIssues} />
        
        <Separator className="my-2" />
        
        <ApproachSection suggestedApproach={analysis.suggestedApproach} />
      </CardContent>
    </Card>
  );
};

export default DiscoveryAnalysisCard;
