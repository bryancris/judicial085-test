
export interface AgentAnalysis {
  legalConcepts: string[];
  keyFacts: string[];
  relevantStatutes: string[];
  searchQueries: string[];
  caseTheory: string;
}

export interface ScoredCase {
  case: any;
  relevanceScore: number;
  reasoning: string;
}
