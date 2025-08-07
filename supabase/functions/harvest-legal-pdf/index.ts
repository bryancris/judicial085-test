import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { justiaUrl, caseTitle, userId } = await req.json();

    if (!justiaUrl || !caseTitle || !userId) {
      throw new Error('Missing required parameters: justiaUrl, caseTitle, or userId');
    }

    console.log('Harvesting PDF from Justia URL:', justiaUrl);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's firm ID
    const { data: firmData } = await supabase
      .from('firm_users')
      .select('firm_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    // Check if we already have this case in our knowledge base
    const existingDoc = await supabase
      .from('document_metadata')
      .select('id')
      .eq('url', justiaUrl)
      .eq('schema', 'legal_case')
      .single();

    if (existingDoc.data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'This legal case is already in your knowledge base',
          documentId: existingDoc.data.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the Justia page to extract PDF download link
    const response = await fetch(justiaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Justia page: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract PDF download link and case title from Justia page
    let pdfUrl = null;
    let extractedTitle = caseTitle; // Start with provided title
    
    console.log('Analyzing HTML for PDF links and case title...');
    
    // Extract case title from the HTML page if not provided or is generic
    if (!caseTitle || caseTitle === 'Legal Case Document') {
      // Try to extract case title from h1 tag or title tag
      const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i) || 
                        html.match(/<title[^>]*>(.*?)<\/title>/i);
      
      if (titleMatch) {
        let title = titleMatch[1]
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        // Clean up common Justia title patterns
        title = title
          .replace(/\s*-\s*Justia.*$/i, '') // Remove "- Justia Law" suffix
          .replace(/\s*\|\s*Justia.*$/i, '') // Remove "| Justia" suffix
          .replace(/\s*::.*$/i, '') // Remove ":: Court" suffix
          .replace(/^\s*Case\s*:\s*/i, '') // Remove "Case: " prefix
          .trim();
        
        if (title.length > 0 && title.length < 200) {
          extractedTitle = title;
          console.log('Extracted case title from HTML:', extractedTitle);
        }
      }
    }
    
    // Pattern 1: Justia PDF links with pdf-icon class and "Download PDF" text
    // This is the most common pattern for Justia case PDFs
    const justiaIconMatch = html.match(/href="(https:\/\/cases\.justia\.com\/[^"]*\.pdf[^"]*)"[^>]*class="[^"]*pdf-icon[^"]*"[^>]*>[^<]*Download[^<]*PDF/i);
    if (justiaIconMatch) {
      console.log('Found PDF via Justia pdf-icon pattern:', justiaIconMatch[1]);
      pdfUrl = justiaIconMatch[1];
    }
    
    // Pattern 2: Any cases.justia.com PDF link (fallback)
    if (!pdfUrl) {
      const casesJustiaMatch = html.match(/href="(https:\/\/cases\.justia\.com\/[^"]*\.pdf[^"]*)"/i);
      if (casesJustiaMatch) {
        console.log('Found PDF via cases.justia.com pattern:', casesJustiaMatch[1]);
        pdfUrl = casesJustiaMatch[1];
      }
    }
    
    // Pattern 3: Generic PDF download link with "Download PDF" text
    if (!pdfUrl) {
      const directPdfMatch = html.match(/href="([^"]*\.pdf[^"]*)"[^>]*>[^<]*Download[^<]*PDF/i);
      if (directPdfMatch) {
        console.log('Found PDF via Download PDF pattern:', directPdfMatch[1]);
        pdfUrl = directPdfMatch[1];
        if (!pdfUrl.startsWith('http')) {
          pdfUrl = new URL(pdfUrl, justiaUrl).href;
        }
      }
    }
    
    // Pattern 4: Any PDF link with pdf-icon class
    if (!pdfUrl) {
      const pdfIconMatch = html.match(/href="([^"]*\.pdf[^"]*)"[^>]*class="[^"]*pdf-icon[^"]*"/i);
      if (pdfIconMatch) {
        console.log('Found PDF via pdf-icon class:', pdfIconMatch[1]);
        pdfUrl = pdfIconMatch[1];
        if (!pdfUrl.startsWith('http')) {
          pdfUrl = new URL(pdfUrl, justiaUrl).href;
        }
      }
    }

    if (!pdfUrl) {
      console.log('No PDF patterns matched. HTML snippet around expected area:', html.substring(html.indexOf('Download PDF') - 100, html.indexOf('Download PDF') + 200));
      throw new Error('Could not find PDF download link on this Justia page');
    }

    console.log('Found PDF URL:', pdfUrl);

    // Download the PDF
    const pdfResponse = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/pdf,*/*'
      }
    });

    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.status}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    console.log('PDF downloaded, size:', pdfUint8Array.length, 'bytes');
    
    // Validate that we actually downloaded a PDF file
    const contentType = pdfResponse.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    // Check PDF magic bytes (should start with %PDF)
    const pdfSignature = String.fromCharCode(...pdfUint8Array.slice(0, 4));
    console.log('File signature:', pdfSignature);
    
    if (pdfSignature !== '%PDF') {
      // Log some of the content to see what we actually got
      const contentSample = String.fromCharCode(...pdfUint8Array.slice(0, 200));
      console.log('Invalid PDF content sample:', contentSample);
      throw new Error('Downloaded content is not a valid PDF file. Got HTML or other content instead.');
    }
    
    if (contentType && !contentType.includes('application/pdf')) {
      console.log('Warning: Content-Type is not application/pdf but file appears to be PDF based on signature');
    }

    // Create a File object from the PDF buffer to match the Document Library processing
    const fileName = `${justiaUrl.replace(/[^a-zA-Z0-9]/g, '')}.pdf`;
    const pdfFile = new File([pdfUint8Array], fileName, { type: 'application/pdf' });
    
    console.log('Created PDF File object:', {
      name: pdfFile.name,
      size: pdfFile.size,
      type: pdfFile.type
    });

    // Use the same processing pipeline as the Document Library by implementing
    // the upload and processing logic directly here to match uploadAndProcessFirmDocument
    console.log('Processing PDF using firm document pipeline...');
    
    try {
      // Generate a unique ID for the document
      const documentId = crypto.randomUUID();
      
      // Upload file to storage using the same approach as firmDocumentUtils
      const fileExt = pdfFile.name.split('.').pop();
      const storageFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const firmId = firmData?.firm_id;
      const filePath = firmId ? `firm/${firmId}/${storageFileName}` : `user/${userId}/${storageFileName}`;
      
      console.log('Uploading PDF to storage:', filePath);
      
      // Upload file to client_documents bucket (same as firmDocumentUtils)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(filePath, pdfUint8Array, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf',
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload document to storage: ${uploadError.message}`);
      }
      
      console.log('PDF uploaded successfully:', uploadData.path);
      
      // Get public URL for the uploaded file
      const { data: urlData } = await supabase.storage
        .from('client_documents')
        .getPublicUrl(filePath);
      
      const documentUrl = urlData.publicUrl;
      console.log('Public URL generated:', documentUrl);
      
      // Create document metadata with 'processing' status - exactly like uploadAndProcessFirmDocument
      const { error: metadataError } = await supabase
        .from('document_metadata')
        .insert({
          id: documentId,
          title: extractedTitle, // Use the extracted title, not the URL
          client_id: null, // No client for firm documents
          case_id: null,
          user_id: userId,
          firm_id: firmId || null,
          schema: 'legal_case',
          processing_status: 'processing',
          url: documentUrl,
          include_in_analysis: false
        });
      
      if (metadataError) {
        throw new Error(`Error creating document metadata: ${metadataError.message}`);
      }
      
      console.log(`Document metadata created with ID: ${documentId}, status: processing`);
      
      // Call server-side processing edge function - same as uploadAndProcessFirmDocument
      console.log('Calling server-side document processing function...');
      const { data, error: functionError } = await supabase.functions.invoke('process-pdf-document', {
        body: {
          documentId,
          clientId: null, // No client for firm documents
          caseId: null,
          userId,
          firmId,
          title: extractedTitle,
          fileUrl: documentUrl,
          fileName: pdfFile.name
        }
      });
      
      if (functionError) {
        throw new Error(`Server-side processing failed: ${functionError.message}`);
      }
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Server-side processing failed');
      }
      
      console.log(`Server-side document processing completed successfully for document: ${documentId}`);
      
      console.log('Legal case PDF successfully harvested and processed:', documentId);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          documentId,
          message: 'Legal case PDF successfully added to knowledge base'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (processingError: any) {
      console.error('Error processing PDF:', processingError);
      throw new Error(`Failed to process PDF: ${processingError.message}`);
    }

  } catch (error) {
    console.error('Error in harvest-legal-pdf function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});