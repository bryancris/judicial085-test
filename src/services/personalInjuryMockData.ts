import { PIAnalysisData } from "@/types/personalInjury";

export const getMockPIData = (): PIAnalysisData => ({
  metrics: {
    caseStrength: 7.2,
    settlementRangeLow: 85000,
    settlementRangeHigh: 125000,
    daysSinceIncident: 127,
    medicalRecordCompletion: 85
  },
  incident: {
    date: "2024-05-15",
    location: "Main St & 5th Ave Intersection",
    type: "Motor Vehicle Accident",
    description: "Rear-end collision at traffic light. Client vehicle was stationary when struck by defendant's vehicle traveling approximately 25 mph.",
    witnesses: 2,
    policeReport: true,
    confidence: 8.5
  },
  medical: {
    primaryInjuries: ["Whiplash", "Lower Back Strain", "Cervical Sprain"],
    treatmentProvider: "Metro Physical Therapy",
    treatmentStatus: "Ongoing",
    painLevel: 6,
    icd10Codes: ["M54.2", "S13.4", "M62.838"],
    nextAppointment: "2024-09-25"
  },
  functional: {
    workCapacity: 65,
    dailyActivities: 70,
    prognosis: "Good with continued treatment",
    restrictions: ["No lifting >20 lbs", "Limited sitting", "Driving restrictions"]
  },
  financial: {
    lostWages: 8500,
    medicalCosts: 12750,
    futureExpenses: 5200,
    documentationStatus: "85% Complete"
  }
});