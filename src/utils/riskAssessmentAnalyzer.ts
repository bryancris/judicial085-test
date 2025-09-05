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
 * Parse real analysis content by issues to provide issue-specific content
 */
function parseRealAnalysisByIssues(realAnalysisContent: string, issues: IracIssue[]): Map<string, string> {
  console.log('🔍 Parsing real analysis by issues...');
  const issueContentMap = new Map<string, string>();
  
  if (!realAnalysisContent) {
    console.log('❌ No real analysis content provided');
    return issueContentMap;
  }

  // Split the analysis into sections by issue markers
  const sections = realAnalysisContent.split(/\*\*ISSUE\s*\[\d+\]\:\*\*|\*\*Issue\s*\d+\:\*\*/i);
  
  console.log(`📋 Found ${sections.length} potential issue sections`);
  
  issues.forEach((issue, index) => {
    // Try to find the section that corresponds to this issue
    let issueContent = '';
    
    if (sections.length > index + 1) {
      // Use the section that corresponds to this issue index
      issueContent = sections[index + 1];
    } else {
      // Fallback: search for content that matches issue keywords
      const issueKeywords = extractIssueKeywords(issue);
      console.log(`🔑 Issue keywords for "${issue.issueStatement}":`, issueKeywords);
      
      const matchingSection = sections.find(section => {
        const sectionLower = section.toLowerCase();
        return issueKeywords.some(keyword => 
          sectionLower.includes(keyword.toLowerCase())
        );
      });
      
      issueContent = matchingSection || realAnalysisContent.slice(0, 1000); // Fallback to first 1000 chars
    }
    
    // Clean up the content
    issueContent = issueContent
      .split(/\*\*ISSUE\s*\[\d+\]\:\*\*|\*\*Issue\s*\d+\:\*\*/i)[0] // Stop at next issue
      .split(/\*\*OVERALL CONCLUSION\*\*|overall conclusion/i)[0] // Stop at conclusion
      .trim();
    
    issueContentMap.set(issue.id, issueContent);
    console.log(`📝 Issue "${issue.issueStatement.slice(0, 50)}..." mapped to ${issueContent.length} chars`);
  });
  
  return issueContentMap;
}

/**
 * Extract keywords from an issue to help match it with analysis content
 */
function extractIssueKeywords(issue: IracIssue): string[] {
  const keywords: string[] = [];
  
  // Extract key terms from issue statement
  const issueWords = issue.issueStatement.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['does', 'have', 'valid', 'claim', 'under', 'will', 'this', 'that', 'from', 'with'].includes(word));
  
  keywords.push(...issueWords);
  
  // Add category if available
  if (issue.category) {
    keywords.push(issue.category.toLowerCase());
  }
  
  // Add specific legal terms from the rule
  const ruleWords = issue.rule.toLowerCase().match(/\b\w{4,}\b/g) || [];
  keywords.push(...ruleWords.slice(0, 5)); // Limit to first 5 meaningful words
  
  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Analyzes IRAC issues for potential risks and vulnerabilities using real 3-agent analysis
 */
