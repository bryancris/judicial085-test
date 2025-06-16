import { supabase } from "@/integrations/supabase/client";

// Clean up duplicate "Test 1" documents for a specific client
export const cleanupTestDocuments = async (clientId: string): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> => {
  try {
    console.log(`Starting cleanup of test documents for client: ${clientId}`);
    
    // Fetch all documents with title "Test 1" for the client
    const { data: testDocs, error: fetchError } = await supabase
      .from("document_metadata")
      .select("id, title, created_at")
      .eq("client_id", clientId)
      .eq("title", "Test 1")
      .order("created_at", { ascending: false });

    if (fetchError) {
      return { success: false, deletedCount: 0, error: fetchError.message };
    }

    if (!testDocs || testDocs.length === 0) {
      console.log("No test documents found");
      return { success: true, deletedCount: 0 };
    }

    console.log(`Found ${testDocs.length} test documents to delete`);
    
    // Delete all test documents
    const documentIds = testDocs.map(doc => doc.id);
    
    // Delete document chunks first (if any)
    const { error: chunksError } = await supabase
      .from("document_chunks")
      .delete()
      .in("document_id", documentIds);

    if (chunksError) {
      console.error("Error deleting document chunks:", chunksError);
    }

    // Delete document metadata
    const { error: deleteError } = await supabase
      .from("document_metadata")
      .delete()
      .in("id", documentIds);

    if (deleteError) {
      return { success: false, deletedCount: 0, error: deleteError.message };
    }

    console.log(`Successfully deleted ${testDocs.length} test documents for client ${clientId}`);
    return { success: true, deletedCount: testDocs.length };

  } catch (error: any) {
    console.error("Error in cleanupTestDocuments:", error);
    return { success: false, deletedCount: 0, error: error.message };
  }
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
