
import { supabase } from "@/integrations/supabase/client";

// Nuclear option: Delete ALL test documents using admin privileges
export const nuclearDeleteTestDocuments = async (clientId: string): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> => {
  try {
    console.log(`🚨 NUCLEAR DELETE: Starting aggressive cleanup for client: ${clientId}`);
    
    // Call the edge function with admin privileges for complete deletion
    const { data, error } = await supabase.functions.invoke('delete-client-document', {
      body: {
        operation: 'nuclear_cleanup',
        clientId: clientId,
        pattern: 'test' // This will delete any document with "test" in the title
      }
    });

    if (error) {
      console.error("Nuclear delete error:", error);
      return { success: false, deletedCount: 0, error: error.message };
    }

    console.log(`🚨 NUCLEAR DELETE: Completed with result:`, data);
    return { 
      success: true, 
      deletedCount: data?.deletedCount || 0 
    };

  } catch (error: any) {
    console.error("Nuclear delete failed:", error);
    return { success: false, deletedCount: 0, error: error.message };
  }
};

// Continuous monitoring to detect and eliminate test documents as they appear
export const startTestDocumentMonitoring = (clientId: string, onDetected: (count: number) => void) => {
  console.log(`🔍 Starting continuous monitoring for test documents`);
  
  let isMonitoring = true;
  
  const monitor = async () => {
    if (!isMonitoring) return;
    
    try {
      const { data: testDocs, error } = await supabase
        .from("document_metadata")
        .select("id, title, created_at")
        .eq("client_id", clientId)
        .or("title.ilike.%test%,title.ilike.%Test%,title.eq.Test 1,title.ilike.%testing%,title.ilike.%sample%,title.ilike.%demo%")
        .gte("created_at", new Date(Date.now() - 30000).toISOString()); // Last 30 seconds

      if (!error && testDocs && testDocs.length > 0) {
        console.log(`🚨 ALERT: Detected ${testDocs.length} new test documents!`);
        onDetected(testDocs.length);
        
        // Immediately delete them
        await nuclearDeleteTestDocuments(clientId);
      }
    } catch (error) {
      console.error("Monitoring error:", error);
    }
    
    // Check again in 5 seconds
    setTimeout(monitor, 5000);
  };
  
  // Start monitoring
  monitor();
  
  // Return stop function
  return () => {
    isMonitoring = false;
    console.log(`🔍 Stopped monitoring for test documents`);
  };
};

// Block document creation at the API level
export const blockTestDocumentCreation = async () => {
  try {
    // This would ideally be implemented at the database trigger level
    // For now, we'll enhance client-side validation
    console.log("🛡️ Enhanced test document blocking activated");
    
    // Set up real-time subscription to catch new documents
    const subscription = supabase
      .channel('document_blocker')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'document_metadata',
          filter: 'title=ilike.*test*'
        }, 
        async (payload) => {
          console.log('🚨 BLOCKED: Test document detected via real-time:', payload);
          
          // Immediately delete it
          const { error } = await supabase
            .from('document_metadata')
            .delete()
            .eq('id', payload.new.id);
            
          if (error) {
            console.error('Failed to block test document:', error);
          } else {
            console.log('✅ Successfully blocked test document creation');
          }
        }
      )
      .subscribe();
      
    return subscription;
  } catch (error) {
    console.error("Failed to set up document blocking:", error);
    return null;
  }
};
