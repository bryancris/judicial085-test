import { 
  IracIssue, 
  IracAnalysis, 
  RiskAssessmentAnalysis, 
  IssueRiskAssessment,
  Challenge,
  OpposingArgument,
  BurdenOfProofElement,
  RiskLevel,
  RiskCategory
} from '@/types/caseAnalysis';

// Keywords that indicate potential vulnerabilities
const VULNERABILITY_KEYWORDS = {
  high: ['lacks evidence', 'difficult to prove', 'unclear', 'uncertain', 'disputed', 'contested', 'ambiguous'],
  medium: ['may be difficult', 'could be challenged', 'some uncertainty', 'potential issue', 'needs clarification'],
  legal: ['precedent unclear', 'split jurisdiction', 'novel issue', 'conflicting cases'],
  factual: ['witness unavailable', 'no documentation', 'disputed fact', 'credibility issue'],
  evidentiary: ['hearsay', 'privileged', 'excluded evidence', 'authentication needed']
};

// Common opposing arguments by legal category
const OPPOSING_ARGUMENTS_BY_CATEGORY = {
  'Contract Law': [
    'Contract terms are ambiguous and should be interpreted against drafter',
    'Performance was excused due to impossibility or frustration',
    'Contract was unconscionable or procured by duress/fraud',
    'Statute of limitations bars the claim'
  ],
  'Tort Law': [
    'Plaintiff was contributorily/comparatively negligent',
    'Defendant owed no duty of care to plaintiff',
    'Causation is lacking - intervening/superseding cause',
    'Damages are speculative and not proximately caused'
  ],
  'Property Law': [
    'Title defects preclude valid ownership claim',
    'Adverse possession requirements not met',
    'Zoning restrictions prohibit proposed use',
    'Environmental regulations create compliance issues'
  ],
  'Employment Law': [
    'Employee was at-will and termination was lawful',
    'Legitimate business reason existed for adverse action',
    'Employee failed to exhaust administrative remedies',
    'Statute of limitations has expired'
  ]
};

// Burden of proof elements by legal category
const BURDEN_ELEMENTS_BY_CATEGORY = {
  'Contract Law': [
    { element: 'Formation', description: 'Valid contract was formed with mutual assent and consideration' },
    { element: 'Performance', description: 'Plaintiff performed or was ready to perform contractual obligations' },
    { element: 'Breach', description: 'Defendant materially breached the contract' },
    { element: 'Damages', description: 'Plaintiff suffered damages as a result of the breach' }
  ],
  'Tort Law': [
    { element: 'Duty', description: 'Defendant owed a legal duty of care to plaintiff' },
    { element: 'Breach', description: 'Defendant breached the standard of care' },
    { element: 'Causation', description: 'Defendant\'s breach was the cause-in-fact and proximate cause' },
    { element: 'Damages', description: 'Plaintiff suffered actual damages' }
  ]
};

/**
 * Analyzes IRAC issues for potential risks and vulnerabilities using real 3-agent analysis
 */
export function analyzeRiskAssessment(analysis: IracAnalysis, realAnalysisContent?: string): RiskAssessmentAnalysis {
  const issueRisks = analysis.legalIssues.map(issue => analyzeIssueRisk(issue, realAnalysisContent));
  
  // Extract real vulnerabilities and strengths from the 3-agent analysis content
  const realRiskData = realAnalysisContent ? extractRealRiskData(realAnalysisContent) : null;
  
  return {
    issueRisks,
    overallCaseRisk: realRiskData?.overallRisk || calculateOverallRisk(issueRisks),
    criticalVulnerabilities: realRiskData?.criticalVulnerabilities || identifyCriticalVulnerabilities(issueRisks),
    strengthsByCategory: realRiskData?.categoryStrengths || calculateCategoryStrengths(issueRisks),
    recommendedActions: realRiskData?.recommendedActions || generateRecommendedActions(issueRisks),
    riskMitigationPlan: realRiskData?.mitigationPlan || generateMitigationPlan(issueRisks)
  };
}

/**
 * Analyzes risk for a single IRAC issue using real analysis content
 */