export function analyzeRiskAssessment(analysis: IracAnalysis, realAnalysisContent?: string): RiskAssessmentAnalysis {
  console.log('🎯 Starting risk assessment analysis...');
  
  // Parse real analysis content by issues to provide issue-specific content
  const issueContentMap = realAnalysisContent ? 
    parseRealAnalysisByIssues(realAnalysisContent, analysis.legalIssues) : 
    new Map<string, string>();
  
  const issueRisks = analysis.legalIssues.map((issue, index) => {
    const issueSpecificContent = issueContentMap.get(issue.id);
    console.log(`⚖️ Analyzing risk for Issue ${index + 1}: "${issue.issueStatement.slice(0, 50)}..."`);
    console.log(`📄 Issue-specific content: ${issueSpecificContent?.length || 0} characters`);
    
    return analyzeIssueRisk(issue, issueSpecificContent);
  });
  
  console.log('📊 Risk assessment completed');
  
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
  // Get all high and medium risk challenges from all issues
  const criticalChallenges = issueRisks
    .flatMap(risk => risk.challenges.filter(c => c.riskLevel === 'high' || c.riskLevel === 'medium'))
    .map(c => c.title);
    
  // If no critical challenges, get evidence adequacy issues
  if (criticalChallenges.length === 0) {
    const evidenceIssues = issueRisks
      .filter(risk => risk.evidenceAdequacy < 60)
      .map(risk => `Evidence gaps in ${risk.challenges[0]?.category || 'legal'} elements`);
    return evidenceIssues.slice(0, 3);
  }
  
  return [...new Set(criticalChallenges)].slice(0, 5); // Remove duplicates and limit
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
  const actions: string[] = [];
  
  // Extract specific mitigation suggestions from challenges
  const mitigationSuggestions = issueRisks
    .flatMap(risk => risk.challenges)
    .flatMap(challenge => challenge.mitigationSuggestions)
    .filter(suggestion => suggestion && suggestion.length > 0);
    
  // Add the most relevant suggestions (remove duplicates)
  const uniqueSuggestions = [...new Set(mitigationSuggestions)];
  actions.push(...uniqueSuggestions.slice(0, 3));
  
  // Add priority actions based on risk levels
  const highRiskIssues = issueRisks.filter(risk => risk.overallRisk === 'high');
  if (highRiskIssues.length > 0) {
    actions.push('Immediate attention needed for high-risk issues');
  }
  
  const lowEvidenceIssues = issueRisks.filter(risk => risk.evidenceAdequacy < 60);
  if (lowEvidenceIssues.length > 0) {
    actions.push('Strengthen evidence for inadequately supported elements');
  }
  
  // Fallback to generic actions if no specific ones found
  if (actions.length === 0) {
    actions.push(
      'Prioritize evidence gathering for identified issues',
      'Prepare responses to likely opposing arguments',
      'Consider case strategy alternatives'
    );
  }
  
  return actions.slice(0, 4); // Limit to 4 actions
}

