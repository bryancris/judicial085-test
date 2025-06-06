
import type { CaseAnalysisData } from './types.ts';
import { CSS_STYLES } from './constants.ts';

export function generateHTMLContent(data: CaseAnalysisData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Case Analysis Report</title>
        <style>${CSS_STYLES}</style>
      </head>
      <body>
        ${generateHeaderSection()}
        ${generateClientInfoSection(data.client)}
        ${data.case ? generateCaseInfoSection(data.case) : ''}
        ${data.analysis ? generateAnalysisSection(data.analysis) : ''}
        ${data.similarCases.length > 0 ? generateSimilarCasesSection(data.similarCases) : ''}
        ${data.scholarlyReferences.length > 0 ? generateScholarlyReferencesSection(data.scholarlyReferences) : ''}
        ${data.notes.length > 0 ? generateNotesSection(data.notes) : ''}
        ${data.documents.length > 0 ? generateDocumentsSection(data.documents) : ''}
        ${generateFooterSection()}
      </body>
    </html>
  `
}

function generateHeaderSection(): string {
  return `
    <div class="header">
      <h1>Case Analysis Report</h1>
      <div class="subtitle">Confidential Attorney Work Product</div>
    </div>
  `
}

function generateClientInfoSection(client: any): string {
  return `
    <div class="info-section">
      <h2>Client Information</h2>
      <div class="info-row">
        <span class="info-label">Name:</span>
        <span class="info-value">${client?.first_name || ''} ${client?.last_name || ''}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value">${client?.email || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone:</span>
        <span class="info-value">${client?.phone || 'N/A'}</span>
      </div>
      ${client?.address ? `
      <div class="info-row">
        <span class="info-label">Address:</span>
        <span class="info-value">${client.address}, ${client.city || ''}, ${client.state || ''} ${client.zip_code || ''}</span>
      </div>
      ` : ''}
    </div>
  `
}

function generateCaseInfoSection(caseData: any): string {
  return `
    <div class="info-section">
      <h2>Case Information</h2>
      <div class="info-row">
        <span class="info-label">Case Title:</span>
        <span class="info-value">${caseData.case_title}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Case Type:</span>
        <span class="info-value">${caseData.case_type || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value">${caseData.status}</span>
      </div>
      ${caseData.case_description ? `
      <div class="info-row">
        <span class="info-label">Description:</span>
        <span class="info-value">${caseData.case_description}</span>
      </div>
      ` : ''}
    </div>
  `
}

function generateAnalysisSection(analysis: any): string {
  return `
    <h2>Legal Analysis</h2>
    <div class="info-row">
      <span class="info-label">Case Type:</span>
      <span class="info-value">${analysis.case_type || 'N/A'}</span>
    </div>
    <h3>Analysis Content:</h3>
    <div class="analysis-content">${analysis.content || 'No analysis content available.'}</div>
  `
}

function generateSimilarCasesSection(similarCases: any[]): string {
  return `
    <div class="page-break"></div>
    <h2>Similar Cases</h2>
    ${similarCases.slice(0, 5).map((similarCase: any) => `
      <div class="similar-case">
        <div class="case-title">${similarCase.clientName || 'Unknown Case'}</div>
        <div class="case-details">${similarCase.relevantFacts || 'No details available.'}</div>
        <div class="case-outcome">Outcome: ${similarCase.outcome || 'Unknown'}</div>
      </div>
    `).join('')}
  `
}

function generateScholarlyReferencesSection(scholarlyReferences: any[]): string {
  return `
    <div class="page-break"></div>
    <h2>Scholarly References</h2>
    ${scholarlyReferences.slice(0, 10).map((ref: any) => `
      <div class="reference">
        <div class="reference-title">${ref.title || 'Untitled Reference'}</div>
        <div class="reference-meta">${ref.authors || 'Unknown Author'} (${ref.year || 'Unknown Year'})</div>
        ${ref.snippet ? `<div class="reference-snippet">${ref.snippet}</div>` : ''}
      </div>
    `).join('')}
  `
}

function generateNotesSection(notes: any[]): string {
  return `
    <div class="page-break"></div>
    <h2>Attorney Notes</h2>
    ${notes.map((note: any) => `
      <div class="note">
        <div class="note-date">${new Date(note.timestamp).toLocaleDateString()}</div>
        <div class="note-content">${note.content}</div>
      </div>
    `).join('')}
  `
}

function generateDocumentsSection(documents: any[]): string {
  return `
    <h2>Case Documents</h2>
    ${documents.map((doc: any) => `
      <div class="document">
        <div class="doc-name">${doc.title || 'Untitled Document'}</div>
        <div class="doc-meta">Status: ${doc.processing_status || 'Unknown'} | Created: ${new Date(doc.created_at).toLocaleDateString()}</div>
      </div>
    `).join('')}
  `
}

function generateFooterSection(): string {
  return `
    <div class="footer">
      <p>Generated on ${new Date().toLocaleDateString()} | Confidential Attorney Work Product</p>
    </div>
  `
}
