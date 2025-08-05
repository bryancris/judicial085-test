import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QuickConsultExportRequest {
  sessionId: string;
  format: 'pdf' | 'word';
}

interface QuickConsultData {
  session: any;
  messages: any[];
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

    const { sessionId, format }: QuickConsultExportRequest = await req.json()

    console.log('Quick Consult export request:', { sessionId, format })

    // Collect all data for the export
    const data = await collectQuickConsultData(supabase, sessionId)

    // Generate Word document (only Word format for now)
    const fileBuffer = await generateQuickConsultWord(data)
    const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    const extension = 'docx'

    // Generate filename
    const filename = generateQuickConsultFilename(data, extension)

    return new Response(fileBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Quick Consult export error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function collectQuickConsultData(supabase: any, sessionId: string): Promise<QuickConsultData> {
  console.log('Collecting Quick Consult data for session:', sessionId)

  // Get session information
  const { data: session, error: sessionError } = await supabase
    .from('quick_consult_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError) {
    throw new Error(`Failed to fetch session: ${sessionError.message}`)
  }

  // Get messages for the session
  const { data: messages, error: messagesError } = await supabase
    .from('quick_consult_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (messagesError) {
    throw new Error(`Failed to fetch messages: ${messagesError.message}`)
  }

  console.log('Data collection complete:', {
    hasSession: !!session,
    messagesCount: messages?.length || 0
  })

  return {
    session,
    messages: messages || []
  }
}

async function generateQuickConsultWord(data: QuickConsultData): Promise<Uint8Array> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('https://esm.sh/docx@8.5.0')
  
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 28,
            bold: true,
            color: "1e40af", // blue-800
            font: "Calibri"
          },
          paragraph: {
            spacing: {
              before: 400,
              after: 200,
            },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 24,
            bold: true,
            color: "1e40af",
            font: "Calibri"
          },
          paragraph: {
            spacing: {
              before: 300,
              after: 150,
            },
          },
        },
        {
          id: "Normal",
          name: "Normal",
          run: {
            size: 22,
            font: "Calibri",
            color: "000000"
          },
          paragraph: {
            spacing: {
              line: 276, // 1.15 line spacing
              after: 120,
            },
          },
        }
      ]
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: createQuickConsultDocumentContent(data, { Paragraph, TextRun, HeadingLevel, AlignmentType })
    }]
  })
  
  const buffer = await Packer.toBuffer(doc)
  return new Uint8Array(buffer)
}

function createQuickConsultDocumentContent(data: QuickConsultData, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel, AlignmentType } = docxElements
  
  const content = [
    // Title
    new Paragraph({
      text: "Quick Consult Session Report",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    
    // Session Information
    new Paragraph({
      text: "Session Information",
      heading: HeadingLevel.HEADING_1,
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Session Title: ", bold: true }),
        new TextRun(data.session?.title || 'Quick Consult Session')
      ],
      spacing: { after: 120 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Created: ", bold: true }),
        new TextRun(new Date(data.session?.created_at).toLocaleDateString())
      ],
      spacing: { after: 120 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Last Updated: ", bold: true }),
        new TextRun(new Date(data.session?.updated_at).toLocaleDateString())
      ],
      spacing: { after: 300 }
    }),
    
    // Conversation History
    new Paragraph({
      text: "Conversation History",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    })
  ]

  // Add messages
  if (data.messages.length > 0) {
    data.messages.forEach((message, index) => {
      const isUser = message.role === 'user'
      const timestamp = new Date(message.created_at).toLocaleString()
      
      // Message header with role and timestamp
      content.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: isUser ? "User: " : "AI Assistant: ", 
              bold: true,
              color: isUser ? "059669" : "1e40af" // green for user, blue for AI
            }),
            new TextRun({ 
              text: timestamp, 
              italics: true,
              color: "6b7280" // gray
            })
          ],
          spacing: { before: 200, after: 100 }
        })
      )
      
      // Message content
      const messageLines = message.content.split('\n').filter((line: string) => line.trim())
      messageLines.forEach((line: string) => {
        content.push(
          new Paragraph({
            children: [new TextRun(line.trim())],
            spacing: { after: 80 },
            indent: { left: 360 }
          })
        )
      })
    })
  } else {
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: "No messages found in this session.", italics: true })
        ],
        spacing: { after: 200 }
      })
    )
  }

  // Footer
  content.push(
    new Paragraph({
      text: `Report generated on ${new Date().toLocaleDateString()}`,
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [
        new TextRun({ 
          text: `Report generated on ${new Date().toLocaleDateString()}`,
          italics: true,
          color: "6b7280"
        })
      ]
    })
  )
  
  return content
}

function generateQuickConsultFilename(data: QuickConsultData, extension: string): string {
  const timestamp = new Date().toISOString().split('T')[0]
  const sessionTitle = data.session?.title ? 
    data.session.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) : 
    'QuickConsult'
  return `${sessionTitle}_${timestamp}.${extension}`
}