/**
 * Quality Control Service
 * Comprehensive quality assessment and control for legal analysis
 */

export interface QualityMetrics {
  overallScore: number;
  structuralScore: number;
  citationScore: number;
  consistencyScore: number;
  professionalismScore: number;
  completenessScore: number;
}

export interface QualityAssessment {
  metrics: QualityMetrics;
  criticalIssues: string[];
  recommendations: string[];
  passesQuality: boolean;
}

// Professional legal writing assessment
export const assessProfessionalWriting = (content: string): { score: number; issues: string[] } => {
  const issues: string[] = [];
  let score = 1.0;

  // Check for proper legal terminology usage
  const legalTerms = /\b(pursuant to|whereas|heretofore|aforementioned|inter alia|prima facie|res ipsa loquitur|burden of proof|preponderance of evidence)\b/gi;
  const hasLegalTerms = legalTerms.test(content);
  
  // Check for conversational language (should be minimal)
  const conversationalPatterns = /\b(hey|yeah|okay|gonna|wanna|kinda|sorta|basically|honestly|actually)\b/gi;
  const conversationalMatches = content.match(conversationalPatterns) || [];
  
  if (conversationalMatches.length > 2) {
    issues.push('Contains too much conversational language for legal writing');
    score -= 0.2;
  }

  // Check for proper sentence structure
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const averageSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
  
  if (averageSentenceLength < 15) {
    issues.push('Sentences too short for professional legal writing');
    score -= 0.1;
  }
  
  if (averageSentenceLength > 200) {
    issues.push('Sentences too long and may be difficult to follow');
    score -= 0.1;
  }

  // Check for proper transitions
  const transitions = /\b(however|furthermore|moreover|nevertheless|consequently|therefore|thus|accordingly|in addition|similarly|conversely|on the other hand)\b/gi;
  const transitionCount = (content.match(transitions) || []).length;
  const paragraphs = content.split('\n\n').length;
  
  if (transitionCount / paragraphs < 0.3) {
    issues.push('May need more transitional phrases for better flow');
    score -= 0.1;
  }

  return { score: Math.max(0, score), issues };
};

// Citation quality assessment
export const assessCitationQuality = (content: string): { score: number; issues: string[] } => {
  const issues: string[] = [];
  let score = 1.0;

  // Count different types of citations
  const texasStatutes = content.match(/Tex\.\s+[A-Za-z.]+\s+Ann\.\s+§\s*[\d.-]+/gi) || [];
  const caseCitations = content.match(/\b\d+\s+S\.W\.\d*d?\s+\d+/gi) || [];
  const federalCitations = content.match(/\b\d+\s+U\.S\.C\.\s+§\s*\d+/gi) || [];

  // Check citation density (should have legal citations if making legal arguments)
  const legalArgumentWords = content.match(/\b(statute|law|rule|regulation|precedent|holding|court|judge|legal|unlawful|violation|comply|enforce)\b/gi) || [];
  const citationDensity = (texasStatutes.length + caseCitations.length) / Math.max(1, legalArgumentWords.length);

  if (legalArgumentWords.length > 10 && citationDensity < 0.1) {
    issues.push('Legal arguments need more supporting citations');
    score -= 0.3;
  }

  // Check for proper citation format
  texasStatutes.forEach(citation => {
    if (!/^Tex\.\s+(Code|Civ\.|Crim\.|Penal|Bus\.|Prop\.)\s+Ann\.\s+§\s*\d+(\.\d+)*$/i.test(citation.trim())) {
      issues.push(`Improperly formatted Texas citation: ${citation}`);
      score -= 0.1;
    }
  });

  // Check for citation context (citations should be integrated into sentences)
  const orphanedCitations = content.match(/\n\s*Tex\.\s+[A-Za-z.]+\s+Ann\.\s+§\s*[\d.-]+\s*\n/gi) || [];
  if (orphanedCitations.length > 0) {
    issues.push('Citations should be integrated into sentences, not standalone');
    score -= 0.2;
  }

  return { score: Math.max(0, score), issues };
};

