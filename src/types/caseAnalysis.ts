
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

export interface LawReference {
  id: string;
  title: string | null;
  url: string | null;
  content?: string | null;
}

// IRAC Analysis Structure
export interface IracIssue {
  id: string;
  issueStatement: string;
  rule: string;
  application: string;
  conclusion: string;
  category?: string; // e.g., "Contract Law", "Tort Law", etc.
  confidence?: number; // 0-100 percentage confidence
  strength?: 'strong' | 'moderate' | 'weak'; // Overall strength assessment
}

export interface IracAnalysis {
  caseSummary: string;
  legalIssues: IracIssue[];
  overallConclusion: string;
  followUpQuestions: string[];
  nextSteps: string[];
}

export interface CaseAnalysisData {
  outcome: {
    defense: number;
    prosecution: number;
  };
  legalAnalysis: {
    relevantLaw: string;
    preliminaryAnalysis: string;
    potentialIssues: string;
    followUpQuestions: string[];
  };
  // New IRAC structure (optional for backward compatibility)
  iracAnalysis?: IracAnalysis;
  // Analysis methodology used
  methodology?: 'traditional' | 'irac';
  strengths: string[];
  weaknesses: string[];
  conversationSummary: string;
  timestamp: string;
  lawReferences?: LawReference[];
  caseType?: string;
  remedies?: string;
}

export interface AnalysisItem {
  content: string;
  timestamp: string;
}

export interface StrengthsAndWeaknesses {
  strengths: string[];
  weaknesses: string[];
}

export interface PredictionPercentages {
  defense: number;
  prosecution: number;
}

export interface ConsumerProtectionReference {
  id: string;
  section: string;
  title: string;
  description: string;
  type: 'dtpa' | 'home-solicitation' | 'debt-collection' | 'other';
}

// Define both types of document processing functions
export type ProcessDocumentFileFunction = (file: File) => Promise<void>;
export type ProcessDocumentContentFunction = (title: string, content: string, metadata?: any) => Promise<any>;

// Create a union type that combines both function types
export type ProcessDocumentFunction = ProcessDocumentFileFunction | ProcessDocumentContentFunction;

// Smart Connections Types
export type ConnectionType = 'supporting' | 'shared_facts' | 'alternative' | 'conflicting' | 'dependent';

export interface IssueConnection {
  id: string;
  fromIssueId: string;
  toIssueId: string;
  type: ConnectionType;
  strength: number; // 0-1 scale
  description: string;
  sharedElements: string[]; // Shared citations, facts, or legal concepts
  strategicImplication: string;
}

export interface SmartConnectionsAnalysis {
  connections: IssueConnection[];
  keystoneIssues: string[]; // Issue IDs that strengthen multiple other issues
  vulnerableIssues: string[]; // Issue IDs that could undermine the case
  strategicRecommendations: string[];
  overallCohesion: number; // 0-1 scale of how well issues work together
}

// Risk Assessment Types
export type RiskLevel = 'high' | 'medium' | 'low';
export type RiskCategory = 'factual' | 'legal' | 'procedural' | 'evidentiary' | 'damages';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  riskLevel: RiskLevel;
  impact: string; // How this challenge could affect the case
  mitigationSuggestions: string[];
}

export interface OpposingArgument {
  id: string;
  argument: string;
  strength: RiskLevel;
  potentialEvidence: string[];
  counterStrategy: string;
}

export interface BurdenOfProofElement {
  id: string;
  element: string;
  description: string;
  difficultyLevel: RiskLevel;
  evidenceStrength: number; // 0-100 percentage
  requiredEvidence: string[];
  currentEvidence: string[];
  evidenceGaps: string[];
}

export interface IssueRiskAssessment {
  issueId: string;
  overallRisk: RiskLevel;
  challenges: Challenge[];
  opposingArguments: OpposingArgument[];
  burdenOfProof: BurdenOfProofElement[];
  evidenceAdequacy: number; // 0-100 percentage
  riskFactors: string[];
  mitigationPriority: 'critical' | 'important' | 'moderate' | 'low';
}

export interface RiskAssessmentAnalysis {
  issueRisks: IssueRiskAssessment[];
  overallCaseRisk: RiskLevel;
  criticalVulnerabilities: string[];
  strengthsByCategory: Record<RiskCategory, number>; // 0-100 percentage
  recommendedActions: string[];
  riskMitigationPlan: string[];
}
