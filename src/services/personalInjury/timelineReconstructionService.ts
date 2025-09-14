import { supabase } from "@/integrations/supabase/client";

// Interface for timeline reconstruction based on attorney thinking algorithm
export interface TimelineEvent {
  event_date: string;
  event_type: 'injury' | 'treatment' | 'diagnosis' | 'medication' | 'therapy' | 'imaging' | 'legal_milestone';
  description: string;
  provider?: string;
  reliability_score: number;
  source_document: string;
  source_type: 'medical' | 'legal' | 'manual_entry';
  cross_referenced: boolean;
  consistency_score: number;
}

// Interface for timeline analysis results
export interface TimelineAnalysisResult {
  events: TimelineEvent[];
  gaps_identified: string[];
  inconsistencies: string[];
  reliability_assessment: {
    overall_score: number;
    high_confidence_events: number;
    low_confidence_events: number;
    total_events: number;
  };
  recommendations: string[];
}

export class TimelineReconstructionService {
  
  /**
   * Main timeline reconstruction method implementing attorney thinking principles
   * Apply deliberate questioning and cross-examination to verify chronological consistency
   */
  async reconstructTimeline(clientId: string): Promise<TimelineAnalysisResult> {
    console.log('📅 Reconstructing timeline with attorney reasoning algorithm');
    
    try {
      // Step 1: Gather all timeline events from medical and legal analyses
      const allEvents = await this.gatherAllTimelineEvents(clientId);
      
      // Step 2: Apply healthy skepticism to assess event reliability
      const verifiedEvents = this.assessEventReliability(allEvents);
      
      // Step 3: Cross-reference events for consistency (Cross-examination mindset)
      const crossReferencedEvents = this.crossReferenceEvents(verifiedEvents);
      
      // Step 4: Identify gaps and inconsistencies (Evidence-based reasoning)
      const gapsAndInconsistencies = this.identifyGapsAndInconsistencies(crossReferencedEvents);
      
      // Step 5: Generate reliability assessment
      const reliabilityAssessment = this.generateReliabilityAssessment(crossReferencedEvents);
      
      // Step 6: Apply zealous advocacy to recommend next steps
      const recommendations = this.generateZealousRecommendations(crossReferencedEvents, gapsAndInconsistencies);
      
      // Step 7: Store timeline analysis results
      await this.storeTimelineEvents(clientId, crossReferencedEvents);
      
      return {
        events: crossReferencedEvents,
        gaps_identified: gapsAndInconsistencies.gaps,
        inconsistencies: gapsAndInconsistencies.inconsistencies,
        reliability_assessment: reliabilityAssessment,
        recommendations
      };
      
    } catch (error) {
      console.error('Error reconstructing timeline:', error);
      throw error;
    }
  }

