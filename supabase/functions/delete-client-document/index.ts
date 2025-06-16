import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { operation, clientId, pattern, documentId } = await req.json()

    console.log(`Delete operation: ${operation}, clientId: ${clientId}`)

    if (operation === 'nuclear_cleanup') {
      // Nuclear option: Delete ALL test documents with admin privileges
      console.log(`🚨 NUCLEAR CLEANUP: Starting for client ${clientId} with pattern: ${pattern}`)
      
      // Find all test documents
      const { data: testDocs, error: fetchError } = await supabaseClient
        .from('document_metadata')
        .select('id, title')
        .eq('client_id', clientId)
        .or('title.ilike.%test%,title.ilike.%Test%,title.eq.Test 1,title.ilike.%testing%,title.ilike.%sample%,title.ilike.%demo%,title.ilike.%example%')

      if (fetchError) {
        console.error('Nuclear cleanup fetch error:', fetchError)
        return new Response(
          JSON.stringify({ success: false, error: fetchError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!testDocs || testDocs.length === 0) {
        console.log('Nuclear cleanup: No test documents found')
        return new Response(
          JSON.stringify({ success: true, deletedCount: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Nuclear cleanup: Found ${testDocs.length} test documents to obliterate`)
      const documentIds = testDocs.map(doc => doc.id)

      // Delete document chunks with admin privileges
      const { error: chunksError } = await supabaseClient
        .from('document_chunks')
        .delete()
        .in('document_id', documentIds)

      if (chunksError) {
        console.error('Nuclear cleanup chunks error:', chunksError)
      }

      // Delete document metadata with admin privileges
      const { error: metadataError } = await supabaseClient
        .from('document_metadata')
        .delete()
        .in('id', documentIds)

      if (metadataError) {
        console.error('Nuclear cleanup metadata error:', metadataError)
        return new Response(
          JSON.stringify({ success: false, error: metadataError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Also clean up legacy documents table
      const { error: legacyError } = await supabaseClient
        .from('documents')
        .delete()
        .in('metadata->file_id', documentIds)

      if (legacyError) {
        console.warn('Nuclear cleanup legacy error (expected):', legacyError)
      }

      console.log(`☢️ NUCLEAR CLEANUP COMPLETE: Obliterated ${testDocs.length} test documents`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          deletedCount: testDocs.length,
          message: `Nuclear cleanup completed: ${testDocs.length} test documents obliterated`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Regular document deletion logic
    if (operation === 'delete') {
      console.log(`Starting deletion for document ${documentId} for client ${clientId}`)

      // Delete document chunks first
      const { error: chunksError } = await supabaseClient
        .from('document_chunks')
        .delete()
        .eq('document_id', documentId)

      if (chunksError) {
        console.error('Chunks error:', chunksError)
      }

      // Delete document metadata
      const { error: metadataError } = await supabaseClient
        .from('document_metadata')
        .delete()
        .eq('id', documentId)

      if (metadataError) {
        console.error('Metadata error:', metadataError)
        return new Response(
          JSON.stringify({ success: false, error: metadataError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Also clean up legacy documents table
      const { error: legacyError } = await supabaseClient
        .from('documents')
        .delete()
        .eq('metadata->file_id', documentId)

      if (legacyError) {
        console.warn('Legacy error (expected):', legacyError)
      }

      console.log(`Successfully deleted document ${documentId} for client ${clientId}`)
      return new Response(
        JSON.stringify({ success: true, message: `Document ${documentId} deleted successfully` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid operation' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Delete document error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
