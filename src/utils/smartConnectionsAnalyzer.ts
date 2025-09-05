/**
 * Smart Connections Analyzer for IRAC Legal Analysis
 * Identifies relationships, dependencies, and strategic connections between legal issues
 */

import { IracIssue } from '@/types/caseAnalysis';
import { SmartConnectionsAnalysis, IssueConnection, ConnectionType } from '@/types/caseAnalysis';
import { assessIssueStrength } from './iracAssessment';

/**
 * Calculate text similarity using Jaccard index
 */
const calculateTextSimilarity = (text1: string, text2: string): number => {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(word => word.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(word => word.length > 3));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

/**
 * Extract key legal concepts from issue text
 */
const extractLegalConcepts = (issue: IracIssue): string[] => {
  const allText = `${issue.issueStatement} ${issue.rule} ${issue.application} ${issue.conclusion}`;
  
  // Legal concept patterns
  const conceptPatterns = [
    /breach of contract/gi,
    /duty of care/gi,
    /negligence/gi,
    /fraud/gi,
    /consumer protection/gi,
    /dtpa/gi,
    /warranty/gi,
    /damages/gi,
    /statute of limitations/gi,
    /proximate cause/gi,
    /reasonable person/gi,
    /strict liability/gi,
    /constitutional/gi,
    /due process/gi,
    /equal protection/gi,
    /statutory/gi,
    /common law/gi,
    /precedent/gi,
    /burden of proof/gi,
    /preponderance/gi,
    /clear and convincing/gi
  ];

  const concepts: string[] = [];
  conceptPatterns.forEach(pattern => {
    const matches = allText.match(pattern);
    if (matches) {
      concepts.push(...matches.map(match => match.toLowerCase()));
    }
  });

  return [...new Set(concepts)]; // Remove duplicates
};

/**
 * Extract citations from issue text
 */
const extractCitations = (issue: IracIssue): string[] => {
  const allText = `${issue.rule} ${issue.application}`;
  
  // Citation patterns
  const citationPatterns = [
    /\d+\s+Tex\.\s+\w+\.\s+\d+/gi, // Texas citations
    /\d+\s+U\.S\.C\.\s+§\s*\d+/gi, // Federal statutes
    /\d+\s+F\.\d+d\s+\d+/gi, // Federal reporters
    /\d+\s+S\.W\.\d+d\s+\d+/gi, // Southwest reporters
    /Tex\.\s+\w+\.\s+Code\s+§\s*\d+/gi, // Texas code sections
  ];

  const citations: string[] = [];
  citationPatterns.forEach(pattern => {
    const matches = allText.match(pattern);
    if (matches) {
      citations.push(...matches);
    }
  });

  return [...new Set(citations)]; // Remove duplicates
};

/**
 * Determine connection type between two issues
 */
const determineConnectionType = (
  issue1: IracIssue, 
  issue2: IracIssue,
  sharedConcepts: string[],
  sharedCitations: string[],
  textSimilarity: number
): ConnectionType => {
  const conclusion1 = issue1.conclusion.toLowerCase();
  const conclusion2 = issue2.conclusion.toLowerCase();
  
  // Check for conflicting conclusions
  if ((conclusion1.includes('likely to succeed') && conclusion2.includes('unlikely')) ||
      (conclusion1.includes('strong case') && conclusion2.includes('weak')) ||
      (conclusion1.includes('valid') && conclusion2.includes('invalid'))) {
    return 'conflicting';
  }
  
  // Check for supporting relationships
  if (sharedCitations.length > 2 && textSimilarity > 0.3) {
    return 'supporting';
  }
  
  // Check for shared factual basis
  if (sharedConcepts.length > 1 && textSimilarity > 0.25) {
    return 'shared_facts';
  }
  
  // Check for alternative theories (same outcome, different legal path)
  if (issue1.category !== issue2.category && 
      (conclusion1.includes('damages') || conclusion2.includes('damages'))) {
    return 'alternative';
  }
  
  // Check for dependency (one issue's success affects another)
  if (issue1.application.toLowerCase().includes(issue2.issueStatement.toLowerCase()) ||
      issue2.application.toLowerCase().includes(issue1.issueStatement.toLowerCase())) {
    return 'dependent';
  }
  
  return 'shared_facts'; // Default to shared facts
};

/**
 * Generate strategic implications for connections
 */
const generateStrategicImplication = (connection: IssueConnection, issues: IracIssue[]): string => {
  const fromIssue = issues.find(i => i.id === connection.fromIssueId);
  const toIssue = issues.find(i => i.id === connection.toIssueId);
  
  if (!fromIssue || !toIssue) return 'Review connection details for strategic planning.';
  
  const fromStrength = assessIssueStrength(fromIssue);
  const toStrength = assessIssueStrength(toIssue);
  
  switch (connection.type) {
    case 'supporting':
      if (fromStrength.strength === 'strong' && toStrength.strength !== 'strong') {
        return `Strong ${fromIssue.category || 'issue'} claim can bolster weaker ${toIssue.category || 'issue'} argument.`;
      }
      return 'These issues mutually reinforce each other\'s legal foundation.';
      
    case 'shared_facts':
      return 'Consistent fact patterns across both issues strengthen overall credibility.';
      
    case 'alternative':
      return 'Multiple legal paths to similar outcomes - provides case flexibility and fallback options.';
      
    case 'conflicting':
      return 'CAUTION: Conflicting conclusions may confuse the fact-finder. Consider prioritizing stronger claim.';
      
    case 'dependent':
      if (fromStrength.strength === 'weak') {
        return `Weak foundation issue may undermine dependent claim. Consider strengthening or alternative approach.`;
      }
      return 'Success on primary issue is crucial for dependent claim viability.';
      
    default:
      return 'Analyze connection for strategic case development opportunities.';
  }
};

/**
 * Analyze connections between IRAC issues
 */
export const analyzeSmartConnections = (issues: IracIssue[]): SmartConnectionsAnalysis => {
  if (issues.length < 2) {
    return {
      connections: [],
      keystoneIssues: [],
      vulnerableIssues: [],
      strategicRecommendations: ['Develop additional legal theories for stronger case foundation.'],
      overallCohesion: 0.5
    };
  }

  const connections: IssueConnection[] = [];
  const connectionCounts: Record<string, number> = {};
  
  // Initialize connection counts
  issues.forEach(issue => {
    connectionCounts[issue.id] = 0;
  });

  // Analyze each pair of issues
  for (let i = 0; i < issues.length; i++) {
    for (let j = i + 1; j < issues.length; j++) {
      const issue1 = issues[i];
      const issue2 = issues[j];
      
      // Extract shared elements
      const concepts1 = extractLegalConcepts(issue1);
      const concepts2 = extractLegalConcepts(issue2);
      const citations1 = extractCitations(issue1);
      const citations2 = extractCitations(issue2);
      
      const sharedConcepts = concepts1.filter(concept => concepts2.includes(concept));
      const sharedCitations = citations1.filter(citation => citations2.includes(citation));
      
      // Calculate text similarity
      const allText1 = `${issue1.issueStatement} ${issue1.application}`;
      const allText2 = `${issue2.issueStatement} ${issue2.application}`;
      const textSimilarity = calculateTextSimilarity(allText1, allText2);
      
      // Skip if no meaningful connection
      if (sharedConcepts.length === 0 && sharedCitations.length === 0 && textSimilarity < 0.15) {
        continue;
      }
      
      // Determine connection type and strength
      const connectionType = determineConnectionType(issue1, issue2, sharedConcepts, sharedCitations, textSimilarity);
      const strength = Math.min(1, (sharedConcepts.length * 0.2) + (sharedCitations.length * 0.3) + (textSimilarity * 2));
      
      if (strength > 0.2) { // Only include meaningful connections
        const connection: IssueConnection = {
          id: `${issue1.id}-${issue2.id}`,
          fromIssueId: issue1.id,
          toIssueId: issue2.id,
          type: connectionType,
          strength,
          description: `${sharedConcepts.length + sharedCitations.length} shared legal elements`,
          sharedElements: [...sharedConcepts, ...sharedCitations],
          strategicImplication: ''
        };
        
        connection.strategicImplication = generateStrategicImplication(connection, issues);
        connections.push(connection);
        
        // Update connection counts
        connectionCounts[issue1.id]++;
        connectionCounts[issue2.id]++;
      }
    }
  }

  // Identify keystone issues (issues with many connections)
  const keystoneIssues = Object.entries(connectionCounts)
    .filter(([_, count]) => count >= 2)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 2)
    .map(([issueId, _]) => issueId);

  // Identify vulnerable issues (weak issues that many others depend on)
  const vulnerableIssues = issues
    .filter(issue => {
      const strength = assessIssueStrength(issue);
      const dependentConnections = connections.filter(conn => 
        conn.fromIssueId === issue.id && conn.type === 'dependent'
      ).length;
      return strength.strength === 'weak' && dependentConnections > 0;
    })
    .map(issue => issue.id);

  // Generate strategic recommendations
  const strategicRecommendations = generateStrategicRecommendations(connections, issues, keystoneIssues, vulnerableIssues);

  // Calculate overall cohesion
  const totalPossibleConnections = (issues.length * (issues.length - 1)) / 2;
  const overallCohesion = totalPossibleConnections > 0 ? connections.length / totalPossibleConnections : 0;

  return {
    connections,
    keystoneIssues,
    vulnerableIssues,
    strategicRecommendations,
    overallCohesion: Math.min(1, overallCohesion * 3) // Scale up for better UX
  };
};

