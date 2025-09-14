import React from "react";
import PIMetricsHeader from "./PIMetricsHeader";
import PIIncidentOverview from "./PIIncidentOverview";
import PIMedicalStatus from "./PIMedicalStatus";
import PIFunctionalImpact from "./PIFunctionalImpact";
import PIFinancialImpact from "./PIFinancialImpact";
import { getMockPIData } from "@/services/personalInjuryMockData";

interface PIAnalysisContentProps {
  clientId: string;
  caseId?: string;
}

const PIAnalysisContent: React.FC<PIAnalysisContentProps> = ({ clientId, caseId }) => {
  // For now, using mock data. In production, this would fetch real data based on clientId/caseId
  const piData = getMockPIData();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Personal Injury Case Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive overview of case status and key metrics</p>
      </div>

      <PIMetricsHeader metrics={piData.metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PIIncidentOverview incident={piData.incident} />
        <PIMedicalStatus medical={piData.medical} />
        <PIFunctionalImpact functional={piData.functional} />
        <PIFinancialImpact financial={piData.financial} />
      </div>
    </div>
  );
};

export default PIAnalysisContent;