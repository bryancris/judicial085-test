import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    const clientName = data.client ? `${data.client.first_name}_${data.client.last_name}` : 'Unknown'
    const caseTitle = data.case?.case_title ? `_${data.case.case_title.replace(/[^a-zA-Z0-9]/g, '_')}` : ''
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${clientName}${caseTitle}_CaseAnalysis_${timestamp}.${extension}`

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

async function collectCaseData(supabase: any, clientId: string, caseId?: string): Promise<CaseAnalysisData> {
  console.log('Collecting case data for:', { clientId, caseId })

  // Get client information
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  // Get case information if provided
  let caseData = null
  if (caseId) {
    const { data: caseResult } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single()
    caseData = caseResult
  }

  // Get legal analysis
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

  const analysisData = analysis && analysis.length > 0 ? analysis[0] : null

  // Get similar cases if analysis exists
  let similarCases = []
  if (analysisData) {
    const { data: similarCasesData } = await supabase
      .from('similar_cases')
      .select('*')
      .eq('legal_analysis_id', analysisData.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (similarCasesData && similarCasesData.length > 0) {
      similarCases = similarCasesData[0].case_data || []
    }
  }

  // Get scholarly references if analysis exists
  let scholarlyReferences = []
  if (analysisData) {
    const { data: scholarlyData } = await supabase
      .from('scholarly_references')
      .select('*')
      .eq('legal_analysis_id', analysisData.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (scholarlyData && scholarlyData.length > 0) {
      scholarlyReferences = scholarlyData[0].reference_data || []
    }
  }

  // Get attorney notes
  const { data: notes } = await supabase
    .from('case_analysis_notes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  // Get client documents
  let documentsQuery = supabase
    .from('document_metadata')
    .select('*')
    .eq('client_id', clientId)

  if (caseId) {
    documentsQuery = documentsQuery.eq('case_id', caseId)
  }

  const { data: documents } = await documentsQuery
    .order('created_at', { ascending: false })

  // Get conversation messages
  let messagesQuery = supabase
    .from('client_messages')
    .select('*')
    .eq('client_id', clientId)

  if (caseId) {
    messagesQuery = messagesQuery.eq('case_id', caseId)
  }

  const { data: messages } = await messagesQuery
    .order('created_at', { ascending: true })

  console.log('Data collection complete:', {
    hasClient: !!client,
    hasCase: !!caseData,
    hasAnalysis: !!analysisData,
    similarCasesCount: similarCases.length,
    scholarlyReferencesCount: scholarlyReferences.length,
    notesCount: notes?.length || 0,
    documentsCount: documents?.length || 0,
    messagesCount: messages?.length || 0
  })

  return {
    client,
    case: caseData,
    analysis: analysisData,
    similarCases,
    scholarlyReferences,
    notes: notes || [],
    documents: documents || [],
    messages: messages || []
  }
}

async function generatePDF(data: CaseAnalysisData): Promise<Uint8Array> {
  const pdfShiftApiKey = Deno.env.get('PDFSHIFT_API_KEY')
  
  if (!pdfShiftApiKey) {
    throw new Error('PDFShift API key not configured')
  }

  const html = generateHTMLContent(data)
  
  console.log('Sending HTML to PDFShift for conversion...')
  
  const requestBody = {
    source: html,
    landscape: false,
    format: 'A4',
    margin: '1in',
    wait_for: 500,
    css: `
      @media print {
        body { margin: 0; padding: 20px; }
        .page-break { page-break-before: always; }
      }
    `,
    viewport: "1280x1024"
  }

  console.log('PDFShift request body:', JSON.stringify(requestBody, null, 2))
  
  const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${pdfShiftApiKey}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('PDFShift error response:', errorText)
    console.error('PDFShift status:', response.status)
    console.error('PDFShift headers:', Object.fromEntries(response.headers.entries()))
    
    let errorMessage = 'PDF generation failed'
    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.errors) {
        errorMessage = `PDF generation failed: ${JSON.stringify(errorJson.errors)}`
      }
    } catch (e) {
      errorMessage = `PDF generation failed: ${response.status} - ${errorText}`
    }
    
    throw new Error(errorMessage)
  }

  const pdfBuffer = await response.arrayBuffer()
  console.log('PDF generated successfully, size:', pdfBuffer.byteLength)
  
  return new Uint8Array(pdfBuffer)
}

async function generateWord(data: CaseAnalysisData): Promise<Uint8Array> {
  // Using docx library to generate Word document
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell } = await import('https://esm.sh/docx@8.5.0')
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
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
        
        new Paragraph({
          children: [
            new TextRun({ text: "Name: ", bold: true }),
            new TextRun(`${data.client?.first_name || ''} ${data.client?.last_name || ''}`)
          ]
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: "Email: ", bold: true }),
            new TextRun(data.client?.email || 'N/A')
          ]
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: "Phone: ", bold: true }),
            new TextRun(data.client?.phone || 'N/A')
          ]
        }),
        
        // Case Information
        ...(data.case ? [
          new Paragraph({
            text: "Case Information",
            heading: HeadingLevel.HEADING_1,
          }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "Case Title: ", bold: true }),
              new TextRun(data.case.case_title || 'N/A')
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "Case Type: ", bold: true }),
              new TextRun(data.case.case_type || 'N/A')
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "Status: ", bold: true }),
              new TextRun(data.case.status || 'N/A')
            ]
          })
        ] : []),
        
        // Legal Analysis
        ...(data.analysis ? [
          new Paragraph({
            text: "Legal Analysis",
            heading: HeadingLevel.HEADING_1,
          }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "Case Type: ", bold: true }),
              new TextRun(data.analysis.case_type || 'N/A')
            ]
          }),
          
          new Paragraph({
            text: "Analysis Content:",
            heading: HeadingLevel.HEADING_2,
          }),
          
          new Paragraph({
            text: data.analysis.content || 'No analysis content available.'
          })
        ] : []),
        
        // Similar Cases
        ...(data.similarCases.length > 0 ? [
          new Paragraph({
            text: "Similar Cases",
            heading: HeadingLevel.HEADING_1,
          }),
          
          ...data.similarCases.slice(0, 5).map((similarCase: any) => 
            new Paragraph({
              children: [
                new TextRun({ text: `${similarCase.clientName || 'Unknown Case'}: `, bold: true }),
                new TextRun(similarCase.relevantFacts || 'No details available.')
              ]
            })
          )
        ] : []),
        
        // Scholarly References
        ...(data.scholarlyReferences.length > 0 ? [
          new Paragraph({
            text: "Scholarly References",
            heading: HeadingLevel.HEADING_1,
          }),
          
          ...data.scholarlyReferences.slice(0, 10).map((ref: any) => 
            new Paragraph({
              children: [
                new TextRun({ text: ref.title || 'Untitled Reference', bold: true }),
                new TextRun(` - ${ref.authors || 'Unknown Author'} (${ref.year || 'Unknown Year'})`)
              ]
            })
          )
        ] : []),
        
        // Attorney Notes
        ...(data.notes.length > 0 ? [
          new Paragraph({
            text: "Attorney Notes",
            heading: HeadingLevel.HEADING_1,
          }),
          
          ...data.notes.map((note: any) => 
            new Paragraph({
              children: [
                new TextRun({ text: `${new Date(note.timestamp).toLocaleDateString()}: `, bold: true }),
                new TextRun(note.content)
              ]
            })
          )
        ] : []),
        
        // Documents
        ...(data.documents.length > 0 ? [
          new Paragraph({
            text: "Case Documents",
            heading: HeadingLevel.HEADING_1,
          }),
          
          ...data.documents.map((doc: any) => 
            new Paragraph({
              children: [
                new TextRun({ text: `${doc.title || 'Untitled Document'}: `, bold: true }),
                new TextRun(`${doc.processing_status || 'Unknown status'} - ${new Date(doc.created_at).toLocaleDateString()}`)
              ]
            })
          )
        ] : [])
      ]
    }]
  })
  
  const buffer = await Packer.toBuffer(doc)
  return new Uint8Array(buffer)
}

function generateHTMLContent(data: CaseAnalysisData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Case Analysis Report</title>
        <style>
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
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Case Analysis Report</h1>
          <div class="subtitle">Confidential Attorney Work Product</div>
        </div>
        
        <div class="info-section">
          <h2>Client Information</h2>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${data.client?.first_name || ''} ${data.client?.last_name || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${data.client?.email || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${data.client?.phone || 'N/A'}</span>
          </div>
          ${data.client?.address ? `
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span class="info-value">${data.client.address}, ${data.client.city || ''}, ${data.client.state || ''} ${data.client.zip_code || ''}</span>
          </div>
          ` : ''}
        </div>
        
        ${data.case ? `
          <div class="info-section">
            <h2>Case Information</h2>
            <div class="info-row">
              <span class="info-label">Case Title:</span>
              <span class="info-value">${data.case.case_title}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Case Type:</span>
              <span class="info-value">${data.case.case_type || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value">${data.case.status}</span>
            </div>
            ${data.case.case_description ? `
            <div class="info-row">
              <span class="info-label">Description:</span>
              <span class="info-value">${data.case.case_description}</span>
            </div>
            ` : ''}
          </div>
        ` : ''}
        
        ${data.analysis ? `
          <h2>Legal Analysis</h2>
          <div class="info-row">
            <span class="info-label">Case Type:</span>
            <span class="info-value">${data.analysis.case_type || 'N/A'}</span>
          </div>
          <h3>Analysis Content:</h3>
          <div class="analysis-content">${data.analysis.content || 'No analysis content available.'}</div>
        ` : ''}
        
        ${data.similarCases.length > 0 ? `
          <div class="page-break"></div>
          <h2>Similar Cases</h2>
          ${data.similarCases.slice(0, 5).map((similarCase: any) => `
            <div class="similar-case">
              <div class="case-title">${similarCase.clientName || 'Unknown Case'}</div>
              <div class="case-details">${similarCase.relevantFacts || 'No details available.'}</div>
              <div class="case-outcome">Outcome: ${similarCase.outcome || 'Unknown'}</div>
            </div>
          `).join('')}
        ` : ''}
        
        ${data.scholarlyReferences.length > 0 ? `
          <div class="page-break"></div>
          <h2>Scholarly References</h2>
          ${data.scholarlyReferences.slice(0, 10).map((ref: any) => `
            <div class="reference">
              <div class="reference-title">${ref.title || 'Untitled Reference'}</div>
              <div class="reference-meta">${ref.authors || 'Unknown Author'} (${ref.year || 'Unknown Year'})</div>
              ${ref.snippet ? `<div class="reference-snippet">${ref.snippet}</div>` : ''}
            </div>
          `).join('')}
        ` : ''}
        
        ${data.notes.length > 0 ? `
          <div class="page-break"></div>
          <h2>Attorney Notes</h2>
          ${data.notes.map((note: any) => `
            <div class="note">
              <div class="note-date">${new Date(note.timestamp).toLocaleDateString()}</div>
              <div class="note-content">${note.content}</div>
            </div>
          `).join('')}
        ` : ''}
        
        ${data.documents.length > 0 ? `
          <h2>Case Documents</h2>
          ${data.documents.map((doc: any) => `
            <div class="document">
              <div class="doc-name">${doc.title || 'Untitled Document'}</div>
              <div class="doc-meta">Status: ${doc.processing_status || 'Unknown'} | Created: ${new Date(doc.created_at).toLocaleDateString()}</div>
            </div>
          `).join('')}
        ` : ''}
        
        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()} | Confidential Attorney Work Product</p>
        </div>
      </body>
    </html>
  `
}
