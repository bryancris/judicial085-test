
import type { CaseAnalysisData } from './types.ts';

export function generateFilename(data: CaseAnalysisData, extension: string): string {
  const clientName = data.client ? `${data.client.first_name}_${data.client.last_name}` : 'Unknown'
  const caseTitle = data.case?.case_title ? `_${data.case.case_title.replace(/[^a-zA-Z0-9]/g, '_')}` : ''
  const timestamp = new Date().toISOString().split('T')[0]
  return `${clientName}${caseTitle}_CaseAnalysis_${timestamp}.${extension}`
}
