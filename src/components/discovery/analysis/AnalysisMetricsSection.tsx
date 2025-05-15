
import React from 'react';

interface AnalysisMetricsSectionProps {
  requestType: string;
  requestCount: number;
  complexityScore: number;
}

const AnalysisMetricsSection: React.FC<AnalysisMetricsSectionProps> = ({
  requestType,
  requestCount,
  complexityScore
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-1 p-3 bg-blue-50/50 rounded-md">
        <p className="text-sm font-medium text-blue-700">Request Type</p>
        <p className="text-sm font-semibold">{requestType}</p>
      </div>
      <div className="space-y-1 p-3 bg-blue-50/50 rounded-md">
        <p className="text-sm font-medium text-blue-700">Request Count</p>
        <p className="text-sm font-semibold">{requestCount}</p>
      </div>
      <div className="space-y-1 p-3 bg-blue-50/50 rounded-md">
        <p className="text-sm font-medium text-blue-700">Complexity Score</p>
        <p className="text-sm font-semibold">{complexityScore}/10</p>
      </div>
    </div>
  );
};

export default AnalysisMetricsSection;