function generateMitigationPlan(issueRisks: IssueRiskAssessment[]): string[] {
  const plan: string[] = [];
  
  // Categorize issues by priority
  const criticalIssues = issueRisks.filter(risk => risk.mitigationPriority === 'critical');
  const importantIssues = issueRisks.filter(risk => risk.mitigationPriority === 'important');
  const moderateIssues = issueRisks.filter(risk => risk.mitigationPriority === 'moderate');
  
  // Add priority-based mitigation steps
  if (criticalIssues.length > 0) {
    plan.push(`Immediate: Address ${criticalIssues.length} critical vulnerability${criticalIssues.length > 1 ? 'ies' : 'y'} identified`);
  }
  
  if (importantIssues.length > 0) {
    plan.push(`Short-term: Strengthen evidence for ${importantIssues.length} important issue${importantIssues.length > 1 ? 's' : ''}`);
  }
  
  if (moderateIssues.length > 0) {
    plan.push(`Medium-term: Address ${moderateIssues.length} moderate risk factor${moderateIssues.length > 1 ? 's' : ''}`);
  }
  
  // Add specific actions from high-priority challenges
  const topMitigationActions = issueRisks
    .filter(risk => risk.mitigationPriority === 'critical' || risk.mitigationPriority === 'important')
    .flatMap(risk => risk.challenges.filter(c => c.riskLevel === 'high'))
    .flatMap(challenge => challenge.mitigationSuggestions.slice(0, 1)) // Take first suggestion from each challenge
    .filter(action => action && action.length > 0);
    
  if (topMitigationActions.length > 0) {
    plan.push(`Priority actions: ${topMitigationActions[0]}`);
  }
  
  // Always end with ongoing monitoring
  plan.push('Ongoing: Monitor case developments and adjust strategy as needed');
  
  return plan.slice(0, 4); // Limit to 4 items
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
 * Extracts real challenges from the 3-agent analysis using issue-specific content
 */
function extractRealChallenges(analysisContent: string, issue: IracIssue): Challenge[] {
  const challenges: Challenge[] = [];
  const content = analysisContent.toLowerCase();
  const issueKeywords = extractIssueKeywords(issue);
  
  console.log(`🎯 Extracting challenges for issue with keywords:`, issueKeywords);
  console.log(`📄 Content snippet: "${content.slice(0, 200)}..."`);
  
  // Issue-aware challenge detection based on issue keywords
  if (issueKeywords.some(keyword => ['lemon', 'law', 'motor', 'vehicle'].includes(keyword))) {
    // Lemon law specific challenges
    if (content.includes('notice') || content.includes('formal')) {
      challenges.push({
        id: `${issue.id}-lemon-notice`,
        title: 'Lemon Law Notice Requirement',
        description: 'Must provide formal written notice to manufacturer before remedy',
        category: 'procedural',
        riskLevel: content.includes('not provided') || content.includes('missing') ? 'high' : 'medium',
        impact: 'Could bar lemon law remedy if proper notice not given',
        mitigationSuggestions: ['Send formal notice to manufacturer immediately', 'Use certified mail', 'Include all required elements']
      });
    }
    
    if (content.includes('repair') || content.includes('attempts')) {
      challenges.push({
        id: `${issue.id}-lemon-attempts`,
        title: 'Repair Attempt Documentation',
        description: 'Must prove reasonable number of repair attempts',
        category: 'evidentiary',
        riskLevel: content.includes('documented') ? 'low' : 'medium',
        impact: 'Insufficient documentation could weaken lemon law claim',
        mitigationSuggestions: ['Gather all repair orders', 'Document days out of service', 'Obtain service manager statements']
      });
    }
  }
  
  if (issueKeywords.some(keyword => ['warranty', 'merchantability'].includes(keyword))) {
    // Warranty-specific challenges
    if (content.includes('disclaimer') || content.includes('waived')) {
      challenges.push({
        id: `${issue.id}-warranty-disclaimer`,
        title: 'Warranty Disclaimer Defense',
        description: 'Seller may claim warranty was disclaimed',
        category: 'legal',
        riskLevel: content.includes('valid disclaimer') ? 'high' : 'medium',
        impact: 'Could defeat warranty claim if disclaimer was valid',
        mitigationSuggestions: ['Review sales contract for disclaimers', 'Challenge validity of disclaimers', 'Argue conspicuousness requirements']
      });
    }
  }
  
  if (issueKeywords.some(keyword => ['dtpa', 'deceptive', 'trade'].includes(keyword))) {
    // DTPA-specific challenges  
    if (content.includes('reliance') || content.includes('misrepresentation')) {
      challenges.push({
        id: `${issue.id}-dtpa-reliance`,
        title: 'DTPA Reliance Requirement',
        description: 'Must prove reasonable reliance on deceptive practice',
        category: 'factual',
        riskLevel: content.includes('difficult') ? 'high' : 'medium',
        impact: 'Cannot recover under DTPA without proving reliance',
        mitigationSuggestions: ['Document pre-sale representations', 'Show reliance on statements', 'Prove materiality of misrepresentations']
      });
    }
  }
  
  // General procedural challenges
  if (content.includes('statute of limitations') || content.includes('time') && content.includes('bar')) {
    challenges.push({
      id: `${issue.id}-statute-limitations`,
      title: 'Statute of Limitations',
      description: 'Potential statute of limitations defense',
      category: 'procedural',
      riskLevel: content.includes('expired') ? 'high' : 'low',
      impact: 'Could completely bar the claim if limitations period expired',
      mitigationSuggestions: ['Verify filing deadline', 'Research discovery rule', 'Consider tolling doctrines']
    });
  }
  
  console.log(`✅ Extracted ${challenges.length} issue-specific challenges`);
  return challenges;
}

/**
 * Extracts real opposing arguments from the 3-agent analysis using issue-specific content
 */
function extractRealOpposingArguments(analysisContent: string, issue: IracIssue): OpposingArgument[] {
  const opposingArgs: OpposingArgument[] = [];
  const content = analysisContent.toLowerCase();
  const issueKeywords = extractIssueKeywords(issue);
  
  console.log(`🎯 Extracting opposing arguments for issue with keywords:`, issueKeywords);
  
  // Issue-aware opposing argument detection
  if (issueKeywords.some(keyword => ['lemon', 'law', 'motor'].includes(keyword))) {
    // Lemon law specific opposing arguments
    if (content.includes('notice') || content.includes('manufacturer')) {
      opposingArgs.push({
        id: `${issue.id}-lemon-notice-defense`,
        argument: 'Manufacturer will argue proper written notice was not provided under lemon law requirements',
        strength: content.includes('not provided') || content.includes('missing') ? 'high' : 'medium',
        potentialEvidence: ['Lemon law notice requirements', 'Correspondence records', 'Delivery receipts'],
        counterStrategy: 'Provide certified mail receipts and properly formatted notice letter per statute'
      });
    }
    
    if (content.includes('repair') || content.includes('reasonable')) {
      opposingArgs.push({
        id: `${issue.id}-lemon-repair-defense`,
        argument: 'Dealer will claim they were not given reasonable opportunity to repair defects',
        strength: content.includes('insufficient attempts') ? 'high' : 'medium',
        potentialEvidence: ['Repair attempt records', 'Service policies', 'Customer communications'],
        counterStrategy: 'Document all repair attempts and show manufacturer had adequate opportunity'
      });
    }
  }
  
  if (issueKeywords.some(keyword => ['warranty', 'merchantability'].includes(keyword))) {
    opposingArgs.push({
      id: `${issue.id}-warranty-defense`,
      argument: 'Seller will claim implied warranties were validly disclaimed in sales contract',
      strength: content.includes('disclaimer') || content.includes('waived') ? 'high' : 'medium',
      potentialEvidence: ['Sales contract language', 'Disclaimer clauses', 'Contract formation evidence'],
      counterStrategy: 'Challenge validity and conspicuousness of warranty disclaimers'
    });
  }
  
  if (issueKeywords.some(keyword => ['dtpa', 'deceptive'].includes(keyword))) {
    opposingArgs.push({
      id: `${issue.id}-dtpa-defense`,
      argument: 'Defendant will claim no reasonable reliance on alleged misrepresentations',
      strength: content.includes('no reliance') || content.includes('obvious') ? 'high' : 'medium',
      potentialEvidence: ['Pre-sale communications', 'Product documentation', 'Buyer knowledge'],
      counterStrategy: 'Show specific reliance on material representations that induced purchase'
    });
  }
  
  if (issueKeywords.some(keyword => ['contract', 'breach'].includes(keyword))) {
    opposingArgs.push({
      id: `${issue.id}-contract-defense`,
      argument: 'Defendant will argue contract terms were fulfilled or excused',
      strength: content.includes('performance') || content.includes('excuse') ? 'medium' : 'low',
      potentialEvidence: ['Contract performance records', 'Excuse doctrines', 'Impossibility claims'],
      counterStrategy: 'Document material breach and lack of valid excuse for non-performance'
    });
  }
  
  console.log(`✅ Extracted ${opposingArgs.length} issue-specific opposing arguments`);
  return opposingArgs;
}

/**
 * Extracts real burden of proof elements from the 3-agent analysis using issue-specific content
 */
function extractRealBurdenElements(analysisContent: string, issue: IracIssue): BurdenOfProofElement[] {
  const elements: BurdenOfProofElement[] = [];
  const content = analysisContent.toLowerCase();
  const issueKeywords = extractIssueKeywords(issue);
  
  console.log(`🎯 Extracting burden elements for issue with keywords:`, issueKeywords);
  
  // Issue-aware burden element detection
  if (issueKeywords.some(keyword => ['lemon', 'law', 'motor'].includes(keyword))) {
    // Lemon law specific burden elements
    elements.push({
      id: `${issue.id}-lemon-defect`,
      element: 'Covered Defect',
      description: 'Prove defect is covered by manufacturer warranty and substantially impairs use/value',
      difficultyLevel: content.includes('acknowledged') ? 'low' : content.includes('disputed') ? 'high' : 'medium',
      evidenceStrength: content.includes('service manager') ? 90 : content.includes('documented') ? 75 : 60,
      requiredEvidence: ['Warranty coverage proof', 'Defect impact documentation', 'Repair records'],
      currentEvidence: extractCurrentEvidence('defect', issue, analysisContent),
      evidenceGaps: ['Warranty terms analysis', 'Impact assessment']
    });
    
    elements.push({
      id: `${issue.id}-lemon-attempts`,
      element: 'Repair Attempts',
      description: 'Prove reasonable number of repair attempts (4+ attempts or 30+ days out of service)',
      difficultyLevel: content.includes('45 days') || content.includes('four attempts') ? 'low' : 'medium',
      evidenceStrength: content.includes('repair orders') ? 85 : 65,
      requiredEvidence: ['All repair orders', 'Service invoices', 'Loaner car records'],
      currentEvidence: extractCurrentEvidence('repair', issue, analysisContent),
      evidenceGaps: ['Complete repair timeline', 'Days calculation']
    });
    
    if (content.includes('notice')) {
      elements.push({
        id: `${issue.id}-lemon-notice`,
        element: 'Manufacturer Notice',
        description: 'Prove proper written notice provided to manufacturer with final repair opportunity',
        difficultyLevel: content.includes('formal notice') ? 'medium' : content.includes('not provided') ? 'high' : 'low',
        evidenceStrength: content.includes('certified mail') ? 90 : content.includes('notice') ? 50 : 25,
        requiredEvidence: ['Written notice copy', 'Certified mail receipt', 'Manufacturer response'],
        currentEvidence: extractCurrentEvidence('notice', issue, analysisContent),
        evidenceGaps: ['Formal notice documentation', 'Delivery proof']
      });
    }
  }
  
  if (issueKeywords.some(keyword => ['warranty', 'merchantability'].includes(keyword))) {
    elements.push({
      id: `${issue.id}-warranty-fitness`,
      element: 'Fitness for Purpose',
      description: 'Prove vehicle was not fit for ordinary purpose when sold',
      difficultyLevel: content.includes('clear defects') ? 'low' : 'medium',
      evidenceStrength: content.includes('repeated failures') ? 80 : 65,
      requiredEvidence: ['Defect documentation', 'Industry standards', 'Expert testimony'],
      currentEvidence: extractCurrentEvidence('fitness', issue, analysisContent),
      evidenceGaps: ['Expert analysis', 'Comparative standards']
    });
  }
  
  if (issueKeywords.some(keyword => ['dtpa', 'deceptive'].includes(keyword))) {
    elements.push({
      id: `${issue.id}-dtpa-misrepresentation`,
      element: 'Misrepresentation',
      description: 'Prove false, misleading, or deceptive act or practice occurred',
      difficultyLevel: content.includes('acknowledged') ? 'low' : 'medium',
      evidenceStrength: content.includes('representations') ? 70 : 50,
      requiredEvidence: ['Sales communications', 'Marketing materials', 'Witness testimony'],
      currentEvidence: extractCurrentEvidence('misrepresentation', issue, analysisContent),
      evidenceGaps: ['Pre-sale statements', 'Reliance evidence']
    });
    
    elements.push({
      id: `${issue.id}-dtpa-reliance`,
      element: 'Consumer Reliance',
      description: 'Prove reasonable reliance on the deceptive practice',
      difficultyLevel: 'medium',
      evidenceStrength: content.includes('reliance') ? 65 : 50,
      requiredEvidence: ['Purchase decision factors', 'Communication timeline', 'Consumer testimony'],
      currentEvidence: extractCurrentEvidence('reliance', issue, analysisContent),
      evidenceGaps: ['Decision-making process', 'Causation proof']
    });
  }
  
  console.log(`✅ Extracted ${elements.length} issue-specific burden elements`);
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