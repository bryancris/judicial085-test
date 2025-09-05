
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
