
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
  
  // Step 1: Case Summary (Organized Fact Pattern)
  conversationSummary?: string
  structuredCaseData?: {
    parties?: Array<{ name: string; role: string }>
    timeline?: Array<{ date: string; event: string }>
    coreFacts?: string[]
    keyDocuments?: Array<{ title: string; status: string }>
  }
  
  // Step 2: Preliminary Analysis
  preliminaryAnalysis?: string
  
  // Step 3: Relevant Texas Laws
  relevantLaw?: string
  
  // Step 4: Additional Case Law
  additionalCaseLaw: any[]
  similarCases: any[]
  
  // Step 5: IRAC Legal Analysis
  iracAnalysis?: {
    caseSummary: string
    legalIssues: Array<{
      id: string
      issueStatement: string
      rule: string
      application: string
      conclusion: string
      category?: string
      confidence?: number
      strength?: 'strong' | 'moderate' | 'weak'
    }>
    overallConclusion: string
    followUpQuestions: string[]
    nextSteps: string[]
  }
  
  // Step 6: Case Strengths & Weaknesses
  strengths: string[]
  weaknesses: string[]
  
  // Step 7: Legal Requirements Verification & Case Conclusion
  refinedAnalysis?: string
  legalRequirementsChecklist?: Array<{
    requirement: string
    law: string
    citation: string
    clientFacts: string
    status: 'meets' | 'does_not_meet' | 'needs_evidence'
    analysis: string
  }>
  caseConclusion?: string
  
  // Step 8: Recommended Follow-up Questions
  followUpQuestions: string[]
  
  // Step 9: Law References
  lawReferences?: Array<{
    id: string
    title: string | null
    url: string | null
    content?: string | null
  }>
  
  // Legacy/Additional data
  parsedAnalysis?: {
    relevantLaw: string
    preliminaryAnalysis: string
    potentialIssues: string
    followUpQuestions: string[]
    strengths: string[]
    weaknesses: string[]
    caseType: string
  }
  scholarlyReferences: any[]  
  notes: any[]
  documents: any[]
  messages: any[]
  perplexityResearch: any[]
  caseType?: string
}