// Structural completeness assessment
export const assessStructuralCompleteness = (content: string, expectedSections: string[]): { score: number; issues: string[] } => {
  const issues: string[] = [];
  let score = 1.0;

  // Check for required sections
  const missingSections = expectedSections.filter(section => 
    !content.includes(`## ${section}`) && !content.includes(`# ${section}`)
  );

  if (missingSections.length > 0) {
    issues.push(`Missing required sections: ${missingSections.join(', ')}`);
    score -= 0.2 * (missingSections.length / expectedSections.length);
  }

  // Check section depth (should have content under each section)
  const sections = content.match(/##?\s+([^\n]+)/g) || [];
  let emptySections = 0;

  sections.forEach(sectionHeader => {
    const sectionStart = content.indexOf(sectionHeader);
    const nextSectionStart = content.indexOf('##', sectionStart + 1);
    const sectionContent = nextSectionStart > -1 
      ? content.substring(sectionStart, nextSectionStart)
      : content.substring(sectionStart);
    
    const contentLength = sectionContent.replace(sectionHeader, '').trim().length;
    if (contentLength < 50) {
      emptySections++;
    }
  });

  if (emptySections > 0) {
    issues.push(`${emptySections} sections have insufficient content`);
    score -= 0.1 * (emptySections / sections.length);
  }

  return { score: Math.max(0, score), issues };
};

// Cross-step consistency assessment
export const assessCrossStepConsistency = (stepResults: Record<string, any>): { score: number; issues: string[] } => {
  const issues: string[] = [];
  let score = 1.0;

  if (Object.keys(stepResults).length < 2) {
    return { score: 1.0, issues: [] }; // No consistency to check yet
  }

  // Extract key terms from each step
  const allContent = Object.values(stepResults).map(r => r?.content || '').join(' ');
  
  // Check party consistency
  const partyMentions = allContent.match(/\b(plaintiff|defendant|petitioner|respondent)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi) || [];
  const parties = [...new Set(partyMentions.map(p => p.split(/\s+/).slice(1).join(' ')))];
  
  Object.entries(stepResults).forEach(([stepType, result]) => {
    if (result?.content) {
      parties.forEach(party => {
        if (party && result.content.includes('plaintiff') || result.content.includes('defendant')) {
          if (!result.content.includes(party)) {
            issues.push(`Party "${party}" not consistently referenced in ${stepType}`);
            score -= 0.05;
          }
        }
      });
    }
  });

  // Check legal issue consistency
  const prelimAnalysis = stepResults['PRELIMINARY_ANALYSIS']?.content || '';
  const iracAnalysis = stepResults['IRAC_ANALYSIS']?.content || '';
  
  if (prelimAnalysis && iracAnalysis) {
    const prelimIssues = prelimAnalysis.match(/(?:^|\n)\s*[\d.-]+\s*(.+?)(?=\n|$)/gm) || [];
    const addressedInIrac = prelimIssues.filter(issue => {
      const issueText = issue.replace(/^[\d.-]+\s*/, '').trim();
      return issueText && iracAnalysis.includes(issueText.substring(0, 20));
    });
    
    if (prelimIssues.length > 0 && addressedInIrac.length / prelimIssues.length < 0.7) {
      issues.push('Not all preliminary issues are addressed in IRAC analysis');
      score -= 0.2;
    }
  }

  return { score: Math.max(0, score), issues };
};

// Comprehensive quality assessment
export const assessOverallQuality = (stepResults: Record<string, any>, expectedStructure: Record<string, string[]>): QualityAssessment => {
  const allContent = Object.values(stepResults).map(r => r?.content || '').join('\n\n');
  
  // Individual assessments
  const professionalWriting = assessProfessionalWriting(allContent);
  const citationQuality = assessCitationQuality(allContent);
  const consistency = assessCrossStepConsistency(stepResults);
  
  // Structural assessment across all steps
  const allExpectedSections = Object.values(expectedStructure).flat();
  const structural = assessStructuralCompleteness(allContent, allExpectedSections);
  
  // Completeness assessment
  const completeness = {
    score: Math.min(1.0, Object.keys(stepResults).length / 9), // 9 total steps
    issues: Object.keys(stepResults).length < 9 ? ['Analysis workflow incomplete'] : []
  };

  // Calculate overall metrics
  const metrics: QualityMetrics = {
    overallScore: (professionalWriting.score + citationQuality.score + consistency.score + structural.score + completeness.score) / 5,
    structuralScore: structural.score,
    citationScore: citationQuality.score,
    consistencyScore: consistency.score,
    professionalismScore: professionalWriting.score,
    completenessScore: completeness.score
  };

  // Collect all issues
  const criticalIssues = [
    ...professionalWriting.issues,
    ...citationQuality.issues,
    ...consistency.issues,
    ...structural.issues,
    ...completeness.issues
  ].filter(issue => issue.includes('Missing') || issue.includes('not') || issue.includes('too'));

  const recommendations = [
    ...professionalWriting.issues,
    ...citationQuality.issues,
    ...consistency.issues,
    ...structural.issues,
    ...completeness.issues
  ].filter(issue => issue.includes('may') || issue.includes('should') || issue.includes('recommend'));

  // Quality gate - passes if overall score >= 0.7 and no critical structural issues
  const passesQuality = metrics.overallScore >= 0.7 && 
                       metrics.structuralScore >= 0.6 && 
                       criticalIssues.filter(i => i.includes('Missing')).length === 0;

  return {
    metrics,
    criticalIssues,
    recommendations,
    passesQuality
  };
};

// Quality control enforcement
export const enforceQualityStandards = (assessment: QualityAssessment): { canProceed: boolean; message: string } => {
  if (!assessment.passesQuality) {
    const message = assessment.criticalIssues.length > 0 
      ? `Critical quality issues: ${assessment.criticalIssues.slice(0, 3).join('; ')}`
      : `Overall quality score too low (${assessment.metrics.overallScore.toFixed(2)}/1.0)`;
    
    return {
      canProceed: false,
      message
    };
  }

  if (assessment.recommendations.length > 0) {
    return {
      canProceed: true,
      message: `Quality passed with recommendations: ${assessment.recommendations.slice(0, 2).join('; ')}`
    };
  }

  return {
    canProceed: true,
    message: `Quality standards met (score: ${assessment.metrics.overallScore.toFixed(2)}/1.0)`
  };
};