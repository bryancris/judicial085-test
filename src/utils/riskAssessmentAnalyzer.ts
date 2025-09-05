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
 * Analyzes IRAC issues for potential risks and vulnerabilities
 */
export function analyzeRiskAssessment(analysis: IracAnalysis): RiskAssessmentAnalysis {
  const issueRisks = analysis.legalIssues.map(issue => analyzeIssueRisk(issue));
  
  return {
    issueRisks,
    overallCaseRisk: calculateOverallRisk(issueRisks),
    criticalVulnerabilities: identifyCriticalVulnerabilities(issueRisks),
    strengthsByCategory: calculateCategoryStrengths(issueRisks),
    recommendedActions: generateRecommendedActions(issueRisks),
    riskMitigationPlan: generateMitigationPlan(issueRisks)
  };
}

/**
 * Analyzes risk for a single IRAC issue
 */
function analyzeIssueRisk(issue: IracIssue): IssueRiskAssessment {
  const challenges = identifyChallenges(issue);
  const opposingArguments = generateOpposingArguments(issue);
  const burdenOfProof = analyzeBurdenOfProof(issue);
  const evidenceAdequacy = calculateEvidenceAdequacy(issue, burdenOfProof);
  
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
 * Identifies potential challenges for an issue
 */
function identifyChallenges(issue: IracIssue): Challenge[] {
  const challenges: Challenge[] = [];
  const fullText = `${issue.issueStatement} ${issue.rule} ${issue.application} ${issue.conclusion}`;
  
  // Check for vulnerability keywords
  Object.entries(VULNERABILITY_KEYWORDS).forEach(([level, keywords]) => {
    if (level === 'high' || level === 'medium') {
      keywords.forEach(keyword => {
        if (fullText.toLowerCase().includes(keyword.toLowerCase())) {
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
 * Generates likely opposing arguments
 */
function generateOpposingArguments(issue: IracIssue): OpposingArgument[] {
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
    strength: assessArgumentStrength(arg, issue),
    potentialEvidence: generatePotentialEvidence(arg),
    counterStrategy: generateCounterStrategy(arg)
  }));
}

/**
 * Analyzes burden of proof requirements
 */
function analyzeBurdenOfProof(issue: IracIssue): BurdenOfProofElement[] {
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
    difficultyLevel: assessElementDifficulty(elem.element, issue),
    evidenceStrength: assessEvidenceStrength(elem.element, issue),
    requiredEvidence: generateRequiredEvidence(elem.element),
    currentEvidence: extractCurrentEvidence(elem.element, issue),
    evidenceGaps: identifyEvidenceGaps(elem.element, issue)
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

function calculateEvidenceAdequacy(issue: IracIssue, burdenElements: BurdenOfProofElement[]): number {
  const strengths = burdenElements.map(elem => elem.evidenceStrength);
  return strengths.reduce((sum, strength) => sum + strength, 0) / strengths.length;
}

function assessArgumentStrength(argument: string, issue: IracIssue): RiskLevel {
  // Simple heuristic based on argument type and issue content
  if (argument.includes('statute of limitations') || argument.includes('burden of proof')) return 'high';
  if (argument.includes('may be') || argument.includes('could be')) return 'medium';
  return 'medium'; // Default to medium for most arguments
}

function assessElementDifficulty(element: string, issue: IracIssue): RiskLevel {
  const applicationText = issue.application.toLowerCase();
  if (applicationText.includes('difficult') || applicationText.includes('challenging')) return 'high';
  if (applicationText.includes('some uncertainty') || applicationText.includes('may')) return 'medium';
  return 'low';
}

function assessEvidenceStrength(element: string, issue: IracIssue): number {
  // Simple scoring based on text analysis
  const text = issue.application.toLowerCase();
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

function extractCurrentEvidence(element: string, issue: IracIssue): string[] {
  // Extract evidence mentioned in the application section
  const mentions = [];
  const text = issue.application;
  if (text.includes('contract')) mentions.push('Contract documents');
  if (text.includes('witness')) mentions.push('Witness testimony');
  if (text.includes('record')) mentions.push('Business records');
  return mentions;
}

function identifyEvidenceGaps(element: string, issue: IracIssue): string[] {
  const required = generateRequiredEvidence(element);
  const current = extractCurrentEvidence(element, issue);
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
    const avgRisk = categoryRisks.length > 0 
      ? categoryRisks.reduce((sum, c) => sum + (c.riskLevel === 'high' ? 1 : c.riskLevel === 'medium' ? 2 : 3), 0) / categoryRisks.length
      : 3;
    strengths[category] = Math.round((avgRisk / 3) * 100);
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