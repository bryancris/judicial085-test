
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from './constants.ts'
import type { ExportRequest } from './types.ts'
import { collectCaseData } from './dataCollector.ts'
import { generatePDF } from './pdfGenerator.ts'
import { generateWord } from './wordGenerator.ts'
import { generateFilename } from './utils.ts'

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
