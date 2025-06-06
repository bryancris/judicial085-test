import type { CaseAnalysisData } from './types.ts';
import { generateHTMLContent } from './htmlTemplateGenerator.ts';

export async function generatePDF(data: CaseAnalysisData): Promise<Uint8Array> {
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
        'Authorization': `Basic ${btoa(`${pdfcrowdUsername}:${pdfcrowdApiKey}`)}`
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
  
  // HTML content - using correct parameter name for HTML-to-PDF API
  formData.append('html', html)
  
  // Only use basic, well-documented parameters
  formData.append('page_format', 'A4')
  formData.append('margin_top', '1in')
  formData.append('margin_bottom', '1in')
  formData.append('margin_left', '1in')
  formData.append('margin_right', '1in')
  
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
