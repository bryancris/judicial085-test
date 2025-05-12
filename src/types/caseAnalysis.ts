
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
