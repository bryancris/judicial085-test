import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PIMetrics } from "@/types/personalInjury";

interface PIMetricsHeaderProps {
  metrics: PIMetrics;
}

const PIMetricsHeader: React.FC<PIMetricsHeaderProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Case Strength</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-primary">{metrics.caseStrength}</span>
              <span className="text-sm text-muted-foreground">/10</span>
            </div>
            <Progress value={metrics.caseStrength * 10} className="mt-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Settlement Range</span>
            <div className="mt-1">
              <span className="text-lg font-bold text-green-600">
                ${(metrics.settlementRangeLow / 1000).toFixed(0)}K - ${(metrics.settlementRangeHigh / 1000).toFixed(0)}K
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Days Since Incident</span>
            <div className="mt-1">
              <span className="text-2xl font-bold text-foreground">{metrics.daysSinceIncident}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Medical Records</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground">{metrics.medicalRecordCompletion}%</span>
            </div>
            <Progress value={metrics.medicalRecordCompletion} className="mt-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PIMetricsHeader;