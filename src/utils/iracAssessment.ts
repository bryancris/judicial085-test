/**
 * Utility functions for assessing IRAC issue strength and confidence
 */

import { IracIssue } from '@/types/caseAnalysis';

// Keywords that indicate strong legal positions
const STRONG_INDICATORS = [
  'clear violation', 'statutory requirement', 'established precedent',
  'mandatory', 'shall', 'required by law', 'constitutional right',
  'breach of contract', 'duty of care', 'strict liability',
  'statutory damages', 'per se violation', 'conclusive evidence'
];

// Keywords that indicate moderate legal positions
const MODERATE_INDICATORS = [
  'may constitute', 'could be argued', 'reasonable basis',
  'potentially', 'substantial evidence', 'compelling argument',
  'likely outcome', 'strong indication', 'reasonable person'
];

// Keywords that indicate weak legal positions
const WEAK_INDICATORS = [
  'unclear', 'difficult to prove', 'insufficient evidence',
  'questionable', 'unlikely', 'weak claim', 'doubtful',
  'speculative', 'minimal evidence', 'remote possibility'
];

// Consumer protection and contract law tend to have stronger statutory backing
const HIGH_STRENGTH_CATEGORIES = [
  'consumer protection', 'dtpa', 'deceptive trade practices',
  'contract law', 'breach of contract', 'warranty'
];

/**
 * Assesses the strength and confidence of an IRAC issue
 */
export const assessIssueStrength = (issue: IracIssue): { confidence: number; strength: 'strong' | 'moderate' | 'weak' } => {
  const allText = `${issue.issueStatement} ${issue.rule} ${issue.application} ${issue.conclusion}`.toLowerCase();
  
  let confidenceScore = 50; // Base confidence
  
  // Check for strong indicators
  const strongMatches = STRONG_INDICATORS.filter(indicator => 
    allText.includes(indicator.toLowerCase())
  ).length;
  
  // Check for moderate indicators  
  const moderateMatches = MODERATE_INDICATORS.filter(indicator => 
    allText.includes(indicator.toLowerCase())
  ).length;
  
  // Check for weak indicators
  const weakMatches = WEAK_INDICATORS.filter(indicator => 
    allText.includes(indicator.toLowerCase())
  ).length;
  
  // Adjust confidence based on indicators
  confidenceScore += (strongMatches * 15);
  confidenceScore += (moderateMatches * 8);
  confidenceScore -= (weakMatches * 12);
  
  // Category-based adjustments
  if (issue.category && HIGH_STRENGTH_CATEGORIES.some(cat => 
    issue.category?.toLowerCase().includes(cat)
  )) {
    confidenceScore += 10;
  }
  
  // Analyze conclusion language for additional confidence indicators
  const conclusion = issue.conclusion.toLowerCase();
  if (conclusion.includes('strong case') || conclusion.includes('likely to succeed')) {
    confidenceScore += 15;
  } else if (conclusion.includes('difficult') || conclusion.includes('challenging')) {
    confidenceScore -= 10;
  }
  
  // Rule quality assessment - longer, more detailed rules typically indicate stronger positions
  const ruleWordCount = issue.rule.split(' ').length;
  if (ruleWordCount > 100) {
    confidenceScore += 8;
  } else if (ruleWordCount < 30) {
    confidenceScore -= 5;
  }
  
  // Application depth assessment
  const applicationWordCount = issue.application.split(' ').length;
  if (applicationWordCount > 150) {
    confidenceScore += 10;
  } else if (applicationWordCount < 50) {
    confidenceScore -= 8;
  }
  
  // Ensure confidence is within bounds
  confidenceScore = Math.max(10, Math.min(95, confidenceScore));
  
  // Determine strength category
  let strength: 'strong' | 'moderate' | 'weak';
  if (confidenceScore >= 75) {
    strength = 'strong';
  } else if (confidenceScore >= 50) {
    strength = 'moderate';
  } else {
    strength = 'weak';
  }
  
  return { confidence: Math.round(confidenceScore), strength };
};

/**
 * Gets the appropriate badge variant for the strength level
 */
export const getStrengthBadgeVariant = (strength: 'strong' | 'moderate' | 'weak'): 'default' | 'secondary' | 'destructive' => {
  switch (strength) {
    case 'strong':
      return 'default'; // Green
    case 'moderate':
      return 'secondary'; // Yellow
    case 'weak':
      return 'destructive'; // Red
  }
};

/**
 * Gets the appropriate badge color classes for the strength level
 */
export const getStrengthBadgeClasses = (strength: 'strong' | 'moderate' | 'weak'): string => {
  switch (strength) {
    case 'strong':
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    case 'weak':
      return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
  }
};