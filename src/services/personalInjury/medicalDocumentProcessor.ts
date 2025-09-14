import { supabase } from "@/integrations/supabase/client";

// Interface for ICD-10 code extraction
export interface ICD10Code {
  code: string;
  description: string;
  category: 'primary' | 'secondary' | 'comorbidity';
  reliability_score: number;
  source_location: string;
}

// Interface for medical timeline events
export interface MedicalTimelineEvent {
  date: string;
  event_type: 'injury' | 'treatment' | 'diagnosis' | 'medication' | 'therapy' | 'imaging';
  description: string;
  provider: string;
  reliability_score: number;
  source_document: string;
}

// Interface for medication extraction
export interface MedicationRecord {
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  prescribing_physician: string;
  indication: string;
  reliability_score: number;
}

export class MedicalDocumentProcessor {
  
  /**
   * Process medical document content using attorney thinking algorithm principles
   * Applies healthy skepticism and fact vs information distinction
   */
  async processDocument(
    documentId: string,
    content: string,
    clientId: string,
    documentType: 'medical_record' | 'diagnostic_report' | 'imaging_result' | 'treatment_note'
  ) {
    console.log('🏥 Processing medical document with attorney reasoning algorithm');
    
    try {
      // Step 1: Apply healthy skepticism - verify document authenticity markers
      const authenticityScore = this.assessDocumentAuthenticity(content);
      
      // Step 2: Extract and classify information using fact vs hearsay principles
      const medicalData = this.extractMedicalInformation(content, documentType);
      
      // Step 3: Apply relevance assessment to extracted data
      const relevantFindings = this.assessRelevanceToPersonalInjury(medicalData);
      
      // Step 4: Timeline reconstruction with cross-examination mindset
      const timelineEvents = this.reconstructMedicalTimeline(content);
      
      // Step 5: Store processed data with reliability scoring
      await this.storeMedicalAnalysis({
        documentId,
        clientId,
        documentType,
        authenticityScore,
        medicalData: relevantFindings,
        timelineEvents,
        processedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        authenticityScore,
        extractedData: relevantFindings,
        timelineEvents
      };
      
    } catch (error) {
      console.error('Error processing medical document:', error);
      throw error;
    }
  }

  /**
   * Apply healthy skepticism to assess document authenticity
   * Internal narrative: "Is this supported by reliable evidence?"
   */
  private assessDocumentAuthenticity(content: string): number {
    let score = 0.5; // Start with neutral
    
    // Check for professional medical formatting
    if (this.hasValidMedicalFormatting(content)) score += 0.2;
    
    // Check for provider credentials and contact info
    if (this.hasProviderCredentials(content)) score += 0.2;
    
    // Check for standard medical terminology
    if (this.hasStandardMedicalTerminology(content)) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Extract ICD-10 codes with reliability assessment
   * Distinguish facts (verified codes) from information (suspected conditions)
   */
  extractICD10Codes(content: string): ICD10Code[] {
    const codes: ICD10Code[] = [];
    
    // Common ICD-10 patterns for personal injury cases
    const icd10Patterns = [
      // Injury codes
      /\b([ST]\d{2}\.\d{1,3}[A-Z]?)\b/g, // Injury and poisoning codes
      // Pain codes
      /\b(M\d{2}\.\d{1,3})\b/g, // Musculoskeletal codes
      // External cause codes
      /\b([VWX]\d{2}\.\d{1,3}[A-Z]?)\b/g // External causes
    ];

    icd10Patterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(code => {
        // Apply cross-examination mindset: verify code context
        const reliability = this.assessCodeReliability(content, code);
        
        codes.push({
          code: code.trim(),
          description: this.getICD10Description(code),
          category: this.categorizeICD10Code(code),
          reliability_score: reliability,
          source_location: this.findCodeContext(content, code)
        });
      });
    });

    return codes;
  }

