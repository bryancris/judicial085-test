
// Re-export all functionality from refactored files
export * from './api/chatApiService';
export * from './api/analysisApiService';
export * from './api/messageApiService';
export * from './api/legalContentApiService';
export * from './api/notesApiService';
export * from './types/chatTypes';
import { supabase } from '@/integrations/supabase/client';

// Save legal analysis to database
export const saveLegalAnalysis = async (
  clientId: string, 
  content: string, 
  timestamp: string,
  documentsUsed?: any[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First check if we already have an analysis for this client
    const { data: existingAnalyses, error: fetchError } = await supabase
      .from('legal_analyses')
      .select('id')
      .eq('client_id', clientId);
      
    if (fetchError) {
      console.error("Error checking for existing analysis:", fetchError);
      return { success: false, error: fetchError.message };
    }
    
    // If existing analysis, update it; otherwise insert new
    if (existingAnalyses && existingAnalyses.length > 0) {
      const { error: updateError } = await supabase
        .from('legal_analyses')
        .update({ 
          content, 
          timestamp,
          updated_at: new Date().toISOString(),
          law_references: documentsUsed ? JSON.stringify(documentsUsed) : null
        })
        .eq('client_id', clientId);
        
      if (updateError) {
        console.error("Error updating legal analysis:", updateError);
        return { success: false, error: updateError.message };
      }
    } else {
      const { error: insertError } = await supabase
        .from('legal_analyses')
        .insert({
          client_id: clientId,
          content,
          timestamp,
          law_references: documentsUsed ? JSON.stringify(documentsUsed) : null,
          user_id: (await supabase.auth.getUser()).data.user?.id || 'anonymous'
        });
        
      if (insertError) {
        console.error("Error inserting legal analysis:", insertError);
        return { success: false, error: insertError.message };
      }
    }
    
    return { success: true };
  } catch (err: any) {
    console.error("Error saving legal analysis:", err);
    return { success: false, error: err.message };
  }
};
