import { supabase } from "@/integrations/supabase/client";

export interface CaseStrengthMetrics {
  overallStrength: number; // 0-1 scale
  settlementRangeLow: number;
  settlementRangeHigh: number;
  confidenceLevel: number; // 0-1 scale
  riskFactors: string[];
  strengths: string[];
  recommendations: string[];
}

export interface LegalElementScore {
  duty: number;
  breach: number;
  causation: number;
  damages: number;
  overall: number;
}

export interface EvidenceQuality {
  medicalDocumentation: number;
  legalDocumentation: number;
  timelineCompleteness: number;
  credibilityScore: number;
}

export class CaseStrengthAnalyzer {
  
  async analyzeCaseStrength(clientId: string): Promise<CaseStrengthMetrics> {
    console.log("🔍 Starting comprehensive case strength analysis for client:", clientId);

    // Gather all analysis data
    const [medicalAnalyses, legalAnalyses, timelineEvents] = await Promise.all([
      this.getMedicalAnalyses(clientId),
      this.getLegalAnalyses(clientId),
      this.getTimelineEvents(clientId)
    ]);

    console.log(`📊 Analysis data gathered: ${medicalAnalyses.length} medical, ${legalAnalyses.length} legal, ${timelineEvents.length} timeline events`);

    // Calculate component scores
    const legalElementScores = this.calculateLegalElementScores(legalAnalyses);
    const evidenceQuality = this.assessEvidenceQuality(medicalAnalyses, legalAnalyses, timelineEvents);
    const timelineScore = this.calculateTimelineScore(timelineEvents);

    // Calculate overall case strength
    const overallStrength = this.calculateOverallStrength(
      legalElementScores,
      evidenceQuality,
      timelineScore
    );

    // Generate settlement range based on damages and case strength
    const settlementRange = this.calculateSettlementRange(
      medicalAnalyses,
      legalAnalyses,
      overallStrength
    );

    // Identify risks and strengths
    const riskAssessment = this.assessRisksAndStrengths(
      legalElementScores,
      evidenceQuality,
      medicalAnalyses,
      legalAnalyses
    );

    const metrics: CaseStrengthMetrics = {
      overallStrength,
      settlementRangeLow: settlementRange.low,
      settlementRangeHigh: settlementRange.high,
      confidenceLevel: this.calculateConfidenceLevel(evidenceQuality, timelineScore),
      riskFactors: riskAssessment.risks,
      strengths: riskAssessment.strengths,
      recommendations: this.generateRecommendations(legalElementScores, evidenceQuality, riskAssessment)
    };

    // Save metrics to database
    await this.saveCaseMetrics(clientId, metrics, legalElementScores, evidenceQuality);

    console.log("✅ Case strength analysis complete:", {
      strength: overallStrength.toFixed(2),
      settlement: `$${settlementRange.low.toLocaleString()} - $${settlementRange.high.toLocaleString()}`,
      confidence: (metrics.confidenceLevel * 100).toFixed(1) + '%'
    });

    return metrics;
  }

