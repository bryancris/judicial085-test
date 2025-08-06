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
    
    // Extract PDF download link from various Justia patterns
    let pdfUrl = null;
    
    // Pattern 1: Direct PDF download link
    const pdfMatch = html.match(/href="([^"]*\.pdf)"/i);
    if (pdfMatch) {
      pdfUrl = pdfMatch[1];
      if (!pdfUrl.startsWith('http')) {
        pdfUrl = new URL(pdfUrl, justiaUrl).href;
      }
    }
    
    // Pattern 2: Download button with PDF endpoint
    if (!pdfUrl) {
      const downloadMatch = html.match(/href="([^"]*download[^"]*pdf[^"]*)"/i);
      if (downloadMatch) {
        pdfUrl = downloadMatch[1];
        if (!pdfUrl.startsWith('http')) {
          pdfUrl = new URL(pdfUrl, justiaUrl).href;
        }
      }
    }

    // Pattern 3: Check for case-specific PDF patterns
    if (!pdfUrl) {
      const caseIdMatch = justiaUrl.match(/\/(\d+)\.html/);
      if (caseIdMatch) {
        const caseId = caseIdMatch[1];
        pdfUrl = justiaUrl.replace('.html', '.pdf');
      }
    }

    if (!pdfUrl) {
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

    // Create document metadata
    const documentId = crypto.randomUUID();
    const fileName = `${caseTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim()}.pdf`;

    // Insert document metadata for firm-level legal case
    const { error: metadataError } = await supabase
      .from('document_metadata')
      .insert({
        id: documentId,
        title: caseTitle,
        client_id: null, // Firm-level document
        case_id: null,
        user_id: userId,
        firm_id: firmData?.firm_id || null,
        schema: 'legal_case',
        url: justiaUrl,
        processing_status: 'processing',
        include_in_analysis: true
      });

    if (metadataError) {
      throw new Error(`Error creating document metadata: ${metadataError.message}`);
    }

    // Call the existing PDF processing function
    const processingResult = await supabase.functions.invoke('process-pdf-document', {
      body: {
        documentId,
        fileName,
        fileData: Array.from(pdfUint8Array),
        clientId: null, // Firm-level
        caseId: null,
        metadata: {
          originalUrl: justiaUrl,
          caseTitle,
          source: 'justia_harvest',
          harvestedBy: userId,
          harvestedAt: new Date().toISOString()
        }
      }
    });

    if (processingResult.error) {
      console.error('PDF processing error:', processingResult.error);
      
      // Update document status to failed
      await supabase
        .from('document_metadata')
        .update({ 
          processing_status: 'failed',
          processing_error: processingResult.error.message 
        })
        .eq('id', documentId);
        
      throw new Error(`PDF processing failed: ${processingResult.error.message}`);
    }

    // Update document status to completed
    await supabase
      .from('document_metadata')
      .update({ processing_status: 'completed' })
      .eq('id', documentId);

    console.log('Legal case PDF successfully harvested and processed:', documentId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId,
        message: 'Legal case PDF successfully added to knowledge base'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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