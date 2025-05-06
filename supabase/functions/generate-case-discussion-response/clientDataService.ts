
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

// Fetch client data from database
export const fetchClientData = async (supabase: any, clientId: string) => {
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  
  if (clientError) {
    console.error('Error fetching client data:', clientError);
  }
  
  console.log(`Client data found: ${clientData ? 'Yes' : 'No'}`);
  if (clientData) {
    console.log(`Client case types: ${JSON.stringify(clientData.case_types)}`);
    console.log(`Client case notes length: ${clientData.case_notes ? clientData.case_notes.length : 0}`);
  }

  return { clientData, clientError };
};

// Fetch legal analysis data
export const fetchLegalAnalysis = async (supabase: any, clientId: string) => {
  const { data: analysisData } = await supabase
    .from('legal_analyses')
    .select('content')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);
  
  console.log(`Legal analysis found: ${analysisData && analysisData.length > 0 ? 'Yes' : 'No'}`);
  
  return analysisData;
};

// Fetch attorney notes
export const fetchAttorneyNotes = async (supabase: any, clientId: string) => {
  const { data: notesData } = await supabase
    .from('case_analysis_notes')
    .select('content')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log(`Attorney notes found: ${notesData && notesData.length > 0 ? 'Yes' : 'No'}`);
  
  return notesData;
};

// Fetch client messages
export const fetchClientMessages = async (supabase: any, clientId: string) => {
  const { data: messagesData } = await supabase
    .from('client_messages')
    .select('content, role')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
    .limit(15);
  
  console.log(`Client messages found: ${messagesData && messagesData.length > 0 ? 'Yes' : 'No'}`);
  
  return messagesData;
};

// Save case discussion messages
export const saveCaseDiscussion = async (supabaseAdmin: any, clientId: string, userId: string, content: string, role: 'attorney' | 'ai', timestamp: string) => {
  const { error } = await supabaseAdmin
    .from('case_discussions')
    .insert({
      client_id: clientId,
      user_id: userId,
      content,
      role,
      timestamp
    });

  if (error) {
    console.error(`Error saving ${role} message:`, error);
    return error;
  }
  
  return null;
};
