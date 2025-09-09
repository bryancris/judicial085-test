/**
 * Enhanced Step Validation Service
 * Enforces the 4 key technical requirements for case analysis:
 * 1. Exact step order execution
 * 2. Quality control at each step transition
 * 3. Professional legal writing standards
 * 4. Cross-step reference and consistency validation
 */

import { toast } from "@/hooks/use-toast";

// Step validation interface
export interface StepValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-1 quality score
}

// Legal writing standards checkers
export const legalWritingValidators = {
  hasProperTone: (content: string): boolean => {
    const emotionalWords = /\b(obviously|ridiculous|absurd|shocking|outrageous|terrible|amazing|incredible)\b/gi;
    return !emotionalWords.test(content);
  },

  hasObjectiveLanguage: (content: string): boolean => {
    const subjectivePatterns = /\b(I think|I believe|in my opinion|clearly|definitely should)\b/gi;
    return !subjectivePatterns.test(content);
  },

  hasProperStructure: (content: string, stepType: string): boolean => {
    switch (stepType) {
      case 'CASE_SUMMARY':
        return /## Parties|## Timeline|## Key Facts/i.test(content);
      case 'PRELIMINARY_ANALYSIS':
        return /## Potential Legal Areas|## Preliminary Issues/i.test(content);
      case 'IRAC_ANALYSIS':
        return /## Issue|## Rule|## Analysis|## Conclusion/i.test(content);
      default:
        return content.includes('##'); // At least some structure
    }
  },

  hasProperCitations: (content: string): boolean => {
    // Check for Texas legal citation patterns
    const texasCitations = /\bTex\.\s+(Code|Civ\.|Crim\.|Penal|Bus\.|Prop\.)\s+Ann\.\s+§\s*\d+/gi;
    const caseCitations = /\b\d+\s+S\.W\.\d+d\s+\d+/gi;
    const hasLegalRefs = texasCitations.test(content) || caseCitations.test(content);
    
    // Allow content without citations if it's preliminary
    return hasLegalRefs || content.length < 500;
  }
};

// Citation format validation
export const citationValidators = {
  validateTexasCitations: (content: string): string[] => {
    const errors: string[] = [];
    const citations = content.match(/Tex\.\s+[A-Za-z.]+\s+Ann\.\s+§?\s*[\d.-]+/gi) || [];
    
    citations.forEach(citation => {
      // Check proper Texas citation format
      if (!/^Tex\.\s+(Code|Civ\.|Crim\.|Penal|Bus\.|Prop\.)\s+Ann\.\s+§\s*\d+(\.\d+)*$/i.test(citation.trim())) {
        errors.push(`Improper Texas citation format: "${citation}"`);
      }
    });
    
    return errors;
  },

  validateCaseCitations: (content: string): string[] => {
    const errors: string[] = [];
    const caseCites = content.match(/\b[\w\s]+v\.\s+[\w\s]+,?\s*\d+\s+S\.W\.\d*d?\s+\d+/gi) || [];
    
    caseCites.forEach(cite => {
      // Basic Texas case citation format check
      if (!/^.+\s+v\.\s+.+,?\s*\d+\s+S\.W\.\d*d?\s+\d+/i.test(cite.trim())) {
        errors.push(`Improper case citation format: "${cite}"`);
      }
    });
    
    return errors;
  }
};