function analyzeIssueRisk(issue: IracIssue, realAnalysisContent?: string): IssueRiskAssessment {
  const challenges = identifyChallenges(issue, realAnalysisContent);
  const opposingArguments = generateOpposingArguments(issue, realAnalysisContent);
  const burdenOfProof = analyzeBurdenOfProof(issue, realAnalysisContent);
  const evidenceAdequacy = calculateEvidenceAdequacy(issue, burdenOfProof, realAnalysisContent);
  
  return {
    issueId: issue.id,
    overallRisk: calculateIssueRisk(challenges, opposingArguments, evidenceAdequacy),
    challenges,
    opposingArguments,
    burdenOfProof,
    evidenceAdequacy,
    riskFactors: extractRiskFactors(issue, challenges),
    mitigationPriority: determineMitigationPriority(challenges, evidenceAdequacy)
  };
}

/**
 * Identifies potential challenges for an issue using real analysis content
 */
function identifyChallenges(issue: IracIssue, realAnalysisContent?: string): Challenge[] {
  const challenges: Challenge[] = [];
  const analysisText = realAnalysisContent || `${issue.issueStatement} ${issue.rule} ${issue.application} ${issue.conclusion}`;
  
  // Extract real challenges from the 3-agent analysis
  if (realAnalysisContent) {
    const realChallenges = extractRealChallenges(realAnalysisContent, issue);
    challenges.push(...realChallenges);
  }
  
  // Check for vulnerability keywords as fallback
  Object.entries(VULNERABILITY_KEYWORDS).forEach(([level, keywords]) => {
    if (level === 'high' || level === 'medium') {
      keywords.forEach(keyword => {
        if (analysisText.toLowerCase().includes(keyword.toLowerCase())) {
          challenges.push({
            id: `${issue.id}-challenge-${challenges.length}`,
            title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Issue`,
            description: `The analysis indicates "${keyword}" which may present challenges in proving this element.`,
            category: determineRiskCategory(keyword),
            riskLevel: level as RiskLevel,
            impact: generateImpactDescription(keyword, level as RiskLevel),
            mitigationSuggestions: generateMitigationSuggestions(keyword, level as RiskLevel)
          });
        }
      });
    }
  });

  // Add category-specific challenges
  if (issue.category) {
    const categoryRisks = getCategorySpecificRisks(issue.category, issue);
    challenges.push(...categoryRisks);
  }

  return challenges.slice(0, 5); // Limit to top 5 most relevant challenges
}

/**
 * Generates likely opposing arguments using real analysis content
 */
function generateOpposingArguments(issue: IracIssue, realAnalysisContent?: string): OpposingArgument[] {
  // Extract real opposing arguments from the 3-agent analysis
  if (realAnalysisContent) {
    const realOpposingArgs = extractRealOpposingArguments(realAnalysisContent, issue);
    if (realOpposingArgs.length > 0) {
      return realOpposingArgs;
    }
  }
  
  // Fallback to template arguments
  const category = issue.category || 'General';
  const templateArguments = OPPOSING_ARGUMENTS_BY_CATEGORY[category] || [
    'Plaintiff has failed to meet their burden of proof',
    'The legal theory is not supported by applicable law',
    'Damages are speculative and cannot be proven',
    'Statute of limitations bars this claim'
  ];

  return templateArguments.slice(0, 3).map((arg, index) => ({
    id: `${issue.id}-opposing-${index}`,
    argument: arg,
    strength: assessArgumentStrength(arg, issue, realAnalysisContent),
    potentialEvidence: generatePotentialEvidence(arg),
    counterStrategy: generateCounterStrategy(arg)
  }));
}

/**
 * Analyzes burden of proof requirements using real analysis content
 */
function analyzeBurdenOfProof(issue: IracIssue, realAnalysisContent?: string): BurdenOfProofElement[] {
  // Extract real burden elements from the 3-agent analysis
  if (realAnalysisContent) {
    const realBurdenElements = extractRealBurdenElements(realAnalysisContent, issue);
    if (realBurdenElements.length > 0) {
      return realBurdenElements;
    }
  }
  
  // Fallback to template elements
  const category = issue.category || 'General';
  const templateElements = BURDEN_ELEMENTS_BY_CATEGORY[category] || [
    { element: 'Legal Basis', description: 'Establish valid legal theory under applicable law' },
    { element: 'Factual Support', description: 'Prove material facts supporting the claim' },
    { element: 'Causation', description: 'Demonstrate causal relationship between actions and harm' },
    { element: 'Damages', description: 'Prove actual damages or harm suffered' }
  ];

  return templateElements.map((elem, index) => ({
    id: `${issue.id}-burden-${index}`,
    element: elem.element,
    description: elem.description,
    difficultyLevel: assessElementDifficulty(elem.element, issue, realAnalysisContent),
    evidenceStrength: assessEvidenceStrength(elem.element, issue, realAnalysisContent),
    requiredEvidence: generateRequiredEvidence(elem.element),
    currentEvidence: extractCurrentEvidence(elem.element, issue, realAnalysisContent),
    evidenceGaps: identifyEvidenceGaps(elem.element, issue, realAnalysisContent)
  }));
}

// Helper functions

function determineRiskCategory(keyword: string): RiskCategory {
  if (VULNERABILITY_KEYWORDS.legal.some(k => keyword.includes(k))) return 'legal';
  if (VULNERABILITY_KEYWORDS.factual.some(k => keyword.includes(k))) return 'factual';
  if (VULNERABILITY_KEYWORDS.evidentiary.some(k => keyword.includes(k))) return 'evidentiary';
  return 'legal';
}

function calculateOverallRisk(issueRisks: IssueRiskAssessment[]): RiskLevel {
  const riskScores = issueRisks.map(risk => {
    switch (risk.overallRisk) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  });
  
  const averageScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
  
  if (averageScore >= 2.5) return 'high';
  if (averageScore >= 1.5) return 'medium';
  return 'low';
}

function calculateIssueRisk(challenges: Challenge[], opposingArguments: OpposingArgument[], evidenceAdequacy: number): RiskLevel {
  const highRiskChallenges = challenges.filter(c => c.riskLevel === 'high').length;
  const strongOpposition = opposingArguments.filter(a => a.strength === 'high').length;
  
  if (highRiskChallenges > 1 || strongOpposition > 1 || evidenceAdequacy < 40) return 'high';
  if (highRiskChallenges > 0 || strongOpposition > 0 || evidenceAdequacy < 70) return 'medium';
  return 'low';
}

function calculateEvidenceAdequacy(issue: IracIssue, burdenElements: BurdenOfProofElement[], realAnalysisContent?: string): number {
  // If we have real analysis content, try to extract evidence strength from it
  if (realAnalysisContent) {
    const realEvidenceStrength = extractRealEvidenceStrength(realAnalysisContent, issue);
    if (realEvidenceStrength !== null) {
      return realEvidenceStrength;
    }
  }
  
  const strengths = burdenElements.map(elem => elem.evidenceStrength);
  return strengths.reduce((sum, strength) => sum + strength, 0) / strengths.length;
}

function assessArgumentStrength(argument: string, issue: IracIssue, realAnalysisContent?: string): RiskLevel {
  // If we have real analysis, assess strength based on how the analysis addresses this argument
  if (realAnalysisContent) {
    const realStrength = assessRealArgumentStrength(argument, realAnalysisContent);
    if (realStrength) return realStrength;
  }
  
  // Simple heuristic based on argument type and issue content
  if (argument.includes('statute of limitations') || argument.includes('burden of proof')) return 'high';
  if (argument.includes('may be') || argument.includes('could be')) return 'medium';
  return 'medium'; // Default to medium for most arguments
}

function assessElementDifficulty(element: string, issue: IracIssue, realAnalysisContent?: string): RiskLevel {
  const applicationText = issue.application.toLowerCase();
  const analysisText = realAnalysisContent?.toLowerCase() || '';
  
  // Check real analysis for difficulty indicators
  if (analysisText.includes('difficult to prove') || analysisText.includes('challenging') || 
      analysisText.includes('uncertain') || analysisText.includes('disputed')) return 'high';
  if (analysisText.includes('some difficulty') || analysisText.includes('potential issue')) return 'medium';
  
  // Fallback to original logic
  if (applicationText.includes('difficult') || applicationText.includes('challenging')) return 'high';
  if (applicationText.includes('some uncertainty') || applicationText.includes('may')) return 'medium';
  return 'low';
}

function assessEvidenceStrength(element: string, issue: IracIssue, realAnalysisContent?: string): number {
  const text = issue.application.toLowerCase();
  const analysisText = realAnalysisContent?.toLowerCase() || '';
  
  // Analyze real content for evidence strength indicators
  if (analysisText.includes('strong evidence') || analysisText.includes('well-documented') || 
      analysisText.includes('clear') || analysisText.includes('compelling')) return 85;
  if (analysisText.includes('sufficient evidence') || analysisText.includes('likely')) return 65;
  if (analysisText.includes('limited evidence') || analysisText.includes('lacks evidence') || 
      analysisText.includes('uncertain') || analysisText.includes('disputed')) return 40;
  
  // Fallback to original logic
  if (text.includes('strong evidence') || text.includes('clear')) return 85;
  if (text.includes('some evidence') || text.includes('likely')) return 65;
  if (text.includes('limited evidence') || text.includes('uncertain')) return 40;
  return 70; // Default moderate strength
}

function generateImpactDescription(keyword: string, level: RiskLevel): string {
  const impacts = {
    high: 'Could significantly weaken the case or result in summary judgment',
    medium: 'May create additional hurdles in proving this element',
    low: 'Minor concern that can be addressed with additional preparation'
  };
  return impacts[level];
}

function generateMitigationSuggestions(keyword: string, level: RiskLevel): string[] {
  const suggestions = [
    'Conduct additional fact investigation',
    'Obtain expert witness testimony',
    'Seek additional documentary evidence',
    'Consider alternative legal theories',
    'Prepare for motion practice'
  ];
  return suggestions.slice(0, level === 'high' ? 4 : 2);
}

function getCategorySpecificRisks(category: string, issue: IracIssue): Challenge[] {
  // This would be expanded with category-specific risk analysis
  return [];
}

function generatePotentialEvidence(argument: string): string[] {
  return [
    'Documentary evidence',
    'Witness testimony',
    'Expert analysis',
    'Precedent cases'
  ];
}

function generateCounterStrategy(argument: string): string {
  return 'Prepare comprehensive response addressing this argument with supporting evidence and legal authority.';
}

function generateRequiredEvidence(element: string): string[] {
  const evidenceMap: Record<string, string[]> = {
    'Formation': ['Written contract', 'Email correspondence', 'Witness testimony'],
    'Performance': ['Performance records', 'Payment receipts', 'Delivery confirmations'],
    'Breach': ['Notice of breach', 'Documentation of non-performance', 'Communications'],
    'Damages': ['Financial records', 'Lost profit calculations', 'Mitigation efforts']
  };
  return evidenceMap[element] || ['Relevant documentation', 'Witness testimony', 'Expert analysis'];
}

function extractCurrentEvidence(element: string, issue: IracIssue, realAnalysisContent?: string): string[] {
  // Extract evidence mentioned in the real analysis or application section
  const mentions = [];
  const analysisText = realAnalysisContent || issue.application;
  
  if (analysisText.includes('contract') || analysisText.includes('agreement')) mentions.push('Contract documents');
  if (analysisText.includes('witness') || analysisText.includes('testimony')) mentions.push('Witness testimony');
  if (analysisText.includes('record') || analysisText.includes('documentation')) mentions.push('Business records');
  if (analysisText.includes('receipt') || analysisText.includes('invoice')) mentions.push('Financial records');
  if (analysisText.includes('repair') || analysisText.includes('service')) mentions.push('Repair records');
  if (analysisText.includes('communication') || analysisText.includes('email')) mentions.push('Communications');
  
  return mentions;
}

function identifyEvidenceGaps(element: string, issue: IracIssue, realAnalysisContent?: string): string[] {
  const required = generateRequiredEvidence(element);
  const current = extractCurrentEvidence(element, issue, realAnalysisContent);
  return required.filter(req => !current.some(cur => cur.toLowerCase().includes(req.toLowerCase())));
}

function identifyCriticalVulnerabilities(issueRisks: IssueRiskAssessment[]): string[] {
  return issueRisks
    .filter(risk => risk.overallRisk === 'high')
    .flatMap(risk => risk.challenges.filter(c => c.riskLevel === 'high').map(c => c.title))
    .slice(0, 5);
}

function calculateCategoryStrengths(issueRisks: IssueRiskAssessment[]): Record<RiskCategory, number> {
  const categories: RiskCategory[] = ['factual', 'legal', 'procedural', 'evidentiary', 'damages'];
  const strengths: Record<RiskCategory, number> = {} as Record<RiskCategory, number>;
  
  categories.forEach(category => {
    const categoryRisks = issueRisks.flatMap(risk => 
      risk.challenges.filter(c => c.category === category)
    );
    
    if (categoryRisks.length === 0) {
      // If no specific risks found, assume moderate strength (75%)
      strengths[category] = 75;
    } else {
      // Calculate strength based on risk levels (inverted - high risk = low strength)
      const avgRisk = categoryRisks.reduce((sum, c) => {
        return sum + (c.riskLevel === 'high' ? 30 : c.riskLevel === 'medium' ? 60 : 85);
      }, 0) / categoryRisks.length;
      strengths[category] = Math.round(avgRisk);
    }
  });
  
  return strengths;
}

function generateRecommendedActions(issueRisks: IssueRiskAssessment[]): string[] {
  const actions = [
    'Prioritize evidence gathering for high-risk issues',
    'Prepare comprehensive responses to likely opposing arguments',
    'Consider settlement discussions for vulnerable claims',
    'Develop alternative legal theories as backup strategies'
  ];
  return actions;
}

function generateMitigationPlan(issueRisks: IssueRiskAssessment[]): string[] {
  return [
    'Immediate: Address critical vulnerabilities identified',
    'Short-term: Strengthen evidence for medium-risk issues',
    'Long-term: Develop comprehensive litigation strategy',
    'Ongoing: Monitor case developments and adjust approach'
  ];
}

function extractRiskFactors(issue: IracIssue, challenges: Challenge[]): string[] {
  return challenges.map(c => c.title).slice(0, 3);
}

function determineMitigationPriority(challenges: Challenge[], evidenceAdequacy: number): 'critical' | 'important' | 'moderate' | 'low' {
  const highRiskCount = challenges.filter(c => c.riskLevel === 'high').length;
  if (highRiskCount > 1 || evidenceAdequacy < 40) return 'critical';
  if (highRiskCount > 0 || evidenceAdequacy < 60) return 'important';
  if (evidenceAdequacy < 80) return 'moderate';
  return 'low';
}

// ============= NEW FUNCTIONS FOR REAL 3-AGENT ANALYSIS PARSING =============

/**
 * Extracts real risk data from the 3-agent analysis content
 */
function extractRealRiskData(analysisContent: string): {
  overallRisk: RiskLevel;
  criticalVulnerabilities: string[];
  categoryStrengths: Record<RiskCategory, number>;
  recommendedActions: string[];
  mitigationPlan: string[];
} | null {
  const content = analysisContent.toLowerCase();
  
  // Determine overall risk based on analysis content
  let overallRisk: RiskLevel = 'medium';
  if (content.includes('strong case') || content.includes('likely to succeed') || content.includes('well-supported')) {
    overallRisk = 'low';
  } else if (content.includes('significant challenges') || content.includes('difficult to prove') || content.includes('lacks evidence')) {
    overallRisk = 'high';
  }
  
  // Extract vulnerabilities mentioned in the analysis
  const criticalVulnerabilities: string[] = [];
  if (content.includes('notice requirement')) criticalVulnerabilities.push('Statutory notice compliance');
  if (content.includes('statute of limitations')) criticalVulnerabilities.push('Timeliness of claim');
  if (content.includes('burden of proof')) criticalVulnerabilities.push('Evidence sufficiency');
  if (content.includes('disputed')) criticalVulnerabilities.push('Disputed facts');
  
  // Calculate category strengths based on analysis content
  const categoryStrengths: Record<RiskCategory, number> = {
    factual: content.includes('well-documented') || content.includes('clear facts') ? 85 : 
             content.includes('disputed facts') ? 45 : 70,
    legal: content.includes('strong legal basis') || content.includes('clear precedent') ? 85 :
           content.includes('novel issue') || content.includes('unclear law') ? 45 : 70,
    procedural: content.includes('properly filed') || content.includes('timely') ? 85 :
                content.includes('notice') || content.includes('deadline') ? 50 : 75,
    evidentiary: content.includes('strong evidence') || content.includes('documented') ? 85 :
                 content.includes('lacks evidence') || content.includes('insufficient') ? 40 : 70,
    damages: content.includes('clear damages') || content.includes('quantifiable') ? 85 :
             content.includes('speculative') || content.includes('difficult to prove damages') ? 45 : 70
  };
  
  // Generate recommended actions based on analysis
  const recommendedActions: string[] = [];
  if (content.includes('notice')) recommendedActions.push('Verify statutory notice compliance');
  if (content.includes('evidence')) recommendedActions.push('Strengthen evidentiary support');
  if (content.includes('expert')) recommendedActions.push('Consider expert witness testimony');
  if (content.includes('settlement')) recommendedActions.push('Evaluate settlement opportunities');
  
  // Generate mitigation plan
  const mitigationPlan: string[] = [];
  if (overallRisk === 'high') {
    mitigationPlan.push('Immediate: Address critical vulnerabilities');
    mitigationPlan.push('Priority: Strengthen weak elements');
  } else {
    mitigationPlan.push('Monitor case developments');
    mitigationPlan.push('Prepare comprehensive strategy');
  }
  
  return {
    overallRisk,
    criticalVulnerabilities,
    categoryStrengths,
    recommendedActions,
    mitigationPlan
  };
}

/**
 * Extracts real challenges from the 3-agent analysis
 */
function extractRealChallenges(analysisContent: string, issue: IracIssue): Challenge[] {
  const challenges: Challenge[] = [];
  const content = analysisContent.toLowerCase();
  
  // Look for specific challenges mentioned in the analysis
  if (content.includes('notice requirement') || content.includes('written notice')) {
    challenges.push({
      id: `${issue.id}-real-notice`,
      title: 'Statutory Notice Requirement',
      description: 'Analysis indicates potential issues with statutory notice compliance',
      category: 'procedural',
      riskLevel: content.includes('crucial') || content.includes('critical') ? 'high' : 'medium',
      impact: 'Could result in dismissal if notice requirement not met',
      mitigationSuggestions: ['Verify notice was properly sent', 'Obtain proof of delivery', 'Review statutory requirements']
    });
  }
  
  if (content.includes('burden of proof') || content.includes('difficult to prove')) {
    challenges.push({
      id: `${issue.id}-real-burden`,
      title: 'Burden of Proof Challenge',
      description: 'Analysis identifies difficulties in meeting burden of proof requirements',
      category: 'legal',
      riskLevel: 'medium',
      impact: 'May require additional evidence to succeed',
      mitigationSuggestions: ['Gather additional evidence', 'Consider expert testimony', 'Review case precedents']
    });
  }
  
  return challenges;
}

/**
 * Extracts real opposing arguments from the 3-agent analysis
 */
function extractRealOpposingArguments(analysisContent: string, issue: IracIssue): OpposingArgument[] {
  const opposingArgs: OpposingArgument[] = [];
  const content = analysisContent.toLowerCase();
  
  // Look for potential opposing arguments mentioned in the analysis
  if (content.includes('manufacturer') && content.includes('defense')) {
    opposingArgs.push({
      id: `${issue.id}-real-defense-1`,
      argument: 'Manufacturer will argue proper notice was not provided',
      strength: content.includes('strong') ? 'high' : 'medium',
      potentialEvidence: ['Notice documentation', 'Delivery records', 'Communication logs'],
      counterStrategy: 'Provide clear evidence of proper notice and delivery'
    });
  }
  
  return opposingArgs;
}

/**
 * Extracts real burden of proof elements from the 3-agent analysis
 */
function extractRealBurdenElements(analysisContent: string, issue: IracIssue): BurdenOfProofElement[] {
  const elements: BurdenOfProofElement[] = [];
  const content = analysisContent.toLowerCase();
  
  // Extract specific burden elements mentioned in lemon law analysis
  if (content.includes('lemon') || content.includes('motor vehicle')) {
    elements.push({
      id: `${issue.id}-real-burden-vehicle`,
      element: 'Vehicle Qualification',
      description: 'Prove vehicle qualifies as "lemon" under applicable law',
      difficultyLevel: content.includes('clear') ? 'low' : 'medium',
      evidenceStrength: content.includes('well-documented') ? 85 : 70,
      requiredEvidence: ['Repair records', 'Service documentation', 'Days out of service records'],
      currentEvidence: ['Multiple repair attempts documented', 'Service records available'],
      evidenceGaps: ['Complete repair history', 'Manufacturer communications']
    });
  }
  
  return elements;
}

/**
 * Extracts evidence strength from real analysis content
 */
function extractRealEvidenceStrength(analysisContent: string, issue: IracIssue): number | null {
  const content = analysisContent.toLowerCase();
  
  if (content.includes('strong evidence') || content.includes('well-documented')) return 85;
  if (content.includes('sufficient evidence') || content.includes('documented')) return 70;
  if (content.includes('limited evidence') || content.includes('lacks evidence')) return 40;
  if (content.includes('some evidence')) return 60;
  
  return null; // No clear indication found
}

/**
 * Assesses argument strength based on real analysis content
 */
function assessRealArgumentStrength(argument: string, realAnalysisContent: string): RiskLevel | null {
  const content = realAnalysisContent.toLowerCase();
  
  if (argument.toLowerCase().includes('notice')) {
    if (content.includes('critical') || content.includes('crucial')) return 'high';
    if (content.includes('important') || content.includes('verify')) return 'medium';
    return 'low';
  }
  
  return null; // No specific assessment available
}