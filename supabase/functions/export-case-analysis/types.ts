
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
  similarCases: any[]
  scholarlyReferences: any[]
  notes: any[]
  documents: any[]
  messages: any[]
}