  /**
   * Step 1: Gather all timeline events from multiple sources
   * Apply information gathering and categorization principles
   */
  private async gatherAllTimelineEvents(clientId: string): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];
    
    try {
      // Get events from medical document analyses
      const { data: medicalAnalyses } = await (supabase as any)
        .from('medical_document_analyses')
        .select('*')
        .eq('client_id', clientId);

      if (medicalAnalyses) {
        medicalAnalyses.forEach((analysis: any) => {
          if (analysis.timeline_events && Array.isArray(analysis.timeline_events)) {
            analysis.timeline_events.forEach((event: any) => {
              events.push({
                event_date: event.date,
                event_type: event.event_type,
                description: event.description,
                provider: event.provider,
                reliability_score: event.reliability_score || 0.5,
                source_document: analysis.document_id,
                source_type: 'medical',
                cross_referenced: false,
                consistency_score: 0.5
              });
            });
          }
        });
      }

      // Get events from legal document analyses
      const { data: legalAnalyses } = await (supabase as any)
        .from('legal_document_analyses')
        .select('*')
        .eq('client_id', clientId);

      if (legalAnalyses) {
        legalAnalyses.forEach((analysis: any) => {
          // Extract timeline events from legal analyses
          const legalEvents = this.extractLegalTimelineEvents(analysis);
          events.push(...legalEvents);
        });
      }

      // Get manually entered timeline events
      const { data: manualEvents } = await (supabase as any)
        .from('pi_timeline_events')
        .select('*')
        .eq('client_id', clientId);

      if (manualEvents) {
        manualEvents.forEach((event: any) => {
          events.push({
            event_date: event.event_date,
            event_type: event.event_type,
            description: event.description,
            provider: event.provider,
            reliability_score: event.reliability_score,
            source_document: event.source_document || 'manual_entry',
            source_type: event.source_type,
            cross_referenced: false,
            consistency_score: 0.5
          });
        });
      }

      // Sort events by date
      return events.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
      
    } catch (error) {
      console.error('Error gathering timeline events:', error);
      return [];
    }
  }

  /**
   * Extract timeline events from legal document analysis
   */
  private extractLegalTimelineEvents(analysis: any): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    
    // Look for incident date in legal analysis
    if (analysis.information_classification?.facts) {
      analysis.information_classification.facts.forEach((fact: string) => {
        const dateMatch = fact.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
          // Determine event type based on content
          let eventType: TimelineEvent['event_type'] = 'legal_milestone';
          
          if (/injury|accident|incident/i.test(fact)) {
            eventType = 'injury';
          }
          
          events.push({
            event_date: dateMatch[0],
            event_type: eventType,
            description: fact,
            reliability_score: this.assessFactReliability(fact),
            source_document: analysis.document_id,
            source_type: 'legal',
            cross_referenced: false,
            consistency_score: 0.5
          });
        }
      });
    }
    
    return events;
  }

  /**
   * Step 2: Assess event reliability using healthy skepticism
   * Internal narrative: "Is that supported by reliable evidence?"
   */
  private assessEventReliability(events: TimelineEvent[]): TimelineEvent[] {
    return events.map(event => {
      let adjustedReliability = event.reliability_score;
      
      // Apply healthy skepticism principles
      
      // Reduce reliability for vague descriptions
      if (this.isVagueDescription(event.description)) {
        adjustedReliability *= 0.8;
      }
      
      // Increase reliability for specific medical details
      if (this.hasSpecificMedicalDetails(event.description)) {
        adjustedReliability *= 1.2;
      }
      
      // Reduce reliability for second-hand reporting (hearsay detection)
      if (this.isHearsayEvent(event.description)) {
        adjustedReliability *= 0.7;
      }
      
      // Increase reliability for official sources
      if (event.source_type === 'medical' && event.provider) {
        adjustedReliability *= 1.1;
      }
      
      return {
        ...event,
        reliability_score: Math.max(0.1, Math.min(1.0, adjustedReliability))
      };
    });
  }

  /**
   * Step 3: Cross-reference events for consistency (Cross-examination mindset)
   * Test credibility through questioning and look for inconsistencies
   */
  private crossReferenceEvents(events: TimelineEvent[]): TimelineEvent[] {
    const crossReferencedEvents = [...events];
    
    // Cross-reference similar events
    for (let i = 0; i < crossReferencedEvents.length; i++) {
      const event = crossReferencedEvents[i];
      let consistencyScore = 0.5;
      let crossReferenceCount = 0;
      
      // Look for related events within reasonable timeframe
      const relatedEvents = crossReferencedEvents.filter((otherEvent, index) => {
        if (index === i) return false;
        
        const daysDifference = Math.abs(
          new Date(event.event_date).getTime() - new Date(otherEvent.event_date).getTime()
        ) / (1000 * 60 * 60 * 24);
        
        // Events within 7 days and similar type or description
        return daysDifference <= 7 && (
          otherEvent.event_type === event.event_type ||
          this.isRelatedDescription(event.description, otherEvent.description)
        );
      });
      
      if (relatedEvents.length > 0) {
        crossReferenceCount = relatedEvents.length;
        
        // Increase consistency score based on corroborating evidence
        consistencyScore = Math.min(1.0, 0.5 + (crossReferenceCount * 0.2));
        
        // Check for contradictions
        const hasContradictions = relatedEvents.some(relatedEvent => 
          this.hasContradictoryInformation(event, relatedEvent)
        );
        
        if (hasContradictions) {
          consistencyScore *= 0.6;
        }
      }
      
      crossReferencedEvents[i] = {
        ...event,
        cross_referenced: crossReferenceCount > 0,
        consistency_score: consistencyScore
      };
    }
    
    return crossReferencedEvents;
  }

  /**
   * Step 4: Identify gaps and inconsistencies (Evidence-based reasoning)
   */
  private identifyGapsAndInconsistencies(events: TimelineEvent[]): {
    gaps: string[];
    inconsistencies: string[];
  } {
    const gaps: string[] = [];
    const inconsistencies: string[] = [];
    
    // Identify chronological gaps
    for (let i = 1; i < events.length; i++) {
      const prevEvent = events[i - 1];
      const currentEvent = events[i];
      
      const daysBetween = (new Date(currentEvent.event_date).getTime() - new Date(prevEvent.event_date).getTime()) / (1000 * 60 * 60 * 24);
      
      // Flag significant gaps in medical treatment
      if (prevEvent.event_type === 'injury' && daysBetween > 30 && currentEvent.event_type === 'treatment') {
        gaps.push(`Significant gap (${Math.round(daysBetween)} days) between injury on ${prevEvent.event_date} and first treatment on ${currentEvent.event_date}`);
      }
      
      // Flag treatment gaps
      if (prevEvent.event_type === 'treatment' && daysBetween > 60 && currentEvent.event_type === 'treatment') {
        gaps.push(`Treatment gap of ${Math.round(daysBetween)} days between ${prevEvent.event_date} and ${currentEvent.event_date}`);
      }
    }
    
    // Identify inconsistencies
    events.forEach((event, index) => {
      if (event.consistency_score < 0.4) {
        inconsistencies.push(`Low consistency score (${event.consistency_score.toFixed(2)}) for event on ${event.event_date}: ${event.description}`);
      }
      
      if (event.reliability_score < 0.3) {
        inconsistencies.push(`Low reliability score (${event.reliability_score.toFixed(2)}) for event on ${event.event_date}: ${event.description}`);
      }
    });
    
    // Check for logical inconsistencies
    const injuryEvents = events.filter(e => e.event_type === 'injury');
    if (injuryEvents.length > 1) {
      inconsistencies.push(`Multiple injury dates reported: ${injuryEvents.map(e => e.event_date).join(', ')}`);
    }
    
    return { gaps, inconsistencies };
  }

  /**
   * Step 5: Generate reliability assessment
   */
  private generateReliabilityAssessment(events: TimelineEvent[]) {
    const totalEvents = events.length;
    const highConfidenceEvents = events.filter(e => e.reliability_score >= 0.8 && e.consistency_score >= 0.7).length;
    const lowConfidenceEvents = events.filter(e => e.reliability_score < 0.5 || e.consistency_score < 0.5).length;
    
    const overallScore = totalEvents > 0 
      ? events.reduce((sum, event) => sum + (event.reliability_score * event.consistency_score), 0) / totalEvents
      : 0;
    
    return {
      overall_score: overallScore,
      high_confidence_events: highConfidenceEvents,
      low_confidence_events: lowConfidenceEvents,
      total_events: totalEvents
    };
  }

  /**
   * Step 6: Generate zealous advocacy recommendations
   * Ensure entire devotion to client's interest within ethical boundaries
   */
  private generateZealousRecommendations(events: TimelineEvent[], gapsAndInconsistencies: any): string[] {
    const recommendations: string[] = [];
    
    // Address evidence gaps with zealous advocacy
    if (gapsAndInconsistencies.gaps.length > 0) {
      recommendations.push("Aggressively pursue medical records to fill treatment gaps - every day of delay weakens case");
      recommendations.push("Subpoena all healthcare provider records to establish complete treatment timeline");
    }
    
    // Address inconsistencies
    if (gapsAndInconsistencies.inconsistencies.length > 0) {
      recommendations.push("Thoroughly investigate and resolve timeline inconsistencies before discovery");
      recommendations.push("Prepare explanations for any unavoidable discrepancies in documentation");
    }
    
    // Strengthen evidence collection
    const lowReliabilityEvents = events.filter(e => e.reliability_score < 0.6);
    if (lowReliabilityEvents.length > 0) {
      recommendations.push("Obtain corroborating evidence for all low-reliability timeline events");
      recommendations.push("Interview witnesses to verify critical timeline elements");
    }
    
    // Strategic recommendations
    if (events.some(e => e.event_type === 'injury')) {
      recommendations.push("Document pre-injury health status to establish baseline for damages");
      recommendations.push("Obtain expert medical testimony to connect all treatment to original injury");
    }
    
    // Ethical compliance
    recommendations.push("Ensure all timeline evidence is accurately represented and not exaggerated");
    recommendations.push("Maintain attorney-client privilege for all timeline discussions");
    
    return recommendations;
  }

  /**
   * Step 7: Store timeline events in database
   */
  private async storeTimelineEvents(clientId: string, events: TimelineEvent[]) {
    try {
      // Clear existing timeline events for this client
      await (supabase as any)
        .from('pi_timeline_events')
        .delete()
        .eq('client_id', clientId)
        .eq('source_type', 'manual_entry');
      
      // Insert new timeline events
      const timelineEvents = events.map(event => ({
        client_id: clientId,
        event_date: event.event_date,
        event_type: event.event_type,
        description: event.description,
        provider: event.provider,
        reliability_score: event.reliability_score,
        source_document: event.source_document,
        source_type: event.source_type
      }));
      
      if (timelineEvents.length > 0) {
        const { error } = await (supabase as any)
          .from('pi_timeline_events')
          .insert(timelineEvents);
        
        if (error) throw error;
      }
      
      console.log('✅ Timeline events stored successfully');
    } catch (error) {
      console.error('Error storing timeline events:', error);
      throw error;
    }
  }

  // Helper methods implementing attorney thinking principles

  private isVagueDescription(description: string): boolean {
    const vagueTerms = [
      'approximately', 'around', 'about', 'maybe', 'possibly',
      'some time', 'later', 'eventually', 'soon'
    ];
    
    return vagueTerms.some(term => description.toLowerCase().includes(term));
  }

  private hasSpecificMedicalDetails(description: string): boolean {
    const specificIndicators = [
      /\d+\s*(mg|ml|cc|units)/i,
      /\d+:\d{2}\s*(am|pm)/i,
      /Dr\.\s+\w+/i,
      /\b[A-Z]\d+\.\d+\b/ // ICD-10 codes
    ];
    
    return specificIndicators.some(pattern => pattern.test(description));
  }

  private isHearsayEvent(description: string): boolean {
    const hearsayIndicators = [
      'patient reports', 'patient states', 'patient claims',
      'told me', 'said that', 'according to'
    ];
    
    return hearsayIndicators.some(indicator => 
      description.toLowerCase().includes(indicator)
    );
  }

  private isRelatedDescription(desc1: string, desc2: string): boolean {
    const words1 = new Set(desc1.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const words2 = new Set(desc2.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    
    if (words1.size === 0 || words2.size === 0) return false;
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const similarity = intersection.size / Math.min(words1.size, words2.size);
    
    return similarity > 0.3; // 30% word overlap indicates relation
  }

  private hasContradictoryInformation(event1: TimelineEvent, event2: TimelineEvent): boolean {
    // Check for obvious contradictions
    
    // Same date but contradictory event types
    if (event1.event_date === event2.event_date) {
      if (event1.event_type === 'injury' && event2.event_type === 'treatment' && 
          event1.description.toLowerCase().includes('no injury')) {
        return true;
      }
    }
    
    // Treatment before injury (chronological impossibility)
    if (event1.event_type === 'treatment' && event2.event_type === 'injury' &&
        new Date(event1.event_date) < new Date(event2.event_date)) {
      return true;
    }
    
    return false;
  }

  private assessFactReliability(fact: string): number {
    let score = 0.6; // Base score for legal facts
    
    // Increase for specific details
    if (this.hasSpecificDetails(fact)) score += 0.2;
    
    // Increase for official language
    if (/officer|report|documented/i.test(fact)) score += 0.1;
    
    // Decrease for uncertain language
    if (/approximately|around|about/i.test(fact)) score -= 0.2;
    
    return Math.max(0.1, Math.min(1.0, score));
  }

  private hasSpecificDetails(text: string): boolean {
    return /\d{1,2}:\d{2}/.test(text) || // Time
           /\d+\s*(feet|mph|degrees)/.test(text) || // Measurements
           /[A-Z][a-z]+\s[A-Z][a-z]+/.test(text); // Proper names
  }
}