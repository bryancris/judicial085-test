
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { getEnvVars } from "./config.ts";

// Initialize Supabase clients
export const getSupabaseClients = () => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = getEnvVars();
  
  return {
    supabase: createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || ''),
    supabaseAdmin: createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '')
  };
};

// Fetch client data from database with improved error handling - USING ADMIN CLIENT
export const fetchClientData = async (supabaseAdmin: any, clientId: string) => {
  console.log(`Fetching client data for ID: ${clientId} using admin client`);
  
  try {
    // Use supabaseAdmin client to bypass RLS
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId);
    
    if (clientError) {
      console.error('Error fetching client data with admin client:', clientError);
      return { clientData: null, clientError };
    }
    
    if (!clientData || clientData.length === 0) {
      console.error(`No client found with ID: ${clientId} even with admin privileges`);
      return { clientData: null, clientError: new Error(`No client found with ID: ${clientId}`) };
    }
    
    // Use the first row as we're selecting by primary key
    const client = clientData[0];
    
    console.log(`Client data found for: ${client.first_name} ${client.last_name}`);
    console.log(`Client case types: ${JSON.stringify(client.case_types || [])}`);
    console.log(`Client case notes length: ${client.case_notes ? client.case_notes.length : 0}`);
  
    return { clientData: client, clientError: null };
  } catch (err) {
    console.error('Unexpected error fetching client data with admin client:', err);
    return { clientData: null, clientError: err };
  }
};

// Fetch legal analysis data - NOW USING ADMIN CLIENT
export const fetchLegalAnalysis = async (supabaseAdmin: any, clientId: string) => {
  try {
    console.log(`Fetching legal analysis for client ID: ${clientId} using admin client`);
    
    const { data: analysisData, error } = await supabaseAdmin
      .from('legal_analyses')
      .select('content')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching legal analysis:', error);
    }
    
    if (analysisData && analysisData.length > 0) {
      console.log(`Legal analysis found: Yes, length: ${analysisData[0].content.length} characters`);
      console.log(`First 100 chars of analysis: ${analysisData[0].content.substring(0, 100)}...`);
    } else {
      console.log(`Legal analysis found: No`);
    }
    
    return analysisData && analysisData.length > 0 ? analysisData : [];
  } catch (err) {
    console.error('Error in fetchLegalAnalysis:', err);
    return [];
  }
};

// Fetch attorney notes - NOW USING ADMIN CLIENT
export const fetchAttorneyNotes = async (supabaseAdmin: any, clientId: string) => {
  try {
    console.log(`Fetching attorney notes for client ID: ${clientId} using admin client`);
    
    const { data: notesData, error } = await supabaseAdmin
      .from('case_analysis_notes')
      .select('content')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error fetching attorney notes:', error);
    }
      
    console.log(`Attorney notes found: ${notesData && notesData.length > 0 ? 'Yes' : 'No'}`);
    
    return notesData || [];
  } catch (err) {
    console.error('Error in fetchAttorneyNotes:', err);
    return [];
  }
};

// Fetch client messages - NOW USING ADMIN CLIENT
export const fetchClientMessages = async (supabaseAdmin: any, clientId: string) => {
  try {
    console.log(`Fetching client messages for client ID: ${clientId} using admin client`);
    
    const { data: messagesData, error } = await supabaseAdmin
      .from('client_messages')
      .select('content, role')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
      .limit(15);
    
    if (error) {
      console.error('Error fetching client messages:', error);
    }
    
    console.log(`Client messages found: ${messagesData && messagesData.length > 0 ? 'Yes' : 'No'}`);
    
    return messagesData || [];
  } catch (err) {
    console.error('Error in fetchClientMessages:', err);
    return [];
  }
};

// Save case discussion messages
export const saveCaseDiscussion = async (supabaseAdmin: any, clientId: string, userId: string, content: string, role: 'attorney' | 'ai', timestamp: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('case_discussions')
      .insert({
        client_id: clientId,
        user_id: userId,
        content,
        role,
        timestamp
      })
      .select('id')
      .single();

    if (error) {
      console.error(`Error saving ${role} message:`, error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error(`Error in saveCaseDiscussion for ${role}:`, err);
    return { data: null, error: err };
  }
};
