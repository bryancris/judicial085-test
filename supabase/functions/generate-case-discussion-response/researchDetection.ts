/**
 * Research detection service for case discussions
 * Determines when a question requires legal research vs general discussion
 */

export interface ResearchTrigger {
  needsResearch: boolean;
  researchType: 'similar-cases' | 'legal-research' | 'general';
  confidence: number;
  extractedQuery: string;
}

// Keywords that trigger legal research
const RESEARCH_KEYWORDS = [
  'precedent', 'precedents', 'similar case', 'similar cases', 'case law',
  'statute', 'statutes', 'regulation', 'regulations', 'law', 'laws',
  'research', 'find', 'search', 'lookup', 'cite', 'citation',
  'authority', 'authorities', 'ruling', 'rulings', 'decision', 'decisions',
  'opinion', 'opinions', 'court', 'courts', 'federal', 'state',
  'supreme court', 'circuit court', 'appeals court'
];

// Question patterns that indicate research needs
const RESEARCH_PATTERNS = [
  /what (law|laws|statute|statutes|regulation|case|cases|precedent)/i,
  /how (do|does|did) (the )?court/i,
  /are there any (cases|precedents|laws|statutes)/i,
  /find (me )?(cases|precedents|laws|statutes|authorities)/i,
  /research (this|that|the)/i,
  /similar (cases|situations|circumstances)/i,
  /what (is|are) the (law|legal|statute)/i,
  /cite (me )?(some|any)?/i,
  /look up/i,
  /search for/i
];

// Phrases that indicate similar case searches
const SIMILAR_CASE_INDICATORS = [
  'similar case', 'similar cases', 'comparable case', 'comparable cases',
  'analogous case', 'analogous cases', 'precedent', 'precedents',
  'case with similar facts', 'similar situation', 'similar circumstances'
];

/**
 * Analyzes a user message to determine if research is needed
 */
export const detectResearchNeed = (message: string, previousMessages: any[] = []): ResearchTrigger => {
  const lowerMessage = message.toLowerCase();
  let confidence = 0;
  let researchType: 'similar-cases' | 'legal-research' | 'general' = 'general';
  
  // Check for explicit research requests
  if (lowerMessage.includes('research this') || lowerMessage.includes('research that')) {
    confidence = 0.9;
    researchType = 'legal-research';
  }
  
  // Check for similar case requests
  const hasSimilarCaseIndicators = SIMILAR_CASE_INDICATORS.some(indicator => 
    lowerMessage.includes(indicator)
  );
  if (hasSimilarCaseIndicators) {
    confidence = Math.max(confidence, 0.8);
    researchType = 'similar-cases';
  }
  
  // Check for research keywords
  const keywordMatches = RESEARCH_KEYWORDS.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length;
  if (keywordMatches > 0) {
    confidence = Math.max(confidence, 0.4 + (keywordMatches * 0.1));
    if (researchType === 'general') {
      researchType = 'legal-research';
    }
  }
  
  // Check for research patterns
  const patternMatches = RESEARCH_PATTERNS.filter(pattern => 
    pattern.test(message)
  ).length;
  if (patternMatches > 0) {
    confidence = Math.max(confidence, 0.5 + (patternMatches * 0.15));
    if (researchType === 'general') {
      researchType = 'legal-research';
    }
  }
  
  // Question words that often indicate research needs
  const questionWords = ['what', 'how', 'where', 'when', 'why', 'which', 'who'];
  const hasQuestionWord = questionWords.some(word => 
    lowerMessage.startsWith(word + ' ') || lowerMessage.includes(' ' + word + ' ')
  );
  if (hasQuestionWord && (keywordMatches > 0 || patternMatches > 0)) {
    confidence = Math.max(confidence, 0.6);
  }
  
  // Extract research query (clean up the message for research)
  let extractedQuery = message
    .replace(/^(please|can you|could you|would you|help me|assist me|i need|i want|tell me)/i, '')
    .replace(/\?$/, '')
    .trim();
  
  // If confidence is high enough, we need research
  const needsResearch = confidence >= 0.5;
  
  return {
    needsResearch,
    researchType,
    confidence: Math.min(confidence, 1.0),
    extractedQuery
  };
};

/**
 * Formats research query based on context and case information
 */
export const formatResearchQuery = (
  query: string, 
  researchType: string, 
  clientData: any,
  previousContext?: string
): string => {
  let formattedQuery = query;
  
  // Add case type context if available
  if (clientData?.case_types && clientData.case_types.length > 0) {
    const caseTypes = clientData.case_types.join(', ');
    formattedQuery = `${query} in ${caseTypes} law`;
  }
  
  // Add jurisdiction context if available
  if (clientData?.state) {
    formattedQuery = `${formattedQuery} ${clientData.state} jurisdiction`;
  }
  
  // Specific formatting for different research types
  switch (researchType) {
    case 'similar-cases':
      formattedQuery = `Find similar court cases: ${formattedQuery}`;
      break;
    case 'legal-research':
      formattedQuery = `Legal research: ${formattedQuery}`;
      break;
    default:
      formattedQuery = `Legal question: ${formattedQuery}`;
  }
  
  return formattedQuery;
};