  private async getMedicalAnalyses(clientId: string) {
    const { data, error } = await supabase
      .from('medical_document_analyses')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) {
      console.error("Error fetching medical analyses:", error);
      return [];
    }
    return data || [];
  }

  private async getLegalAnalyses(clientId: string) {
    const { data, error } = await supabase
      .from('legal_document_analyses')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) {
      console.error("Error fetching legal analyses:", error);
      return [];
    }
    return data || [];
  }

  private async getTimelineEvents(clientId: string) {
    const { data, error } = await supabase
      .from('pi_timeline_events')
      .select('*')
      .eq('client_id', clientId)
      .order('event_date', { ascending: true });
    
    if (error) {
      console.error("Error fetching timeline events:", error);
      return [];
    }
    return data || [];
  }

  private calculateLegalElementScores(legalAnalyses: any[]): LegalElementScore {
    if (legalAnalyses.length === 0) {
      return { duty: 0, breach: 0, causation: 0, damages: 0, overall: 0 };
    }

    let dutyScore = 0;
    let breachScore = 0;
    let causationScore = 0;
    let damagesScore = 0;

    legalAnalyses.forEach(analysis => {
      const elements = analysis.legal_elements || [];
      
      // Score each legal element based on evidence strength
      elements.forEach((element: any) => {
        const confidence = element.confidence || 0;
        const evidenceStrength = element.evidence_strength || 0;
        const elementScore = (confidence + evidenceStrength) / 2;

        switch (element.element_type?.toLowerCase()) {
          case 'duty':
            dutyScore = Math.max(dutyScore, elementScore);
            break;
          case 'breach':
            breachScore = Math.max(breachScore, elementScore);
            break;
          case 'causation':
          case 'proximate_cause':
          case 'factual_causation':
            causationScore = Math.max(causationScore, elementScore);
            break;
          case 'damages':
            damagesScore = Math.max(damagesScore, elementScore);
            break;
        }
      });
    });

    const overall = (dutyScore + breachScore + causationScore + damagesScore) / 4;

    return {
      duty: dutyScore,
      breach: breachScore,
      causation: causationScore,
      damages: damagesScore,
      overall
    };
  }

  private assessEvidenceQuality(medicalAnalyses: any[], legalAnalyses: any[], timelineEvents: any[]): EvidenceQuality {
    // Medical documentation quality
    const avgMedicalAuth = medicalAnalyses.length > 0 
      ? medicalAnalyses.reduce((sum, analysis) => sum + (analysis.authenticity_score || 0), 0) / medicalAnalyses.length
      : 0;

    // Legal documentation credibility
    const avgLegalCred = legalAnalyses.length > 0
      ? legalAnalyses.reduce((sum, analysis) => sum + (analysis.source_credibility || 0), 0) / legalAnalyses.length
      : 0;

    // Timeline completeness based on reliability scores
    const avgReliability = timelineEvents.length > 0
      ? timelineEvents.reduce((sum, event) => sum + (event.reliability_score || 0), 0) / timelineEvents.length
      : 0;

    // Overall credibility score combining all factors
    const credibilityScore = (avgMedicalAuth + avgLegalCred + avgReliability) / 3;

    return {
      medicalDocumentation: avgMedicalAuth,
      legalDocumentation: avgLegalCred,
      timelineCompleteness: avgReliability,
      credibilityScore
    };
  }

  private calculateTimelineScore(timelineEvents: any[]): number {
    if (timelineEvents.length === 0) return 0;

    // Calculate timeline completeness and coherence
    const avgReliability = timelineEvents.reduce((sum, event) => sum + (event.reliability_score || 0), 0) / timelineEvents.length;
    
    // Bonus for having key injury-related events
    const hasInjuryEvent = timelineEvents.some(e => e.event_type === 'injury');
    const hasTreatmentEvents = timelineEvents.some(e => e.event_type === 'treatment');
    const hasDiagnosisEvents = timelineEvents.some(e => e.event_type === 'diagnosis');
    
    const completenessBonus = (hasInjuryEvent ? 0.1 : 0) + (hasTreatmentEvents ? 0.1 : 0) + (hasDiagnosisEvents ? 0.1 : 0);
    
    return Math.min(1.0, avgReliability + completenessBonus);
  }

  private calculateOverallStrength(
    legalElements: LegalElementScore,
    evidenceQuality: EvidenceQuality,
    timelineScore: number
  ): number {
    // Weighted scoring system
    const legalElementWeight = 0.4; // 40% - most important
    const evidenceQualityWeight = 0.4; // 40% - evidence strength
    const timelineWeight = 0.2; // 20% - supporting factor

    const overallStrength = (
      legalElements.overall * legalElementWeight +
      evidenceQuality.credibilityScore * evidenceQualityWeight +
      timelineScore * timelineWeight
    );

    return Math.min(1.0, Math.max(0, overallStrength));
  }

  private calculateSettlementRange(
    medicalAnalyses: any[],
    legalAnalyses: any[],
    caseStrength: number
  ): { low: number; high: number } {
    // Calculate base damages from medical costs
    let medicalCosts = 0;
    medicalAnalyses.forEach(analysis => {
      const extractedData = analysis.extracted_data || {};
      if (extractedData.estimated_costs) {
        medicalCosts += extractedData.estimated_costs;
      }
    });

    // Estimate economic damages base
    const baseDamages = Math.max(medicalCosts, 10000); // Minimum base

    // Apply multipliers based on case strength and injury type
    const strengthMultiplier = 1 + (caseStrength * 3); // 1x to 4x based on strength
    const painSufferingMultiplier = 2 + (caseStrength * 2); // 2x to 4x for pain/suffering

    // Calculate conservative and optimistic ranges
    const conservativeSettlement = baseDamages * strengthMultiplier;
    const optimisticSettlement = baseDamages * (strengthMultiplier + painSufferingMultiplier);

    return {
      low: Math.round(conservativeSettlement),
      high: Math.round(optimisticSettlement)
    };
  }

  private calculateConfidenceLevel(evidenceQuality: EvidenceQuality, timelineScore: number): number {
    // Higher confidence with better evidence and complete timeline
    return (evidenceQuality.credibilityScore * 0.7) + (timelineScore * 0.3);
  }

  private assessRisksAndStrengths(
    legalElements: LegalElementScore,
    evidenceQuality: EvidenceQuality,
    medicalAnalyses: any[],
    legalAnalyses: any[]
  ): { risks: string[]; strengths: string[] } {
    const risks: string[] = [];
    const strengths: string[] = [];

    // Legal element analysis
    if (legalElements.duty < 0.6) risks.push("Duty element needs strengthening");
    else strengths.push("Clear duty of care established");

    if (legalElements.breach < 0.6) risks.push("Breach of duty requires more evidence");
    else strengths.push("Strong evidence of breach");

    if (legalElements.causation < 0.6) risks.push("Causation link needs reinforcement");
    else strengths.push("Well-established causation");

    if (legalElements.damages < 0.6) risks.push("Damages documentation incomplete");
    else strengths.push("Comprehensive damages documentation");

    // Evidence quality analysis
    if (evidenceQuality.medicalDocumentation < 0.7) {
      risks.push("Medical documentation needs improvement");
    } else {
      strengths.push("Excellent medical documentation");
    }

    if (evidenceQuality.legalDocumentation < 0.7) {
      risks.push("Additional legal documentation required");
    } else {
      strengths.push("Strong legal documentation");
    }

    // Specific analysis insights
    legalAnalyses.forEach(analysis => {
      const caseStrength = analysis.case_strength || {};
      if (caseStrength.weaknesses) {
        caseStrength.weaknesses.forEach((weakness: string) => {
          if (!risks.includes(weakness)) risks.push(weakness);
        });
      }
      if (caseStrength.strengths) {
        caseStrength.strengths.forEach((strength: string) => {
          if (!strengths.includes(strength)) strengths.push(strength);
        });
      }
    });

    return { risks, strengths };
  }

  private generateRecommendations(
    legalElements: LegalElementScore,
    evidenceQuality: EvidenceQuality,
    riskAssessment: { risks: string[]; strengths: string[] }
  ): string[] {
    const recommendations: string[] = [];

    // Legal element recommendations
    if (legalElements.duty < 0.7) {
      recommendations.push("Obtain expert testimony to establish duty of care");
    }
    if (legalElements.breach < 0.7) {
      recommendations.push("Gather additional evidence of standard of care breach");
    }
    if (legalElements.causation < 0.7) {
      recommendations.push("Secure medical expert opinion on causation");
    }
    if (legalElements.damages < 0.7) {
      recommendations.push("Complete economic damages analysis with documentation");
    }

    // Evidence quality recommendations
    if (evidenceQuality.medicalDocumentation < 0.8) {
      recommendations.push("Request additional medical records from all treating providers");
    }
    if (evidenceQuality.legalDocumentation < 0.8) {
      recommendations.push("Obtain witness statements and incident reports");
    }

    // Strategic recommendations based on case strength
    const overallStrength = legalElements.overall;
    if (overallStrength > 0.8) {
      recommendations.push("Strong case - consider aggressive settlement negotiations");
    } else if (overallStrength > 0.6) {
      recommendations.push("Good case foundation - continue evidence development");
    } else {
      recommendations.push("Focus on strengthening weak legal elements before proceeding");
    }

    return recommendations;
  }

  private async saveCaseMetrics(
    clientId: string,
    metrics: CaseStrengthMetrics,
    legalElements: LegalElementScore,
    evidenceQuality: EvidenceQuality
  ) {
    const metricsData = {
      client_id: clientId,
      case_strength_score: metrics.overallStrength,
      settlement_range_low: metrics.settlementRangeLow,
      settlement_range_high: metrics.settlementRangeHigh,
      medical_record_completion: evidenceQuality.medicalDocumentation,
      incident_data: JSON.parse(JSON.stringify({
        legal_elements: legalElements,
        evidence_quality: evidenceQuality,
        confidence_level: metrics.confidenceLevel
      })),
      financial_data: JSON.parse(JSON.stringify({
        settlement_low: metrics.settlementRangeLow,
        settlement_high: metrics.settlementRangeHigh,
        confidence: metrics.confidenceLevel
      })),
      last_updated: new Date().toISOString()
    };

    const { error } = await supabase
      .from('pi_case_metrics')
      .upsert(metricsData, { onConflict: 'client_id' });

    if (error) {
      console.error("Error saving case metrics:", error);
    } else {
      console.log("✅ Case metrics saved to database");
    }
  }
}