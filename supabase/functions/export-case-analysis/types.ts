
export interface ExportRequest {
  clientId: string
  caseId?: string
  format: 'pdf' | 'word'
  sections?: string[]
}

export interface CaseAnalysisData {
  client: any
  case: any
  analysis: any
  parsedAnalysis?: {
    relevantLaw: string
    preliminaryAnalysis: string
    potentialIssues: string
    followUpQuestions: string[]
    strengths: string[]
    weaknesses: string[]
    caseType: string
  }
  similarCases: any[]
  scholarlyReferences: any[]  
  notes: any[]
  documents: any[]
  messages: any[]
  perplexityResearch: any[] // Additional case law and research from Perplexity
  additionalCaseLaw: any[] // Additional case law from the persistent storage
}
