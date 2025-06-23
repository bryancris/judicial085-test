
import { supabase } from "@/integrations/supabase/client";

// Base function to invoke Supabase edge functions with error handling
export const invokeFunction = async <T>(
  functionName: string,
  body: any
): Promise<{ data: T | null; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });

    if (error) {
      console.error(`Error calling ${functionName}:`, error);
      return { data: null, error: error.message };
    }

    return { data };
  } catch (err: any) {
    console.error(`Error invoking ${functionName}:`, err);
    return { data: null, error: err.message };
  }
};

// Function to delete client document using the edge function
export const deleteClientDocument = async (
  documentId: string,
  clientId: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    console.log(`Calling delete-client-document function for document ${documentId}`);
    
    // Use POST method instead of DELETE to avoid CORS issues
    const { data, error } = await supabase.functions.invoke('delete-client-document', {
      method: 'POST',
      body: { 
        operation: 'delete',
        documentId, 
        clientId 
      }
    });
    
    if (error) {
      console.error(`Error calling delete-client-document:`, error);
      return { 
        success: false, 
        error: error.message || "Failed to delete document" 
      };
    }
    
    console.log(`Result from delete-client-document:`, data);
    
    return {
      success: data?.success || false,
      message: data?.message,
      error: data?.error
    };
  } catch (err: any) {
    console.error(`Exception in deleteClientDocument:`, err);
    return { 
      success: false, 
      error: err.message || "Exception while deleting document" 
    };
  }
};
