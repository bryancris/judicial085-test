import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CSS_STYLES = `
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    line-height: 1.6;
    color: #2c3e50;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 30px;
    background: white;
  }
  
  .header {
    text-align: center;
    border-bottom: 3px solid #3498db;
    padding-bottom: 20px;
    margin-bottom: 40px;
  }
  
  .header h1 {
    color: #2c3e50;
    font-size: 28px;
    margin: 0;
    font-weight: bold;
  }
  
  .header .subtitle {
    color: #7f8c8d;
    font-size: 14px;
    margin-top: 10px;
  }
  
  h2 {
    color: #2c3e50;
    font-size: 20px;
    margin-top: 35px;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 2px solid #ecf0f1;
  }
  
  h3 {
    color: #34495e;
    font-size: 16px;
    margin-top: 25px;
    margin-bottom: 10px;
  }
  
  .info-section {
    background: #f8f9fa;
    padding: 20px;
    border-left: 4px solid #3498db;
    margin: 20px 0;
    border-radius: 0 5px 5px 0;
  }
  
  .info-row {
    margin: 8px 0;
    display: flex;
  }
  
  .info-label {
    font-weight: bold;
    color: #2c3e50;
    min-width: 120px;
    margin-right: 10px;
  }
  
  .info-value {
    color: #34495e;
    flex: 1;
  }
  
  .analysis-content {
    background: #fff;
    padding: 25px;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin: 20px 0;
    white-space: pre-wrap;
    font-size: 14px;
    line-height: 1.8;
  }
  
  .similar-case, .reference, .note, .document {
    margin: 15px 0;
    padding: 15px;
    border-radius: 6px;
    border-left: 4px solid #3498db;
  }
  
  .similar-case {
    background: #f1f2f6;
    border-left-color: #9b59b6;
  }
  
  .reference {
    background: #e8f4f8;
    border-left-color: #3498db;
  }
  
  .note {
    background: #fff3cd;
    border-left-color: #f39c12;
  }
  
  .document {
    background: #f8f9fa;
    border-left-color: #95a5a6;
  }
  
  .case-title {
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 5px;
  }
  
  .case-details {
    font-size: 14px;
    color: #34495e;
    margin-bottom: 8px;
  }
  
  .case-outcome {
    font-style: italic;
    color: #7f8c8d;
    font-size: 13px;
  }
  
  .reference-title {
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 5px;
  }
  
  .reference-meta {
    color: #7f8c8d;
    font-size: 13px;
    margin-bottom: 8px;
  }
  
  .reference-snippet {
    color: #34495e;
    font-size: 14px;
  }
  
  .note-date {
    font-weight: bold;
    color: #f39c12;
    margin-bottom: 5px;
  }
  
  .note-content {
    color: #34495e;
  }
  
  .doc-name {
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 5px;
  }
  
  .doc-meta {
    color: #7f8c8d;
    font-size: 13px;
  }
  
  .footer {
    margin-top: 60px;
    padding-top: 20px;
    border-top: 1px solid #ecf0f1;
    text-align: center;
    font-size: 12px;
    color: #95a5a6;
  }
  
  .page-break {
    page-break-before: always;
  }
  
  @media print {
    body { margin: 0; padding: 20px; }
    .page-break { page-break-before: always; }
  }
`

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ExportRequest {
  clientId: string
  caseId?: string
  format: 'pdf' | 'word'
  sections?: string[]
}

interface CaseAnalysisData {
  client: any
  case: any
  analysis: any
  similarCases: any[]
  scholarlyReferences: any[]
  notes: any[]
  documents: any[]
  messages: any[]
}

