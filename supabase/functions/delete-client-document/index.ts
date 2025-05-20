
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteDocumentRequestBody {
  documentId: string;
  clientId: string;
}

interface DeleteDocumentResponse {
  success: boolean;
  message: string;
  details?: {
    chunksDeleted?: number;
    metadataDeleted?: boolean;
    storageDeleted?: boolean;
    verificationPassed?: boolean;
  };
  error?: string;
}

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      persistSession: false,
    }
  }
);

// Handler for DELETE requests
const handleDelete = async (req: Request): Promise<Response> => {
  try {
    const { documentId, clientId } = await req.json() as DeleteDocumentRequestBody;
    
    // Input validation
    if (!documentId || !clientId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required fields",
          error: "Both documentId and clientId are required"
        } as DeleteDocumentResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Starting admin deletion process for document ${documentId} owned by client ${clientId}`);
    
    // Step 1: Delete document chunks (if any exist)
    const { error: chunksDeleteError, count: chunksDeletedCount } = await supabaseAdmin
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId)
      .eq('client_id', clientId);
      
    if (chunksDeleteError) {
      console.error(`Error deleting chunks for document ${documentId}:`, chunksDeleteError);
    } else {
      console.log(`Deleted ${chunksDeletedCount || 0} chunks for document ${documentId}`);
    }
    
    // Step 2: Delete document metadata
    const { error: metadataDeleteError } = await supabaseAdmin
      .from('document_metadata')
      .delete()
      .eq('id', documentId);
    
    if (metadataDeleteError) {
      console.error(`Error deleting metadata for document ${documentId}:`, metadataDeleteError);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to delete document",
          details: {
            chunksDeleted: chunksDeletedCount || 0,
            metadataDeleted: false
          },
          error: `Metadata deletion failed: ${metadataDeleteError.message}`
        } as DeleteDocumentResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Step 3: Attempt to delete from storage (if it's a PDF document)
    let storageDeleted = false;
    try {
      // Try to build storage path and remove the file
      const storagePath = `${clientId}/${documentId}.pdf`;
      
      const { error: storageDeleteError } = await supabaseAdmin
        .storage
        .from('client_documents')
        .remove([storagePath]);
        
      if (!storageDeleteError) {
        storageDeleted = true;
        console.log(`Successfully deleted storage file: ${storagePath}`);
      } else {
        console.log(`No storage file found or error deleting: ${storageDeleteError.message}`);
      }
    } catch (storageErr) {
      // Just log storage errors but don't fail the whole operation
      console.warn("Storage deletion error (non-critical):", storageErr);
    }
    
    // Step 4: Verification - Check if document was actually deleted
    const { data: verifyData } = await supabaseAdmin
      .from('document_metadata')
      .select('id')
      .eq('id', documentId)
      .maybeSingle();
    
    const verificationPassed = verifyData === null;
    
    if (!verificationPassed) {
      console.error(`CRITICAL: Document ${documentId} still exists after deletion attempt!`);
      
      // Force delete one more time with different approach
      const { error: finalDeleteError } = await supabaseAdmin
        .from('document_metadata')
        .delete()
        .eq('id', documentId);
        
      // Second verification attempt
      const { data: secondVerifyData } = await supabaseAdmin
        .from('document_metadata')
        .select('id')
        .eq('id', documentId)
        .maybeSingle();
        
      const secondVerificationPassed = secondVerifyData === null;
      
      if (!secondVerificationPassed) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Document deletion failed: Document still exists in database after multiple attempts",
            details: {
              chunksDeleted: chunksDeletedCount || 0,
              metadataDeleted: false,
              storageDeleted,
              verificationPassed: false
            },
            error: finalDeleteError ? finalDeleteError.message : "Unknown database persistence error"
          } as DeleteDocumentResponse),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
    }
    
    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Document deleted successfully",
        details: {
          chunksDeleted: chunksDeletedCount || 0,
          metadataDeleted: true,
          storageDeleted,
          verificationPassed: true
        }
      } as DeleteDocumentResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error("Unexpected error in delete-client-document:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error)
      } as DeleteDocumentResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

// Main handler for all requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  // Route based on HTTP method
  if (req.method === 'DELETE' || req.method === 'POST') {
    return handleDelete(req);
  }
  
  // Return method not allowed for unsupported methods
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 405,
  });
});
