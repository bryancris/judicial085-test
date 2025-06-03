import { supabase } from "@/integrations/supabase/client";

// Helper function to generate content hash for duplicate detection
const generateContentHash = (content: string): string => {
  const cleanContent = content.trim().toLowerCase().replace(/\s+/g, ' ');
  let hash = 0;
  for (let i = 0; i < cleanContent.length; i++) {
    const char = cleanContent.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString();
};

// Clean up duplicate analyses for a specific client
export const cleanupDuplicateAnalyses = async (clientId: string): Promise<{
  success: boolean;
  duplicatesRemoved: number;
  error?: string;
}> => {
  try {
    console.log(`Starting duplicate cleanup for client: ${clientId}`);
    
    // Fetch all analyses for the client
    const { data: analyses, error: fetchError } = await supabase
      .from("legal_analyses")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return { success: false, duplicatesRemoved: 0, error: fetchError.message };
    }

    if (!analyses || analyses.length <= 1) {
      console.log("No duplicates found - only one or zero analysis records");
      return { success: true, duplicatesRemoved: 0 };
    }

    // Group by content hash to identify duplicates
    const contentHashGroups = new Map<string, any[]>();
    
    for (const analysis of analyses) {
      const contentHash = generateContentHash(analysis.content);
      if (!contentHashGroups.has(contentHash)) {
        contentHashGroups.set(contentHash, []);
      }
      contentHashGroups.get(contentHash)!.push(analysis);
    }

    // Identify duplicates to remove (keep the most recent one in each group)
    const duplicatesToRemove: string[] = [];
    
    for (const [contentHash, group] of contentHashGroups) {
      if (group.length > 1) {
        console.log(`Found ${group.length} duplicates for content hash: ${contentHash}`);
        // Sort by created_at desc and keep the first one (most recent)
        group.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // Add all but the first one to the removal list
        for (let i = 1; i < group.length; i++) {
          duplicatesToRemove.push(group[i].id);
        }
      }
    }

    if (duplicatesToRemove.length === 0) {
      console.log("No duplicate content found");
      return { success: true, duplicatesRemoved: 0 };
    }

    console.log(`Removing ${duplicatesToRemove.length} duplicate analysis records`);
    
    // Remove the duplicates
    const { error: deleteError } = await supabase
      .from("legal_analyses")
      .delete()
      .in("id", duplicatesToRemove);

    if (deleteError) {
      return { success: false, duplicatesRemoved: 0, error: deleteError.message };
    }

    console.log(`Successfully removed ${duplicatesToRemove.length} duplicate analyses for client ${clientId}`);
    return { success: true, duplicatesRemoved: duplicatesToRemove.length };

  } catch (error: any) {
    console.error("Error in cleanupDuplicateAnalyses:", error);
    return { success: false, duplicatesRemoved: 0, error: error.message };
  }
};

// Clean up all duplicate analyses across all clients (admin function)
export const cleanupAllDuplicateAnalyses = async (): Promise<{
  success: boolean;
  clientsProcessed: number;
  totalDuplicatesRemoved: number;
  error?: string;
}> => {
  try {
    console.log("Starting global duplicate cleanup");
    
    // Get all unique client IDs
    const { data: clients, error: clientError } = await supabase
      .from("legal_analyses")
      .select("client_id")
      .order("client_id");

    if (clientError) {
      return { success: false, clientsProcessed: 0, totalDuplicatesRemoved: 0, error: clientError.message };
    }

    const uniqueClientIds = [...new Set(clients?.map(c => c.client_id) || [])];
    console.log(`Found ${uniqueClientIds.length} unique clients with analyses`);

    let totalDuplicatesRemoved = 0;
    let clientsProcessed = 0;

    // Process each client
    for (const clientId of uniqueClientIds) {
      const result = await cleanupDuplicateAnalyses(clientId);
      if (result.success) {
        totalDuplicatesRemoved += result.duplicatesRemoved;
        clientsProcessed++;
      } else {
        console.error(`Failed to cleanup duplicates for client ${clientId}:`, result.error);
      }
    }

    console.log(`Global cleanup complete: ${clientsProcessed} clients processed, ${totalDuplicatesRemoved} duplicates removed`);
    return { 
      success: true, 
      clientsProcessed, 
      totalDuplicatesRemoved 
    };

  } catch (error: any) {
    console.error("Error in cleanupAllDuplicateAnalyses:", error);
    return { 
      success: false, 
      clientsProcessed: 0, 
      totalDuplicatesRemoved: 0, 
      error: error.message 
    };
  }
};
