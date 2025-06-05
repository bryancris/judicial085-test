
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
  // Using Puppeteer to generate PDF from HTML
  const puppeteer = await import('https://deno.land/x/puppeteer@16.2.0/mod.ts')
  
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    
    const html = generateHTMLContent(data)
    
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center;">
          Case Analysis - ${data.client?.first_name || ''} ${data.client?.last_name || ''}
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
    })
    
    return new Uint8Array(pdfBuffer)
  } finally {
    await browser.close()
  }
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
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
          }
          
          h2 {
            color: #34495e;
            margin-top: 30px;
          }
          
          .client-info, .case-info {
            background: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #3498db;
            margin: 20px 0;
          }
          
          .analysis-content {
            background: #fff;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
            white-space: pre-wrap;
          }
          
          .similar-case {
            margin: 10px 0;
            padding: 10px;
            background: #f1f2f6;
            border-radius: 3px;
          }
          
          .reference {
            margin: 8px 0;
            padding: 8px;
            background: #e8f4f8;
            border-radius: 3px;
          }
          
          .note {
            margin: 10px 0;
            padding: 10px;
            background: #fff3cd;
            border-radius: 3px;
          }
          
          .document {
            margin: 5px 0;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 3px;
          }
        </style>
      </head>
      <body>
        <h1>Case Analysis Report</h1>
        
        <div class="client-info">
          <h2>Client Information</h2>
          <p><strong>Name:</strong> ${data.client?.first_name || ''} ${data.client?.last_name || ''}</p>
          <p><strong>Email:</strong> ${data.client?.email || 'N/A'}</p>
          <p><strong>Phone:</strong> ${data.client?.phone || 'N/A'}</p>
          ${data.client?.address ? `<p><strong>Address:</strong> ${data.client.address}, ${data.client.city || ''}, ${data.client.state || ''} ${data.client.zip_code || ''}</p>` : ''}
        </div>
        
        ${data.case ? `
          <div class="case-info">
            <h2>Case Information</h2>
            <p><strong>Case Title:</strong> ${data.case.case_title}</p>
            <p><strong>Case Type:</strong> ${data.case.case_type || 'N/A'}</p>
            <p><strong>Status:</strong> ${data.case.status}</p>
            ${data.case.case_description ? `<p><strong>Description:</strong> ${data.case.case_description}</p>` : ''}
          </div>
        ` : ''}
        
        ${data.analysis ? `
          <h2>Legal Analysis</h2>
          <p><strong>Case Type:</strong> ${data.analysis.case_type || 'N/A'}</p>
          <div class="analysis-content">${data.analysis.content || 'No analysis content available.'}</div>
        ` : ''}
        
        ${data.similarCases.length > 0 ? `
          <h2>Similar Cases</h2>
          ${data.similarCases.slice(0, 5).map((similarCase: any) => `
            <div class="similar-case">
              <strong>${similarCase.clientName || 'Unknown Case'}</strong><br>
              ${similarCase.relevantFacts || 'No details available.'}<br>
              <em>Outcome: ${similarCase.outcome || 'Unknown'}</em>
            </div>
          `).join('')}
        ` : ''}
        
        ${data.scholarlyReferences.length > 0 ? `
          <h2>Scholarly References</h2>
          ${data.scholarlyReferences.slice(0, 10).map((ref: any) => `
            <div class="reference">
              <strong>${ref.title || 'Untitled Reference'}</strong><br>
              ${ref.authors || 'Unknown Author'} (${ref.year || 'Unknown Year'})<br>
              ${ref.snippet || ''}
            </div>
          `).join('')}
        ` : ''}
        
        ${data.notes.length > 0 ? `
          <h2>Attorney Notes</h2>
          ${data.notes.map((note: any) => `
            <div class="note">
              <strong>${new Date(note.timestamp).toLocaleDateString()}:</strong><br>
              ${note.content}
            </div>
          `).join('')}
        ` : ''}
        
        ${data.documents.length > 0 ? `
          <h2>Case Documents</h2>
          ${data.documents.map((doc: any) => `
            <div class="document">
              <strong>${doc.title || 'Untitled Document'}</strong><br>
              Status: ${doc.processing_status || 'Unknown'} | 
              Created: ${new Date(doc.created_at).toLocaleDateString()}
            </div>
          `).join('')}
        ` : ''}
        
        <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
          <p>Generated on ${new Date().toLocaleDateString()} | Confidential Attorney Work Product</p>
        </div>
      </body>
    </html>
  `
}