  /**
   * Reconstruct medical timeline with attorney thinking principles
   * Apply deliberate questioning to verify chronological consistency
   */
  private reconstructMedicalTimeline(content: string): MedicalTimelineEvent[] {
    const events: MedicalTimelineEvent[] = [];
    
    // Extract date patterns with medical context
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})\s*[-:]\s*([^.]+)/g,
      /(\d{4}-\d{2}-\d{2})\s*[-:]\s*([^.]+)/g,
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\s*[-:]\s*([^.]+)/g
    ];

    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const date = match[1];
        const eventDescription = match[2]?.trim();
        
        if (eventDescription) {
          // Apply contextual analysis to determine event type
          const eventType = this.classifyMedicalEvent(eventDescription);
          
          // Apply evidence-based reasoning to assess reliability
          const reliability = this.assessEventReliability(content, eventDescription);
          
          events.push({
            date,
            event_type: eventType,
            description: eventDescription,
            provider: this.extractProvider(content, eventDescription),
            reliability_score: reliability,
            source_document: 'current_document'
          });
        }
      }
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Extract medication information with opinion evaluation
   * Distinguish between prescribed medications (expert opinion) vs reported usage (lay opinion)
   */
  extractMedications(content: string): MedicationRecord[] {
    const medications: MedicationRecord[] = [];
    
    // Common medication patterns
    const medicationPatterns = [
      /(\w+)\s+(\d+\s*mg)\s+(\d+\s*times?\s+(?:daily|per day|bid|tid|qid))/gi,
      /Prescription:\s*([^,\n]+),?\s*(\d+\s*mg)?\s*([^,\n]*)/gi
    ];

    medicationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1]?.trim();
        const dosage = match[2]?.trim() || 'Not specified';
        const frequency = match[3]?.trim() || 'Not specified';
        
        if (name) {
          // Apply hearsay detection - is this prescribed or self-reported?
          const reliability = this.assessMedicationReliability(content, name);
          
          medications.push({
            name,
            dosage,
            frequency,
            start_date: this.extractMedicationStartDate(content, name),
            prescribing_physician: this.extractPrescribingPhysician(content, name),
            indication: this.extractMedicationIndication(content, name),
            reliability_score: reliability
          });
        }
      }
    });

    return medications;
  }

  // Helper methods implementing attorney thinking principles

  private hasValidMedicalFormatting(content: string): boolean {
    const medicalFormatIndicators = [
      /Chief Complaint:/i,
      /History of Present Illness:/i,
      /Assessment and Plan:/i,
      /SOAP/i,
      /Provider:/i,
      /Patient ID:/i
    ];
    
    return medicalFormatIndicators.some(pattern => pattern.test(content));
  }

  private hasProviderCredentials(content: string): boolean {
    const credentialPatterns = [
      /\bMD\b|\bDO\b|\bNP\b|\bPA\b/,
      /Dr\.\s+\w+/,
      /Phone:\s*\(\d{3}\)\s*\d{3}-\d{4}/
    ];
    
    return credentialPatterns.some(pattern => pattern.test(content));
  }

  private hasStandardMedicalTerminology(content: string): boolean {
    const medicalTerms = [
      /\b(diagnosis|prognosis|treatment|medication|prescription|symptom|examination)\b/i,
      /\b(patient|physician|doctor|nurse|clinic|hospital)\b/i
    ];
    
    return medicalTerms.some(pattern => pattern.test(content));
  }

  private assessCodeReliability(content: string, code: string): number {
    // Look for context indicators around the code
    const codeIndex = content.indexOf(code);
    const context = content.substring(Math.max(0, codeIndex - 50), codeIndex + 50);
    
    let reliability = 0.5;
    
    if (/diagnosis|confirmed|assessed/i.test(context)) reliability += 0.3;
    if (/suspected|possible|rule out/i.test(context)) reliability -= 0.2;
    if (/physician|doctor|provider/i.test(context)) reliability += 0.2;
    
    return Math.max(0.1, Math.min(1.0, reliability));
  }

  private getICD10Description(code: string): string {
    // Simplified ICD-10 lookup - in production, use comprehensive database
    const commonCodes: { [key: string]: string } = {
      'S72.001A': 'Fracture of unspecified part of neck of right femur, initial encounter',
      'M54.5': 'Low back pain',
      'S13.4XXA': 'Sprain of ligaments of cervical spine, initial encounter',
      // Add more codes as needed
    };
    
    return commonCodes[code] || 'Description to be verified';
  }

  private categorizeICD10Code(code: string): 'primary' | 'secondary' | 'comorbidity' {
    if (code.startsWith('S') || code.startsWith('T')) return 'primary'; // Injuries
    if (code.startsWith('M')) return 'secondary'; // Musculoskeletal
    return 'comorbidity';
  }

  private findCodeContext(content: string, code: string): string {
    const index = content.indexOf(code);
    if (index === -1) return 'Code not found in context';
    
    return content.substring(Math.max(0, index - 30), index + code.length + 30);
  }

  private classifyMedicalEvent(description: string): MedicalTimelineEvent['event_type'] {
    const lowerDesc = description.toLowerCase();
    
    if (/injury|accident|incident|trauma/i.test(lowerDesc)) return 'injury';
    if (/treatment|therapy|visit|appointment/i.test(lowerDesc)) return 'treatment';
    if (/diagnosis|diagnosed|assessment/i.test(lowerDesc)) return 'diagnosis';
    if (/medication|prescription|drug/i.test(lowerDesc)) return 'medication';
    if (/physical therapy|pt|occupational therapy/i.test(lowerDesc)) return 'therapy';
    if (/x-ray|mri|ct scan|imaging/i.test(lowerDesc)) return 'imaging';
    
    return 'treatment'; // default
  }

  private assessEventReliability(content: string, eventDescription: string): number {
    let reliability = 0.6; // Base reliability
    
    // Check if event is documented by medical professional
    if (/physician|doctor|nurse|provider/i.test(eventDescription)) reliability += 0.2;
    
    // Check if event has specific medical details
    if (/\b\d+\s*(mg|ml|cc|units)\b/i.test(eventDescription)) reliability += 0.1;
    
    // Check for vague language that reduces reliability
    if (/approximately|around|about|maybe|possibly/i.test(eventDescription)) reliability -= 0.2;
    
    return Math.max(0.1, Math.min(1.0, reliability));
  }

  private extractProvider(content: string, eventDescription: string): string {
    // Look for provider names near the event description
    const providerPatterns = [
      /Dr\.\s+(\w+\s+\w+)/,
      /Provider:\s*([^,\n]+)/,
      /Physician:\s*([^,\n]+)/
    ];
    
    for (const pattern of providerPatterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    
    return 'Provider not specified';
  }

  private assessMedicationReliability(content: string, medicationName: string): number {
    const medIndex = content.indexOf(medicationName);
    const context = content.substring(Math.max(0, medIndex - 100), medIndex + 100);
    
    let reliability = 0.5;
    
    if (/prescribed|prescription|Rx/i.test(context)) reliability += 0.3;
    if (/patient reports|patient states/i.test(context)) reliability -= 0.1; // Hearsay
    if (/physician|doctor|provider/i.test(context)) reliability += 0.2;
    
    return Math.max(0.1, Math.min(1.0, reliability));
  }

  private extractMedicationStartDate(content: string, medicationName: string): string {
    // Look for dates near medication mentions
    const medIndex = content.indexOf(medicationName);
    const context = content.substring(Math.max(0, medIndex - 50), medIndex + 50);
    
    const dateMatch = context.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
    return dateMatch ? dateMatch[0] : 'Date not specified';
  }

  private extractPrescribingPhysician(content: string, medicationName: string): string {
    // Look for physician names near medication
    const medIndex = content.indexOf(medicationName);
    const context = content.substring(Math.max(0, medIndex - 100), medIndex + 100);
    
    const physicianMatch = context.match(/Dr\.\s+(\w+\s+\w+)/);
    return physicianMatch ? physicianMatch[1] : 'Physician not specified';
  }

  private extractMedicationIndication(content: string, medicationName: string): string {
    const medIndex = content.indexOf(medicationName);
    const context = content.substring(Math.max(0, medIndex - 50), medIndex + 100);
    
    const indicationMatch = context.match(/for\s+([^.,\n]+)/i);
    return indicationMatch ? indicationMatch[1].trim() : 'Indication not specified';
  }

  /**
   * Extract relevant medical information using attorney thinking principles
   */
  private extractMedicalInformation(content: string, documentType: string) {
    return {
      icd10Codes: this.extractICD10Codes(content),
      medications: this.extractMedications(content),
      documentType,
      extractedAt: new Date().toISOString()
    };
  }

  /**
   * Apply relevance assessment to medical findings
   * Ask: "Does this information help answer the personal injury question at hand?"
   */
  private assessRelevanceToPersonalInjury(medicalData: any) {
    // Filter and score medical data based on personal injury relevance
    const relevantICD10 = medicalData.icd10Codes.filter((code: ICD10Code) => 
      this.isRelevantToPersonalInjury(code.code)
    );
    
    const relevantMedications = medicalData.medications.filter((med: MedicationRecord) =>
      this.isMedicationRelevantToPI(med.name, med.indication)
    );

    return {
      ...medicalData,
      icd10Codes: relevantICD10,
      medications: relevantMedications,
      relevanceScore: this.calculateOverallRelevance(relevantICD10, relevantMedications)
    };
  }

  private isRelevantToPersonalInjury(icd10Code: string): boolean {
    // Injury and external cause codes are highly relevant
    return /^[STUVWXY]/.test(icd10Code) || // Injury, poisoning, external causes
           /^M[0-9]/.test(icd10Code) ||    // Musculoskeletal disorders
           /^G[89]/.test(icd10Code);       // Nervous system disorders related to injury
  }

  private isMedicationRelevantToPI(name: string, indication: string): boolean {
    const relevantMedications = [
      'tramadol', 'hydrocodone', 'oxycodone', 'ibuprofen', 'naproxen',
      'cyclobenzaprine', 'tizanidine', 'gabapentin', 'pregabalin'
    ];
    
    const relevantIndications = [
      'pain', 'inflammation', 'muscle spasm', 'neuropathy', 'injury'
    ];
    
    return relevantMedications.some(med => 
      name.toLowerCase().includes(med.toLowerCase())
    ) || relevantIndications.some(ind =>
      indication.toLowerCase().includes(ind.toLowerCase())
    );
  }

  private calculateOverallRelevance(codes: ICD10Code[], medications: MedicationRecord[]): number {
    const codeRelevance = codes.length > 0 ? codes.reduce((sum, code) => sum + code.reliability_score, 0) / codes.length : 0;
    const medRelevance = medications.length > 0 ? medications.reduce((sum, med) => sum + med.reliability_score, 0) / medications.length : 0;
    
    return (codeRelevance + medRelevance) / 2;
  }

  /**
   * Store processed medical analysis in database
   */
  private async storeMedicalAnalysis(analysisData: any) {
    try {
      // Use dynamic table access since types haven't been updated yet
      const { error } = await (supabase as any)
        .from('medical_document_analyses')
        .insert({
          document_id: analysisData.documentId,
          client_id: analysisData.clientId,
          document_type: analysisData.documentType,
          authenticity_score: analysisData.authenticityScore,
          extracted_data: analysisData.medicalData,
          timeline_events: analysisData.timelineEvents,
          processed_at: analysisData.processedAt,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      console.log('✅ Medical analysis stored successfully');
    } catch (error) {
      console.error('Error storing medical analysis:', error);
      throw error;
    }
  }
}