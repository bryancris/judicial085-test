
// Enhanced function to fetch client-specific documents with case filtering
export async function fetchClientDocuments(clientId: string, caseId: string | null = null) {
  console.log(`Fetching client-specific documents for client: ${clientId}${caseId ? `, case: ${caseId}` : ''}`);
  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return [];
    }

    // Build query URL with filters
    let queryUrl = `${supabaseUrl}/rest/v1/document_chunks?select=document_id,content,metadata,chunk_index&client_id=eq.${clientId}&order=document_id.asc,chunk_index.asc`;
    
    // Add case filter if provided
    if (caseId) {
      queryUrl += `&case_id=eq.${caseId}`;
    }

    // Fetch document chunks for this client/case
    const response = await fetch(queryUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    });
    
    if (!response.ok) {
      console.warn(`Client documents fetch failed with status: ${response.status}`);
      return [];
    }
    
    const chunks = await response.json();
    console.log(`Found ${chunks?.length || 0} document chunks for client ${clientId}${caseId ? ` and case: ${caseId}` : ''}`);
    
    if (!chunks || chunks.length === 0) {
      return [];
    }
    
    // Group chunks by document_id and combine their content
    const documentMap = new Map();
    
    chunks.forEach(chunk => {
      if (!documentMap.has(chunk.document_id)) {
        documentMap.set(chunk.document_id, {
          id: chunk.document_id,
          content: chunk.content || "",
          metadata: chunk.metadata || {},
          chunks: [chunk]
        });
      } else {
        const doc = documentMap.get(chunk.document_id);
        // Append content with a space to avoid merging words
        doc.content += " " + (chunk.content || "");
        doc.chunks.push(chunk);
      }
    });
    
    // Format documents for context inclusion
    return Array.from(documentMap.values()).map(doc => {
      // Get a descriptive title from metadata
      const title = doc.metadata?.title || 
                   doc.metadata?.fileName || 
                   (doc.metadata?.isPdfDocument ? "PDF Document" : "Document");
      
      // Limit content to a reasonable size for context
      const snippet = doc.content.length > 2000 
        ? doc.content.substring(0, 2000) + "..." 
        : doc.content;
      
      return {
        id: doc.id,
        title: title,
        content: snippet,
        isPdfDocument: !!doc.metadata?.isPdfDocument,
        fileName: doc.metadata?.fileName,
        uploadedAt: doc.metadata?.uploadedAt
      };
    });
  } catch (error) {
    console.error("Error fetching client documents:", error);
    return [];
  }
}