// =============================================================================
// MAIN REQUEST HANDLER
// =============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { clientId, caseId, format, sections }: ExportRequest = await req.json()

    console.log('Export request:', { clientId, caseId, format, sections })

    // Collect all data for the export
    const data = await collectCaseData(supabase, clientId, caseId)

    // Generate document based on format
    let fileBuffer: Uint8Array
    let mimeType: string
    let extension: string

    if (format === 'pdf') {
      fileBuffer = await generatePDF(data)
      mimeType = 'application/pdf'
      extension = 'pdf'
    } else {
      fileBuffer = await generateWord(data)
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      extension = 'docx'
    }

    // Generate filename
    const filename = generateFilename(data, extension)

    return new Response(fileBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// =============================================================================
// DATA COLLECTION FUNCTIONS
// =============================================================================

async function collectCaseData(supabase: any, clientId: string, caseId?: string): Promise<CaseAnalysisData> {
  console.log('Collecting case data for:', { clientId, caseId })

  // Get client information
  const client = await fetchClientData(supabase, clientId)
  
  // Get case information if provided
  const caseData = caseId ? await fetchCaseData(supabase, caseId) : null

  // Get legal analysis
  const analysisData = await fetchAnalysisData(supabase, clientId, caseId)

  // Get similar cases if analysis exists
  const similarCases = analysisData ? await fetchSimilarCases(supabase, analysisData.id) : []

  // Get scholarly references if analysis exists
  const scholarlyReferences = analysisData ? await fetchScholarlyReferences(supabase, analysisData.id) : []

  // Get attorney notes
  const notes = await fetchAttorneyNotes(supabase, clientId)

  // Get client documents
  const documents = await fetchClientDocuments(supabase, clientId, caseId)

  // Get conversation messages
  const messages = await fetchConversationMessages(supabase, clientId, caseId)

  console.log('Data collection complete:', {
    hasClient: !!client,
    hasCase: !!caseData,
    hasAnalysis: !!analysisData,
    similarCasesCount: similarCases.length,
    scholarlyReferencesCount: scholarlyReferences.length,
    notesCount: notes.length,
    documentsCount: documents.length,
    messagesCount: messages.length
  })

  return {
    client,
    case: caseData,
    analysis: analysisData,
    similarCases,
    scholarlyReferences,
    notes,
    documents,
    messages
  }
}

async function fetchClientData(supabase: any, clientId: string) {
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()
  return client
}

async function fetchCaseData(supabase: any, caseId: string) {
  const { data: caseResult } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single()
  return caseResult
}

async function fetchAnalysisData(supabase: any, clientId: string, caseId?: string) {
  let analysisQuery = supabase
    .from('legal_analyses')
    .select('*')
    .eq('client_id', clientId)

  if (caseId) {
    analysisQuery = analysisQuery.eq('case_id', caseId)
  } else {
    analysisQuery = analysisQuery.is('case_id', null)
  }

  const { data: analysis } = await analysisQuery
    .order('created_at', { ascending: false })
    .limit(1)

  return analysis && analysis.length > 0 ? analysis[0] : null
}

async function fetchSimilarCases(supabase: any, analysisId: string) {
  const { data: similarCasesData } = await supabase
    .from('similar_cases')
    .select('*')
    .eq('legal_analysis_id', analysisId)
    .order('created_at', { ascending: false })
    .limit(1)

  return (similarCasesData && similarCasesData.length > 0) ? 
    (similarCasesData[0].case_data || []) : []
}

async function fetchScholarlyReferences(supabase: any, analysisId: string) {
  const { data: scholarlyData } = await supabase
    .from('scholarly_references')
    .select('*')
    .eq('legal_analysis_id', analysisId)
    .order('created_at', { ascending: false })
    .limit(1)

  return (scholarlyData && scholarlyData.length > 0) ? 
    (scholarlyData[0].reference_data || []) : []
}

async function fetchAttorneyNotes(supabase: any, clientId: string) {
  const { data: notes } = await supabase
    .from('case_analysis_notes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  return notes || []
}

async function fetchClientDocuments(supabase: any, clientId: string, caseId?: string) {
  let documentsQuery = supabase
    .from('document_metadata')
    .select('*')
    .eq('client_id', clientId)

  if (caseId) {
    documentsQuery = documentsQuery.eq('case_id', caseId)
  }

  const { data: documents } = await documentsQuery
    .order('created_at', { ascending: false })

  return documents || []
}

async function fetchConversationMessages(supabase: any, clientId: string, caseId?: string) {
  let messagesQuery = supabase
    .from('client_messages')
    .select('*')
    .eq('client_id', clientId)

  if (caseId) {
    messagesQuery = messagesQuery.eq('case_id', caseId)
  }

  const { data: messages } = await messagesQuery
    .order('created_at', { ascending: true })

  return messages || []
}

// =============================================================================
// PDF GENERATION FUNCTIONS
// =============================================================================

async function generatePDF(data: CaseAnalysisData): Promise<Uint8Array> {
  const pdfcrowdApiKey = Deno.env.get('PDFCROWD_API_KEY')
  const pdfcrowdUsername = Deno.env.get('PDFCROWD_USERNAME')
  
  console.log('PDFCrowd credentials check:', {
    username: pdfcrowdUsername ? 'Present' : 'Missing',
    apiKey: pdfcrowdApiKey ? 'Present' : 'Missing'
  })
  
  if (!pdfcrowdApiKey || !pdfcrowdUsername) {
    throw new Error('PDFCrowd credentials not configured')
  }

  const html = generateHTMLContent(data)
  
  console.log('Generated HTML length:', html.length)
  console.log('HTML preview (first 500 chars):', html.substring(0, 500))
  
  const formData = createPDFFormData(html)
  console.log('PDFCrowd form data parameters:', Object.fromEntries(formData.entries()))
  
  try {
    const response = await fetch('https://api.pdfcrowd.com/html/convert/pdf/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${pdfcrowdUsername}:${pdfcrowdApiKey}`)}`,
      },
      body: formData,
    })

    return await handlePDFResponse(response)

  } catch (networkError) {
    console.error('Network error calling PDFCrowd:', networkError)
    throw new Error(`PDF generation failed: Network error - ${networkError.message}`)
  }
}

