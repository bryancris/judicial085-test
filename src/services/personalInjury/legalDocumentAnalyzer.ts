import { supabase } from "@/integrations/supabase/client";

// Interface for legal element analysis based on attorney thinking algorithm
export interface LegalElement {
  element: 'duty' | 'breach' | 'causation' | 'damages';
  present: boolean;
  evidence_strength: number;
  supporting_facts: string[];
  reliability_score: number;
  counter_arguments: string[];
}

// Interface for incident analysis
export interface IncidentAnalysis {
  incident_date: string;
  incident_location: string;
  incident_type: string;
  description: string;
  witnesses: number;
  police_report_available: boolean;
  reliability_score: number;
  fact_vs_hearsay_assessment: {
    facts: string[];
    hearsay: string[];
    opinions: string[];
  };
}

// Interface for case strength assessment
export interface CaseStrengthAssessment {
  overall_strength: number;
  legal_elements_completeness: number;
  evidence_quality: number;
  potential_defenses: string[];
  recommended_next_steps: string[];
  zealous_advocacy_notes: string[];
}

export class LegalDocumentAnalyzer {
  
  /**
   * Main analysis method implementing attorney thinking algorithm
   * Follows the integrated legal reasoning framework from algo.txt
   */
  async analyzeDocument(
    documentId: string,
    content: string,
    clientId: string,
    documentType: 'police_report' | 'witness_statement' | 'incident_report' | 'legal_correspondence'
  ) {
    console.log('⚖️ Analyzing legal document with attorney reasoning algorithm');
    
    try {
      // Step 1: Receive Input Information & Identify Key Issue
      const keyIssues = this.identifyKeyLegalIssues(content);
      
      // Step 2: Evaluate Source Credibility (Healthy Skepticism)
      const sourceCredibility = this.assessSourceCredibility(content, documentType);
      
      // Step 3: Classify Information (Facts vs Hearsay vs Opinion)
      const informationClassification = this.classifyInformation(content);
      
      // Step 4: Apply Relevant Rules & Legal Theories
      const legalElementAnalysis = this.analyzeLegalElements(content, informationClassification);
      
      // Step 5: Generate Arguments & Counter-Arguments
      const argumentAnalysis = this.generateArgumentsAndCounterArguments(legalElementAnalysis);
      
      // Step 6: Assess Case Strength (Zealous Advocacy)
      const caseStrength = this.assessCaseStrength(legalElementAnalysis, argumentAnalysis);
      
      // Step 7: Apply Ethical Considerations
      const ethicalAssessment = this.applyEthicalConsiderations(caseStrength);
      
      // Step 8: Store Analysis Results
      await this.storeLegalAnalysis({
        documentId,
        clientId,
        documentType,
        keyIssues,
        sourceCredibility,
        informationClassification,
        legalElementAnalysis,
        argumentAnalysis,
        caseStrength: ethicalAssessment,
        analyzedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        keyIssues,
        sourceCredibility,
        legalElementAnalysis,
        caseStrength: ethicalAssessment
      };
      
    } catch (error) {
      console.error('Error analyzing legal document:', error);
      throw error;
    }
  }

  /**
   * Step 1: Identify Key Legal Issues
   * Apply deliberate questioning to get to the heart of the issue
   */
  private identifyKeyLegalIssues(content: string): string[] {
    const issues: string[] = [];
    
    // Look for incident indicators
    if (/accident|collision|fall|slip|injury|incident/i.test(content)) {
      issues.push('Personal Injury Incident');
    }
    
    // Look for negligence indicators
    if (/negligent|careless|breach of duty|standard of care/i.test(content)) {
      issues.push('Negligence Claim');
    }
    
    // Look for property damage
    if (/property damage|vehicle damage|damage to/i.test(content)) {
      issues.push('Property Damage');
    }
    
    // Look for liability indicators
    if (/fault|liable|responsible|at fault/i.test(content)) {
      issues.push('Liability Determination');
    }
    
    return issues.length > 0 ? issues : ['General Personal Injury Matter'];
  }

  /**
   * Step 2: Evaluate Source Credibility (Healthy Skepticism)
   * Internal narrative: "Is that supported by reliable evidence?"
   */
  private assessSourceCredibility(content: string, documentType: string): number {
    let credibility = 0.5; // Start neutral
    
    // Official document types get higher credibility
    const officialSourceBonus = {
      'police_report': 0.3,
      'incident_report': 0.2,
      'legal_correspondence': 0.2,
      'witness_statement': 0.1
    };
    
    credibility += officialSourceBonus[documentType] || 0;
    
    // Check for official formatting and badges of authenticity
    if (this.hasOfficialFormatting(content)) credibility += 0.2;
    if (this.hasOfficerOrOfficialSignature(content)) credibility += 0.1;
    if (this.hasTimestampsAndCaseNumbers(content)) credibility += 0.1;
    
    // Reduce credibility for missing critical information
    if (!this.hasDateAndTime(content)) credibility -= 0.1;
    if (!this.hasLocation(content)) credibility -= 0.1;
    
    return Math.max(0.1, Math.min(1.0, credibility));
  }

  /**
   * Step 3: Classify Information (Facts vs Opinion vs Hearsay)
   * Distinguish Facts from Information as per attorney thinking principles
   */
  private classifyInformation(content: string): IncidentAnalysis['fact_vs_hearsay_assessment'] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    const facts: string[] = [];
    const hearsay: string[] = [];
    const opinions: string[] = [];
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      
      // Identify hearsay (second-hand accounts)
      if (this.isHearsay(trimmed)) {
        hearsay.push(trimmed);
      }
      // Identify opinions
      else if (this.isOpinion(trimmed)) {
        opinions.push(trimmed);
      }
      // Classify as fact if directly observed/documented
      else if (this.isDirectFact(trimmed)) {
        facts.push(trimmed);
      }
    });
    
    return { facts, hearsay, opinions };
  }

  /**
   * Step 4: Analyze Legal Elements for Personal Injury
   * Apply the four elements: Duty, Breach, Causation, Damages
   */
  private analyzeLegalElements(content: string, classification: any): LegalElement[] {
    const elements: LegalElement[] = [];
    
    // Analyze Duty
    const dutyAnalysis = this.analyzeDuty(content, classification);
    elements.push(dutyAnalysis);
    
    // Analyze Breach
    const breachAnalysis = this.analyzeBreach(content, classification);
    elements.push(breachAnalysis);
    
    // Analyze Causation
    const causationAnalysis = this.analyzeCausation(content, classification);
    elements.push(causationAnalysis);
    
    // Analyze Damages
    const damagesAnalysis = this.analyzeDamages(content, classification);
    elements.push(damagesAnalysis);
    
    return elements;
  }

  /**
   * Analyze Duty Element
   * Look for evidence of duty owed to plaintiff
   */
  private analyzeDuty(content: string, classification: any): LegalElement {
    const dutyIndicators = [
      'duty of care', 'responsible for', 'obligation to', 'standard of care',
      'property owner', 'business owner', 'driver', 'physician'
    ];
    
    const supportingFacts = classification.facts.filter((fact: string) =>
      dutyIndicators.some(indicator => fact.toLowerCase().includes(indicator))
    );
    
    const present = supportingFacts.length > 0 || this.inferDutyFromContext(content);
    const evidenceStrength = this.calculateEvidenceStrength(supportingFacts, content);
    
    return {
      element: 'duty',
      present,
      evidence_strength: evidenceStrength,
      supporting_facts: supportingFacts,
      reliability_score: this.calculateReliabilityScore(supportingFacts),
      counter_arguments: this.generateDutyCounterArguments(content)
    };
  }

  /**
   * Analyze Breach Element
   * Look for evidence of breach of duty
   */
  private analyzeBreach(content: string, classification: any): LegalElement {
    const breachIndicators = [
      'negligent', 'careless', 'failed to', 'did not', 'breach',
      'below standard', 'unreasonable', 'improper'
    ];
    
    const supportingFacts = classification.facts.filter((fact: string) =>
      breachIndicators.some(indicator => fact.toLowerCase().includes(indicator))
    );
    
    const present = supportingFacts.length > 0;
    const evidenceStrength = this.calculateEvidenceStrength(supportingFacts, content);
    
    return {
      element: 'breach',
      present,
      evidence_strength: evidenceStrength,
      supporting_facts: supportingFacts,
      reliability_score: this.calculateReliabilityScore(supportingFacts),
      counter_arguments: this.generateBreachCounterArguments(content)
    };
  }

  /**
   * Analyze Causation Element
   * Look for evidence of factual and proximate causation
   */
  private analyzeCausation(content: string, classification: any): LegalElement {
    const causationIndicators = [
      'caused by', 'resulted in', 'because of', 'due to', 'as a result',
      'led to', 'resulted from', 'consequence of'
    ];
    
    const supportingFacts = classification.facts.filter((fact: string) =>
      causationIndicators.some(indicator => fact.toLowerCase().includes(indicator))
    );
    
    const present = supportingFacts.length > 0;
    const evidenceStrength = this.calculateEvidenceStrength(supportingFacts, content);
    
    return {
      element: 'causation',
      present,
      evidence_strength: evidenceStrength,
      supporting_facts: supportingFacts,
      reliability_score: this.calculateReliabilityScore(supportingFacts),
      counter_arguments: this.generateCausationCounterArguments(content)
    };
  }

  /**
   * Analyze Damages Element
   * Look for evidence of actual harm or injury
   */
  private analyzeDamages(content: string, classification: any): LegalElement {
    const damagesIndicators = [
      'injury', 'injured', 'damage', 'damaged', 'hurt', 'pain',
      'medical bills', 'hospital', 'treatment', 'surgery', 'broken'
    ];
    
    const supportingFacts = classification.facts.filter((fact: string) =>
      damagesIndicators.some(indicator => fact.toLowerCase().includes(indicator))
    );
    
    const present = supportingFacts.length > 0;
    const evidenceStrength = this.calculateEvidenceStrength(supportingFacts, content);
    
    return {
      element: 'damages',
      present,
      evidence_strength: evidenceStrength,
      supporting_facts: supportingFacts,
      reliability_score: this.calculateReliabilityScore(supportingFacts),
      counter_arguments: this.generateDamagesCounterArguments(content)
    };
  }

  /**
   * Step 5: Generate Arguments and Counter-Arguments
   * Apply cross-examination mindset to test credibility
   */
  private generateArgumentsAndCounterArguments(elements: LegalElement[]): any {
    const argumentsAnalysis = {
      plaintiff_arguments: [] as string[],
      defense_arguments: [] as string[],
      evidence_gaps: [] as string[],
      strategic_considerations: [] as string[]
    };
    
    elements.forEach(element => {
      if (element.present && element.evidence_strength > 0.6) {
        argumentsAnalysis.plaintiff_arguments.push(
          `Strong evidence for ${element.element}: ${element.supporting_facts.join('; ')}`
        );
      } else {
        argumentsAnalysis.evidence_gaps.push(
          `Weak evidence for ${element.element} - need additional documentation`
        );
      }
      
      // Add counter-arguments from defense perspective
      argumentsAnalysis.defense_arguments.push(...element.counter_arguments);
    });
    
    return argumentsAnalysis;
  }

  /**
   * Step 6: Assess Case Strength (Apply Zealous Advocacy)
   * Exert utmost learning and ability while maintaining ethical boundaries
   */
  private assessCaseStrength(elements: LegalElement[], argumentsAnalysis: any): CaseStrengthAssessment {
    const completeness = elements.filter(e => e.present).length / elements.length;
    const avgEvidenceQuality = elements.reduce((sum, e) => sum + e.evidence_strength, 0) / elements.length;
    const overallStrength = (completeness + avgEvidenceQuality) / 2;
    
    // Apply zealous advocacy principles
    const zealousAdvocacyNotes = [
      "Thoroughly examine all evidence for client's benefit",
      "Identify every possible theory of liability",
      "Pursue all available remedies within ethical bounds"
    ];
    
    // Generate next steps with client's best interest in mind
    const nextSteps = this.generateZealousNextSteps(elements, argumentsAnalysis);
    
    return {
      overall_strength: overallStrength,
      legal_elements_completeness: completeness,
      evidence_quality: avgEvidenceQuality,
      potential_defenses: argumentsAnalysis.defense_arguments,
      recommended_next_steps: nextSteps,
      zealous_advocacy_notes: zealousAdvocacyNotes
    };
  }

  /**
   * Step 7: Apply Ethical Considerations
   * Maintain ethical boundaries while pursuing zealous advocacy
   */
  private applyEthicalConsiderations(assessment: CaseStrengthAssessment): CaseStrengthAssessment {
    // Add ethical compliance notes
    const ethicalNotes = [
      "Ensure all claims are supported by evidence",
      "Do not exaggerate injuries or damages",
      "Maintain attorney-client privilege",
      "Provide honest assessment of case merits"
    ];
    
    return {
      ...assessment,
      zealous_advocacy_notes: [...assessment.zealous_advocacy_notes, ...ethicalNotes]
    };
  }

  // Helper methods implementing attorney thinking principles

  private isHearsay(sentence: string): boolean {
    const hearsayIndicators = [
      'told me', 'said that', 'heard that', 'someone said',
      'according to', 'reported that', 'stated that', 'claimed that'
    ];
    
    return hearsayIndicators.some(indicator => 
      sentence.toLowerCase().includes(indicator)
    );
  }

  private isOpinion(sentence: string): boolean {
    const opinionIndicators = [
      'i think', 'i believe', 'in my opinion', 'it seems',
      'appears to be', 'looks like', 'probably', 'likely'
    ];
    
    return opinionIndicators.some(indicator => 
      sentence.toLowerCase().includes(indicator)
    );
  }

  private isDirectFact(sentence: string): boolean {
    const factIndicators = [
      'observed', 'witnessed', 'saw', 'occurred at',
      'happened at', 'documented', 'recorded', 'measured'
    ];
    
    return factIndicators.some(indicator => 
      sentence.toLowerCase().includes(indicator)
    ) || this.hasSpecificDetails(sentence);
  }

  private hasSpecificDetails(sentence: string): boolean {
    // Look for specific times, dates, measurements, names
    return /\d{1,2}:\d{2}/.test(sentence) || // Time
           /\d{1,2}\/\d{1,2}\/\d{4}/.test(sentence) || // Date
           /\d+\s*(feet|mph|degrees)/.test(sentence) || // Measurements
           /[A-Z][a-z]+\s[A-Z][a-z]+/.test(sentence); // Proper names
  }

  private hasOfficialFormatting(content: string): boolean {
    const officialIndicators = [
      /Report Number:|Case Number:|Badge Number:/i,
      /Officer:|Detective:|Department:/i,
      /Date of Incident:|Time of Incident:/i
    ];
    
    return officialIndicators.some(pattern => pattern.test(content));
  }

  private hasOfficerOrOfficialSignature(content: string): boolean {
    return /Officer\s+\w+|Badge\s+#?\d+|Signature:/i.test(content);
  }

  private hasTimestampsAndCaseNumbers(content: string): boolean {
    return /Case\s*#?\s*\d+|Report\s*#?\s*\d+/i.test(content);
  }

  private hasDateAndTime(content: string): boolean {
    return /\d{1,2}\/\d{1,2}\/\d{4}/.test(content) && /\d{1,2}:\d{2}/.test(content);
  }

  private hasLocation(content: string): boolean {
    return /\d+\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)/i.test(content);
  }

  private inferDutyFromContext(content: string): boolean {
    // Infer duty from relationship indicators
    const relationshipIndicators = [
      'business premises', 'parking lot', 'store', 'restaurant',
      'driver', 'pedestrian', 'property owner', 'landlord'
    ];
    
    return relationshipIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );
  }

  private calculateEvidenceStrength(supportingFacts: string[], content: string): number {
    if (supportingFacts.length === 0) return 0;
    
    let strength = Math.min(supportingFacts.length * 0.25, 1.0);
    
    // Bonus for specific details
    if (supportingFacts.some(fact => this.hasSpecificDetails(fact))) {
      strength += 0.2;
    }
    
    return Math.min(strength, 1.0);
  }

  private calculateReliabilityScore(supportingFacts: string[]): number {
    if (supportingFacts.length === 0) return 0;
    
    // Average reliability based on fact specificity and source
    return supportingFacts.reduce((sum, fact) => {
      let score = 0.5;
      if (this.hasSpecificDetails(fact)) score += 0.3;
      if (this.isDirectFact(fact)) score += 0.2;
      return sum + Math.min(score, 1.0);
    }, 0) / supportingFacts.length;
  }

  private generateDutyCounterArguments(content: string): string[] {
    const counterArgs = [];
    
    if (/trespasser|no permission/i.test(content)) {
      counterArgs.push("Plaintiff may have been a trespasser with limited duty owed");
    }
    
    if (/obvious danger|open and obvious/i.test(content)) {
      counterArgs.push("Danger was open and obvious, reducing duty");
    }
    
    return counterArgs;
  }

  private generateBreachCounterArguments(content: string): string[] {
    const counterArgs = [];
    
    if (/reasonable care|proper procedures/i.test(content)) {
      counterArgs.push("Defendant followed reasonable care standards");
    }
    
    if (/industry standard|accepted practice/i.test(content)) {
      counterArgs.push("Actions were consistent with industry standards");
    }
    
    return counterArgs;
  }

  private generateCausationCounterArguments(content: string): string[] {
    const counterArgs = [];
    
    if (/pre-existing|prior injury/i.test(content)) {
      counterArgs.push("Injuries may be from pre-existing conditions");
    }
    
    if (/intervening cause|other factors/i.test(content)) {
      counterArgs.push("Intervening causes may break causation chain");
    }
    
    return counterArgs;
  }

  private generateDamagesCounterArguments(content: string): string[] {
    const counterArgs = [];
    
    if (/no injury|minor/i.test(content)) {
      counterArgs.push("Damages appear minimal or non-existent");
    }
    
    if (/exaggerated|inconsistent/i.test(content)) {
      counterArgs.push("Claimed damages may be exaggerated");
    }
    
    return counterArgs;
  }

  private generateZealousNextSteps(elements: LegalElement[], argumentsAnalysis: any): string[] {
    const steps = [];
    
    // Evidence gathering based on weak elements
    elements.forEach(element => {
      if (!element.present || element.evidence_strength < 0.6) {
        steps.push(`Gather additional evidence for ${element.element} element`);
      }
    });
    
    // Strategic litigation steps
    steps.push("Conduct thorough discovery of defendant's records");
    steps.push("Identify and interview all potential witnesses");
    steps.push("Obtain all medical records and expert medical opinions");
    steps.push("Research similar cases for settlement benchmarks");
    
    return steps;
  }

  /**
   * Store legal analysis results in database
   */
  private async storeLegalAnalysis(analysisData: any) {
    try {
      // Use dynamic table access since types haven't been updated yet
      const { error } = await (supabase as any)
        .from('legal_document_analyses')
        .insert({
          document_id: analysisData.documentId,
          client_id: analysisData.clientId,
          document_type: analysisData.documentType,
          key_issues: analysisData.keyIssues,
          source_credibility: analysisData.sourceCredibility,
          information_classification: analysisData.informationClassification,
          legal_elements: analysisData.legalElementAnalysis,
          arguments_analysis: analysisData.argumentAnalysis,
          case_strength: analysisData.caseStrength,
          analyzed_at: analysisData.analyzedAt,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      console.log('✅ Legal analysis stored successfully');
    } catch (error) {
      console.error('Error storing legal analysis:', error);
      throw error;
    }
  }
}