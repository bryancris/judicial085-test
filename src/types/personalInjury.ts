export interface PIMetrics {
  caseStrength: number;
  settlementRangeLow: number;
  settlementRangeHigh: number;
  daysSinceIncident: number;
  medicalRecordCompletion: number;
}

export interface PIIncidentData {
  date: string;
  location: string;
  type: string;
  description: string;
  witnesses: number;
  policeReport: boolean;
  confidence: number;
}

export interface PIMedicalData {
  primaryInjuries: string[];
  treatmentProvider: string;
  treatmentStatus: string;
  painLevel: number;
  icd10Codes: string[];
  nextAppointment: string;
}

export interface PIFunctionalData {
  workCapacity: number;
  dailyActivities: number;
  prognosis: string;
  restrictions: string[];
}

export interface PIFinancialData {
  lostWages: number;
  medicalCosts: number;
  futureExpenses: number;
  documentationStatus: string;
}

export interface PIAnalysisData {
  metrics: PIMetrics;
  incident: PIIncidentData;
  medical: PIMedicalData;
  functional: PIFunctionalData;
  financial: PIFinancialData;
}