/**
 * Generate strategic recommendations based on analysis
 */
const generateStrategicRecommendations = (
  connections: IssueConnection[],
  issues: IracIssue[],
  keystoneIssues: string[],
  vulnerableIssues: string[]
): string[] => {
  const recommendations: string[] = [];

  // Keystone issue recommendations
  if (keystoneIssues.length > 0) {
    recommendations.push(`Focus on strengthening keystone issues - they support multiple claims and maximize case impact.`);
  }

  // Vulnerable issue recommendations
  if (vulnerableIssues.length > 0) {
    recommendations.push(`Address vulnerable issues early - their weaknesses could undermine dependent claims.`);
  }

  // Connection-based recommendations
  const supportingConnections = connections.filter(c => c.type === 'supporting').length;
  const conflictingConnections = connections.filter(c => c.type === 'conflicting').length;

  if (supportingConnections > conflictingConnections) {
    recommendations.push(`Strong issue synergy detected - emphasize complementary legal theories in presentation.`);
  }

  if (conflictingConnections > 0) {
    recommendations.push(`Resolve conflicting positions between issues to maintain consistent legal narrative.`);
  }

  // Alternative theory recommendations
  const alternativeConnections = connections.filter(c => c.type === 'alternative').length;
  if (alternativeConnections > 1) {
    recommendations.push(`Multiple legal pathways available - prioritize strongest theories while keeping alternatives ready.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Develop stronger connections between legal issues to create more cohesive case strategy.');
  }

  return recommendations;
};