function createPDFFormData(html: string): URLSearchParams {
  const formData = new URLSearchParams()
  
  // HTML content
  formData.append('html', html)
  
  // Page settings
  formData.append('page_format', 'A4')
  formData.append('margin_top', '1in')
  formData.append('margin_bottom', '1in')
  formData.append('margin_left', '1in')
  formData.append('margin_right', '1in')
  
  // Output settings
  formData.append('no_print_header_footer', 'true')
  formData.append('use_print_media', 'true')
  formData.append('title', 'Case Analysis Report')
  
  return formData
}

async function handlePDFResponse(response: Response): Promise<Uint8Array> {
  console.log('PDFCrowd response status:', response.status)
  console.log('PDFCrowd response headers:', Object.fromEntries(response.headers.entries()))

  if (!response.ok) {
    const errorText = await response.text()
    console.error('PDFCrowd error response:', errorText)
    
    let detailedError = 'PDF generation failed'
    try {
      const errorJson = JSON.parse(errorText)
      console.error('PDFCrowd error details:', errorJson)
      if (errorJson.message) {
        detailedError = `PDF generation failed: ${errorJson.message}`
      } else if (errorJson.error) {
        detailedError = `PDF generation failed: ${errorJson.error}`
      }
    } catch (parseError) {
      console.error('Could not parse PDFCrowd error:', parseError)
      detailedError = `PDF generation failed: HTTP ${response.status} - ${errorText}`
    }
    
    throw new Error(detailedError)
  }

  const pdfBuffer = await response.arrayBuffer()
  console.log('PDF generated successfully with PDFCrowd, size:', pdfBuffer.byteLength)
  
  if (pdfBuffer.byteLength === 0) {
    throw new Error('Received empty PDF from PDFCrowd')
  }
  
  return new Uint8Array(pdfBuffer)
}

// =============================================================================
// WORD GENERATION FUNCTIONS
// =============================================================================

async function generateWord(data: CaseAnalysisData): Promise<Uint8Array> {
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

// =============================================================================
// HTML TEMPLATE GENERATION FUNCTIONS
// =============================================================================

function generateHTMLContent(data: CaseAnalysisData): string {
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

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateFilename(data: CaseAnalysisData, extension: string): string {
  const clientName = data.client ? `${data.client.first_name}_${data.client.last_name}` : 'Unknown'
  const caseTitle = data.case?.case_title ? `_${data.case.case_title.replace(/[^a-zA-Z0-9]/g, '_')}` : ''
  const timestamp = new Date().toISOString().split('T')[0]
  return `${clientName}${caseTitle}_CaseAnalysis_${timestamp}.${extension}`
}
