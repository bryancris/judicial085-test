import { supabase } from "@/integrations/supabase/client";

// Enhanced cleanup function that handles all test documents more aggressively
export const massDeleteTestDocuments = async (clientId: string): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> => {
  try {
    console.log(`Starting mass deletion of ALL test documents for client: ${clientId}`);
    
    // Use a more comprehensive query to find test documents
    const { data: testDocs, error: fetchError } = await supabase
      .from("document_metadata")
      .select("id, title, created_at")
      .eq("client_id", clientId)
      .or("title.ilike.%test%,title.ilike.%Test%,title.eq.Test 1")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching test documents:", fetchError);
      return { success: false, deletedCount: 0, error: fetchError.message };
    }

    if (!testDocs || testDocs.length === 0) {
      console.log("No test documents found");
      return { success: true, deletedCount: 0 };
    }

    console.log(`Found ${testDocs.length} test documents to delete`);
    
    const documentIds = testDocs.map(doc => doc.id);
    
    // Delete in batches to avoid timeout
    const batchSize = 50;
    let totalDeleted = 0;
    
    for (let i = 0; i < documentIds.length; i += batchSize) {
      const batch = documentIds.slice(i, i + batchSize);
      
      // Delete document chunks first
      const { error: chunksError } = await supabase
        .from("document_chunks")
        .delete()
        .in("document_id", batch);

      if (chunksError) {
        console.error("Error deleting document chunks:", chunksError);
      }

      // Delete document metadata
      const { error: deleteError } = await supabase
        .from("document_metadata")
        .delete()
        .in("id", batch);

      if (deleteError) {
        console.error("Error deleting document metadata:", deleteError);
        return { success: false, deletedCount: totalDeleted, error: deleteError.message };
      }
      
      totalDeleted += batch.length;
      console.log(`Deleted batch of ${batch.length} documents. Total: ${totalDeleted}`);
    }

    console.log(`Successfully deleted ${totalDeleted} test documents for client ${clientId}`);
    return { success: true, deletedCount: totalDeleted };

  } catch (error: any) {
    console.error("Error in massDeleteTestDocuments:", error);
    return { success: false, deletedCount: 0, error: error.message };
  }
};

// Enhanced validation function to prevent test document creation
export const validateDocumentTitle = (title: string): { valid: boolean; error?: string } => {
  const normalizedTitle = title.trim().toLowerCase();
  
  // Block various test document patterns
  const testPatterns = [
    'test',
    'test 1',
    'test1',
    'testing',
    'demo',
    'sample',
    'example'
  ];
  
  for (const pattern of testPatterns) {
    if (normalizedTitle === pattern || normalizedTitle.startsWith(pattern + ' ')) {
      return {
        valid: false,
        error: `Document title "${title}" appears to be a test document. Please use a meaningful document title.`
      };
    }
  }
  
  return { valid: true };
};

// Monitor for new test documents being created
export const monitorTestDocuments = async (clientId: string): Promise<{
  testDocumentCount: number;
  recentTestDocs: any[];
}> => {
  try {
    const { data: recentDocs, error } = await supabase
      .from("document_metadata")
      .select("id, title, created_at")
      .eq("client_id", clientId)
      .or("title.ilike.%test%,title.ilike.%Test%,title.eq.Test 1")
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error monitoring test documents:", error);
      return { testDocumentCount: 0, recentTestDocs: [] };
    }

    return {
      testDocumentCount: recentDocs?.length || 0,
      recentTestDocs: recentDocs || []
    };
  } catch (error) {
    console.error("Error in monitorTestDocuments:", error);
    return { testDocumentCount: 0, recentTestDocs: [] };
  }
};

// Clean up duplicate "Test 1" documents for a specific client
export const cleanupTestDocuments = async (clientId: string): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> => {
  return massDeleteTestDocuments(clientId);
};

// Clean up all duplicate documents (not just test ones) for a client
export const cleanupAllDuplicateDocuments = async (clientId: string): Promise<{
  success: boolean;
  duplicatesRemoved: number;
  error?: string;
}> => {
  try {
    console.log(`Starting duplicate cleanup for client: ${clientId}`);
    
    // Fetch all documents for the client
    const { data: documents, error: fetchError } = await supabase
      .from("document_metadata")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return { success: false, duplicatesRemoved: 0, error: fetchError.message };
    }

    if (!documents || documents.length <= 1) {
      console.log("No duplicates found - only one or zero documents");
      return { success: true, duplicatesRemoved: 0 };
    }

    // Group by title to identify duplicates
    const titleGroups = new Map<string, any[]>();
    
    for (const doc of documents) {
      const title = doc.title || "Untitled";
      if (!titleGroups.has(title)) {
        titleGroups.set(title, []);
      }
      titleGroups.get(title)!.push(doc);
    }

    // Identify duplicates to remove (keep the most recent one in each group)
    const duplicatesToRemove: string[] = [];
    
    for (const [title, group] of titleGroups) {
      if (group.length > 1) {
        console.log(`Found ${group.length} duplicates for title: ${title}`);
        // Sort by created_at desc and keep the first one (most recent)
        group.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // Add all but the first one to the removal list
        for (let i = 1; i < group.length; i++) {
          duplicatesToRemove.push(group[i].id);
        }
      }
    }

    if (duplicatesToRemove.length === 0) {
      console.log("No duplicates found");
      return { success: true, duplicatesRemoved: 0 };
    }

    console.log(`Removing ${duplicatesToRemove.length} duplicate documents`);
    
    // Delete document chunks first
    const { error: chunksError } = await supabase
      .from("document_chunks")
      .delete()
      .in("document_id", duplicatesToRemove);

    if (chunksError) {
      console.error("Error deleting duplicate document chunks:", chunksError);
    }

    // Delete the duplicate documents
    const { error: deleteError } = await supabase
      .from("document_metadata")
      .delete()
      .in("id", duplicatesToRemove);

    if (deleteError) {
      return { success: false, duplicatesRemoved: 0, error: deleteError.message };
    }

    console.log(`Successfully removed ${duplicatesToRemove.length} duplicate documents for client ${clientId}`);
    return { success: true, duplicatesRemoved: duplicatesToRemove.length };

  } catch (error: any) {
    console.error("Error in cleanupAllDuplicateDocuments:", error);
    return { success: false, duplicatesRemoved: 0, error: error.message };
  }
};
