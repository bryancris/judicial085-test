import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CaseStrengthAnalyzer, CaseStrengthMetrics } from "@/services/personalInjury/caseStrengthAnalyzer";
import { supabase } from "@/integrations/supabase/client";
import { PIIncidentData, PIMedicalData, PIFunctionalData, PIFinancialData } from "@/types/personalInjury";

export const useCaseStrengthAnalysis = (clientId?: string) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingDocuments, setIsAnalyzingDocuments] = useState(false);
  const [metrics, setMetrics] = useState<CaseStrengthMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [hasAnalysisData, setHasAnalysisData] = useState(false);
  const [analysisData, setAnalysisData] = useState<{
    incident: PIIncidentData | null;
    medical: PIMedicalData | null;
    functional: PIFunctionalData | null;
    financial: PIFinancialData | null;
  }>({
    incident: null,
    medical: null,
    functional: null,
    financial: null,
  });
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const { toast } = useToast();

  const analyzer = new CaseStrengthAnalyzer();

  const analyzeCase = async () => {
    if (!clientId) {
      setError("Client ID is required for analysis");
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log("🚀 Starting case strength analysis for client:", clientId);
      
      const analysisResult = await analyzer.analyzeCaseStrength(clientId);
      
      setMetrics(analysisResult);
      
      toast({
        title: "Analysis Complete",
        description: `Case strength: ${(analysisResult.overallStrength * 10).toFixed(1)}/10, Settlement range: $${analysisResult.settlementRangeLow.toLocaleString()} - $${analysisResult.settlementRangeHigh.toLocaleString()}`,
      });

      return analysisResult;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to analyze case strength";
      setError(errorMessage);
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeDocuments = async () => {
    if (!clientId) {
      setError("Client ID is required for document analysis");
      return false;
    }

    setIsAnalyzingDocuments(true);
    setError(null);

    try {
      console.log("🔬 Starting document analysis for client:", clientId);
      
      const { data, error } = await supabase.functions.invoke('analyze-pi-documents', {
        body: { clientId }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Document analysis failed');
      }

      toast({
        title: "Document Analysis Complete",
        description: `Processed ${data.results.medicalAnalyses} medical documents, ${data.results.legalAnalyses} legal documents, and extracted ${data.results.timelineEvents} timeline events.`,
      });

      // Check analysis data status after processing
      await checkAnalysisDataStatus();
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to analyze documents";
      setError(errorMessage);
      
      toast({
        title: "Document Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    } finally {
      setIsAnalyzingDocuments(false);
    }
  };

  const checkDocumentStatus = async () => {
    if (!clientId) return;

    try {
      // Check if client has document chunks
      const { data: chunks } = await supabase
        .from('document_chunks')
        .select('id')
        .eq('client_id', clientId)
        .limit(1);

      setHasDocuments((chunks?.length ?? 0) > 0);

      await checkAnalysisDataStatus();
    } catch (error) {
      console.error("Error checking document status:", error);
    }
  };

  const checkAnalysisDataStatus = async () => {
    if (!clientId) return;

    try {
      const [medicalData, timelineData, caseMetrics] = await Promise.all([
        supabase.from('medical_document_analyses').select('id').eq('client_id', clientId).limit(1),
        supabase.from('pi_timeline_events').select('id').eq('client_id', clientId).limit(1),
        supabase.from('pi_case_metrics').select('id').eq('client_id', clientId).limit(1)
      ]);

      // Analysis is complete only when ALL required components are present
      const hasCompleteAnalysis = 
        (medicalData.data?.length ?? 0) > 0 && 
        (timelineData.data?.length ?? 0) > 0 && 
        (caseMetrics.data?.length ?? 0) > 0;

      setHasAnalysisData(hasCompleteAnalysis);
    } catch (error) {
      console.error("Error checking analysis data status:", error);
    }
  };

  const loadExistingMetrics = async () => {
    if (!clientId) return;

    try {
      // Load all analysis data in parallel
      const [metricsResult, medicalResult, timelineResult] = await Promise.all([
        supabase
          .from('pi_case_metrics')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        
        supabase
          .from('medical_document_analyses')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('pi_timeline_events')
          .select('*')
          .eq('client_id', clientId)
          .order('event_date', { ascending: true })
      ]);

      // Transform metrics data
      if (metricsResult.data) {
        const existingMetrics = metricsResult.data;
        const transformedMetrics: CaseStrengthMetrics = {
          overallStrength: existingMetrics.case_strength_score || 0,
          settlementRangeLow: existingMetrics.settlement_range_low || 0,
          settlementRangeHigh: existingMetrics.settlement_range_high || 0,
          confidenceLevel: (existingMetrics.incident_data as any)?.confidence_level || 0,
          riskFactors: [],
          strengths: [],
          recommendations: []
        };
        setMetrics(transformedMetrics);
      }

      // Set timeline events with enhanced descriptions
      const enhancedEvents = (timelineResult.data || []).map((event: any) => {
        // Skip if already enhanced (has specific description)
        if (event.description !== 'Medical treatment') {
          return event;
        }
        
        // Find matching medical analysis to enhance description
        const matchingAnalysis = medicalResult.data?.find((analysis: any) => 
          analysis.document_id === event.source_document
        );
        
        if (matchingAnalysis?.extracted_data && typeof matchingAnalysis.extracted_data === 'object') {
          const extractedData = matchingAnalysis.extracted_data as any;
          if (extractedData.treatments?.length > 0) {
            return {
              ...event,
              description: extractedData.treatments[0] // Use the first treatment as enhanced description
            };
          }
        }
        
        return event;
      });
      
      setTimelineEvents(enhancedEvents);

      // Transform analysis data
      const transformedAnalysisData = {
        incident: transformTimelineToIncident(timelineResult.data || []),
        medical: transformMedicalAnalyses(medicalResult.data || []),
        functional: calculateFunctionalData(medicalResult.data || []),
        financial: calculateFinancialData(medicalResult.data || [])
      };

      setAnalysisData(transformedAnalysisData);
    } catch (error) {
      console.error("Error loading existing metrics:", error);
    }
  };

  const transformTimelineToIncident = (timelineEvents: any[]): PIIncidentData => {
    const incidentEvent = timelineEvents.find(event => 
      event.event_type === 'incident' || event.event_type === 'accident'
    );
    
    if (incidentEvent) {
      return {
        date: incidentEvent.event_date || 'Unknown',
        location: incidentEvent.event_details?.location || 'Unknown',
        type: incidentEvent.event_details?.incident_type || 'Personal Injury',
        description: incidentEvent.event_details?.description || incidentEvent.description || 'No description available',
        witnesses: incidentEvent.event_details?.witnesses || 0,
        policeReport: incidentEvent.event_details?.police_report || false,
        confidence: incidentEvent.confidence_score || 0.8
      };
    }

    return {
      date: 'Unknown',
      location: 'Unknown',
      type: 'Personal Injury',
      description: 'No incident details available',
      witnesses: 0,
      policeReport: false,
      confidence: 0.5
    };
  };

  const transformMedicalAnalyses = (medicalAnalyses: any[]): PIMedicalData => {
    if (medicalAnalyses.length === 0) {
      return {
        primaryInjuries: ['No medical data available'],
        treatmentProvider: 'Unknown',
        treatmentStatus: 'Pending',
        painLevel: 0,
        icd10Codes: [],
        nextAppointment: 'Not scheduled'
      };
    }

    const latestAnalysis = medicalAnalyses[0];
    const extractedData = latestAnalysis.extracted_data || {};
    
    return {
      primaryInjuries: extractedData.injuries || extractedData.primary_injuries || ['Not specified'],
      treatmentProvider: extractedData.provider || extractedData.treatment_provider || 'Unknown',
      treatmentStatus: extractedData.treatment_status || 'Ongoing',
      painLevel: extractedData.pain_level || 5,
      icd10Codes: extractedData.icd10_codes || extractedData.diagnosis_codes || [],
      nextAppointment: extractedData.next_appointment || 'Not scheduled'
    };
  };

  const calculateFunctionalData = (medicalAnalyses: any[]): PIFunctionalData => {
    if (medicalAnalyses.length === 0) {
      return {
        workCapacity: 50,
        dailyActivities: 50,
        prognosis: 'Unknown',
        restrictions: ['Assessment pending']
      };
    }

    const analysis = medicalAnalyses[0];
    const extractedData = analysis.extracted_data || {};
    
    return {
      workCapacity: extractedData.work_capacity || 70,
      dailyActivities: extractedData.daily_activities || 65,
      prognosis: extractedData.prognosis || 'Fair',
      restrictions: extractedData.restrictions || extractedData.limitations || ['Under evaluation']
    };
  };

  const calculateFinancialData = (medicalAnalyses: any[]): PIFinancialData => {
    if (medicalAnalyses.length === 0) {
      return {
        lostWages: 0,
        medicalCosts: 0,
        futureExpenses: 0,
        documentationStatus: 'Incomplete'
      };
    }

    const analysis = medicalAnalyses[0];
    const extractedData = analysis.extracted_data || {};
    
    return {
      lostWages: extractedData.lost_wages || 0,
      medicalCosts: extractedData.medical_costs || extractedData.treatment_costs || 0,
      futureExpenses: extractedData.future_expenses || 0,
      documentationStatus: medicalAnalyses.length > 1 ? 'Complete' : 'Partial'
    };
  };

  const clearResults = () => {
    setMetrics(null);
    setError(null);
  };

  return {
    analyzeCase,
    analyzeDocuments,
    checkDocumentStatus,
    loadExistingMetrics,
    clearResults,
    isAnalyzing,
    isAnalyzingDocuments,
    metrics,
    error,
    hasDocuments,
    hasAnalysisData,
    analysisData,
    timelineEvents,
    // Computed values for easy access
    caseStrength: metrics?.overallStrength ?? 0,
    settlementRange: metrics ? `$${metrics.settlementRangeLow.toLocaleString()} - $${metrics.settlementRangeHigh.toLocaleString()}` : null,
    confidenceLevel: metrics?.confidenceLevel ?? 0,
    riskCount: metrics?.riskFactors.length ?? 0,
    strengthCount: metrics?.strengths.length ?? 0,
    recommendationCount: metrics?.recommendations.length ?? 0
  };
};