// Cross-step consistency validation
export const consistencyValidators = {
  validatePartyConsistency: (stepResults: Record<string, any>): string[] => {
    const errors: string[] = [];
    const caseSummary = stepResults['CASE_SUMMARY']?.content || '';
    const otherSteps = Object.values(stepResults).map(r => r?.content || '').join(' ');
    
    // Extract party names from case summary
    const partyMatches = caseSummary.match(/(?:plaintiff|defendant|petitioner|respondent)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi) || [];
    const parties = partyMatches.map(match => match.split(/[:]/)[1]?.trim()).filter(Boolean);
    
    // Check if parties are consistently referenced
    parties.forEach(party => {
      if (party && !new RegExp(party.replace(/\s+/g, '\\s+'), 'i').test(otherSteps)) {
        errors.push(`Party "${party}" mentioned in case summary but not consistently referenced throughout analysis`);
      }
    });
    
    return errors;
  },

  validateIssueConsistency: (stepResults: Record<string, any>): string[] => {
    const errors: string[] = [];
    const prelimAnalysis = stepResults['PRELIMINARY_ANALYSIS']?.content || '';
    const iracAnalysis = stepResults['IRAC_ANALYSIS']?.content || '';
    
    // Extract issues from preliminary analysis
    const issueSection = prelimAnalysis.match(/## Preliminary Issues([\s\S]*?)(?=##|$)/i)?.[1] || '';
    const issues = issueSection.match(/(?:^|\n)\s*[\d.-]+\s*(.+?)(?=\n|$)/gm) || [];
    
    // Check if preliminary issues are addressed in IRAC
    issues.forEach(issue => {
      const issueText = issue.replace(/^[\d.-]+\s*/, '').trim();
      if (issueText && !new RegExp(issueText.substring(0, 20), 'i').test(iracAnalysis)) {
        errors.push(`Issue "${issueText}" identified in preliminary analysis but not addressed in IRAC analysis`);
      }
    });
    
    return errors;
  },

  validateCitationConsistency: (stepResults: Record<string, any>): string[] => {
    const errors: string[] = [];
    const allContent = Object.values(stepResults).map(r => r?.content || '').join(' ');
    
    // Find all citations and check for consistent application
    const citations = allContent.match(/Tex\.\s+[A-Za-z.]+\s+Ann\.\s+§\s*[\d.-]+/gi) || [];
    const uniqueCitations = [...new Set(citations.map(c => c.toLowerCase()))];
    
    // Check each citation appears in context appropriately
    uniqueCitations.forEach(citation => {
      const occurrences = (allContent.match(new RegExp(citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
      if (occurrences === 1) {
        errors.push(`Citation "${citation}" only appears once - may need broader application`);
      }
    });
    
    return errors;
  }
};

// Enhanced step validation with blocking mechanism
export const validateStepCompletion = async (stepNumber: number, stepResult: any, stepType: string, allStepResults: Record<string, any> = {}): Promise<StepValidation> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 1.0;

  // Basic content validation
  if (!stepResult || !stepResult.content) {
    errors.push(`Step ${stepNumber} produced no content`);
    return { isValid: false, errors, warnings, score: 0 };
  }

  const content = stepResult.content;

  // Minimum content length based on step type
  const minLengths = {
    'CASE_SUMMARY': 300,
    'PRELIMINARY_ANALYSIS': 400,
    'TEXAS_LAWS': 200,
    'CASE_LAW': 200,
    'IRAC_ANALYSIS': 600,
    'RISK_ASSESSMENT': 300,
    'FOLLOW_UP': 150,
    'REMEDIES': 200,
    'SYNTHESIS': 500
  };

  const minLength = minLengths[stepType as keyof typeof minLengths] || 150;
  if (content.length < minLength) {
    errors.push(`Step ${stepNumber} content too short (${content.length} chars, minimum ${minLength})`);
    score -= 0.3;
  }

  // Professional legal writing standards
  if (!legalWritingValidators.hasProperTone(content)) {
    errors.push(`Step ${stepNumber} contains emotional or unprofessional language`);
    score -= 0.2;
  }

  if (!legalWritingValidators.hasObjectiveLanguage(content)) {
    warnings.push(`Step ${stepNumber} may contain subjective language`);
    score -= 0.1;
  }

  if (!legalWritingValidators.hasProperStructure(content, stepType)) {
    errors.push(`Step ${stepNumber} lacks required structural elements for ${stepType}`);
    score -= 0.3;
  }

  // Citation validation for legal content
  if (['TEXAS_LAWS', 'CASE_LAW', 'IRAC_ANALYSIS'].includes(stepType)) {
    const citationErrors = [
      ...citationValidators.validateTexasCitations(content),
      ...citationValidators.validateCaseCitations(content)
    ];
    
    if (citationErrors.length > 0) {
      errors.push(...citationErrors);
      score -= 0.2;
    }

    if (!legalWritingValidators.hasProperCitations(content)) {
      warnings.push(`Step ${stepNumber} may need more legal citations`);
      score -= 0.1;
    }
  }

  // Cross-step consistency validation (for later steps)
  if (stepNumber >= 3 && Object.keys(allStepResults).length >= 2) {
    const consistencyErrors = [
      ...consistencyValidators.validatePartyConsistency(allStepResults),
      ...consistencyValidators.validateIssueConsistency(allStepResults),
      ...consistencyValidators.validateCitationConsistency(allStepResults)
    ];
    
    if (consistencyErrors.length > 0) {
      errors.push(...consistencyErrors);
      score -= 0.1 * consistencyErrors.length;
    }
  }

  // Step-specific validations
  switch (stepType) {
    case 'CASE_SUMMARY':
      if (!content.includes('## Parties') || !content.includes('## Key Facts')) {
        errors.push('Case summary must include Parties and Key Facts sections');
        score -= 0.2;
      }
      
      // Timeline quality validation
      if (content.includes('## Timeline')) {
        const timelineSection = content.match(/## Timeline([\s\S]*?)(?=##|$)/)?.[1] || '';
        const timelineEntries = timelineSection.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'));
        
        // Check for fragmented timeline entries
        const fragmentedEntries = timelineEntries.filter(entry => {
          const text = entry.replace(/^[-*]\s*/, '').trim();
          return text.length < 20 || text.match(/^(within|after|during|over)\s+[^.]*$/i);
        });
        
        if (fragmentedEntries.length > 0) {
          warnings.push(`Timeline contains ${fragmentedEntries.length} incomplete or fragmented entries`);
          score -= 0.1;
        }
        
        // Ensure minimum timeline completeness
        if (timelineEntries.length < 3) {
          warnings.push('Timeline should contain at least 3 substantive events');
          score -= 0.05;
        }
      }
      break;
    
    case 'IRAC_ANALYSIS':
      const iracSections = ['Issue', 'Rule', 'Analysis', 'Conclusion'];
      const missingSections = iracSections.filter(section => !content.includes(`## ${section}`));
      if (missingSections.length > 0) {
        errors.push(`IRAC analysis missing sections: ${missingSections.join(', ')}`);
        score -= 0.1 * missingSections.length;
      }
      break;
  }

  // Quality scoring
  score = Math.max(0, Math.min(1, score));

  // Hard validation failure threshold
  const isValid = errors.length === 0 && score >= 0.6;

  if (!isValid) {
    console.error(`❌ Step ${stepNumber} validation failed:`, { errors, warnings, score });
  } else {
    console.log(`✅ Step ${stepNumber} validation passed:`, { warnings: warnings.length, score: score.toFixed(2) });
  }

  return {
    isValid,
    errors,
    warnings,
    score
  };
};

// Blocking mechanism for failed validation
export const enforceValidationBlocking = (validation: StepValidation, stepNumber: number, stepType: string): boolean => {
  if (!validation.isValid) {
    const errorMessage = validation.errors.length > 0 
      ? validation.errors.join('; ')
      : `Quality score too low (${validation.score.toFixed(2)})`;
    
    toast({
      title: `Step ${stepNumber} Validation Failed`,
      description: `${stepType}: ${errorMessage}`,
      variant: "destructive",
    });
    
    console.error(`🚫 BLOCKING: Step ${stepNumber} failed validation and cannot proceed`);
    return false;
  }
  
  if (validation.warnings.length > 0) {
    toast({
      title: `Step ${stepNumber} Quality Warning`,
      description: `${validation.warnings.length} quality issues detected`,
      variant: "default",
    });
  }
  
  return true;
};

// Enhanced step order enforcement
export const enforceStepOrder = (currentStep: number, completedSteps: Set<number>): boolean => {
  // Check that all previous steps are completed
  for (let i = 1; i < currentStep; i++) {
    if (!completedSteps.has(i)) {
      toast({
        title: "Step Order Violation",
        description: `Cannot proceed to step ${currentStep} without completing step ${i}`,
        variant: "destructive",
      });
      return false;
    }
  }
  return true;
};