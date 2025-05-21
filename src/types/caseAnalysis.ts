
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

export interface LawReference {
  id: string;
  title: string | null;
  url: string | null;
  content?: string | null;
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
