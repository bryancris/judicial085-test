
import type { CaseAnalysisData } from './types.ts';

export async function generateWord(data: CaseAnalysisData): Promise<Uint8Array> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('https://esm.sh/docx@8.5.0')
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: createWordDocumentContent(data, { Paragraph, TextRun, HeadingLevel })
    }]
  })
  
  const buffer = await Packer.toBuffer(doc)
  return new Uint8Array(buffer)
}

function createWordDocumentContent(data: CaseAnalysisData, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  const content = [
    // Title
    new Paragraph({
      text: "Case Analysis Report",
      heading: HeadingLevel.TITLE,
    }),
    
    // Client Information
    new Paragraph({
      text: "Client Information",
      heading: HeadingLevel.HEADING_1,
    }),
    
    ...createClientInfoParagraphs(data.client, { Paragraph, TextRun }),
    
    // Case Information (if exists)
    ...(data.case ? createCaseInfoParagraphs(data.case, { Paragraph, TextRun, HeadingLevel }) : []),
    
    // Legal Analysis (if exists)
    ...(data.analysis ? createAnalysisParagraphs(data.analysis, { Paragraph, TextRun, HeadingLevel }) : []),
    
    // Similar Cases (if exist)
    ...(data.similarCases.length > 0 ? createSimilarCasesParagraphs(data.similarCases, { Paragraph, TextRun, HeadingLevel }) : []),
    
    // Scholarly References (if exist)
    ...(data.scholarlyReferences.length > 0 ? createScholarlyRefParagraphs(data.scholarlyReferences, { Paragraph, TextRun, HeadingLevel }) : []),
    
    // Attorney Notes (if exist)
    ...(data.notes.length > 0 ? createNotesParagraphs(data.notes, { Paragraph, TextRun, HeadingLevel }) : []),
    
    // Documents (if exist)
    ...(data.documents.length > 0 ? createDocumentsParagraphs(data.documents, { Paragraph, TextRun, HeadingLevel }) : [])
  ]
  
  return content
}

function createClientInfoParagraphs(client: any, docxElements: any) {
  const { Paragraph, TextRun } = docxElements
  
  return [
    new Paragraph({
      children: [
        new TextRun({ text: "Name: ", bold: true }),
        new TextRun(`${client?.first_name || ''} ${client?.last_name || ''}`)
      ]
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Email: ", bold: true }),
        new TextRun(client?.email || 'N/A')
      ]
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Phone: ", bold: true }),
        new TextRun(client?.phone || 'N/A')
      ]
    })
  ]
}

function createCaseInfoParagraphs(caseData: any, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Case Information",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Case Title: ", bold: true }),
        new TextRun(caseData.case_title || 'N/A')
      ]
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Case Type: ", bold: true }),
        new TextRun(caseData.case_type || 'N/A')
      ]
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Status: ", bold: true }),
        new TextRun(caseData.status || 'N/A')
      ]
    })
  ]
}

function createAnalysisParagraphs(analysis: any, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Legal Analysis",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Case Type: ", bold: true }),
        new TextRun(analysis.case_type || 'N/A')
      ]
    }),
    new Paragraph({
      text: "Analysis Content:",
      heading: HeadingLevel.HEADING_2,
    }),
    new Paragraph({
      text: analysis.content || 'No analysis content available.'
    })
  ]
}

function createSimilarCasesParagraphs(similarCases: any[], docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Similar Cases",
      heading: HeadingLevel.HEADING_1,
    }),
    ...similarCases.slice(0, 5).map((similarCase: any) => 
      new Paragraph({
        children: [
          new TextRun({ text: `${similarCase.clientName || 'Unknown Case'}: `, bold: true }),
          new TextRun(similarCase.relevantFacts || 'No details available.')
        ]
      })
    )
  ]
}

function createScholarlyRefParagraphs(scholarlyReferences: any[], docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Scholarly References",
      heading: HeadingLevel.HEADING_1,
    }),
    ...scholarlyReferences.slice(0, 10).map((ref: any) => 
      new Paragraph({
        children: [
          new TextRun({ text: ref.title || 'Untitled Reference', bold: true }),
          new TextRun(` - ${ref.authors || 'Unknown Author'} (${ref.year || 'Unknown Year'})`)
        ]
      })
    )
  ]
}

function createNotesParagraphs(notes: any[], docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Attorney Notes",
      heading: HeadingLevel.HEADING_1,
    }),
    ...notes.map((note: any) => 
      new Paragraph({
        children: [
          new TextRun({ text: `${new Date(note.timestamp).toLocaleDateString()}: `, bold: true }),
          new TextRun(note.content)
        ]
      })
    )
  ]
}

function createDocumentsParagraphs(documents: any[], docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Case Documents",
      heading: HeadingLevel.HEADING_1,
    }),
    ...documents.map((doc: any) => 
      new Paragraph({
        children: [
          new TextRun({ text: `${doc.title || 'Untitled Document'}: `, bold: true }),
          new TextRun(`${doc.processing_status || 'Unknown status'} - ${new Date(doc.created_at).toLocaleDateString()}`)
        ]
      })
    )
  ]
}
