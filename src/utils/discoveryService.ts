
import { supabase } from "@/integrations/supabase/client";
import { 
  DiscoveryRequest, 
  DiscoveryResponse,
  DiscoveryTemplate,
  DiscoveryDocument 
} from "@/types/discovery";

// Discovery Requests
export const getDiscoveryRequests = async (clientId: string): Promise<{ 
  requests: DiscoveryRequest[]; 
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from("discovery_requests")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching discovery requests:", error);
      return { requests: [], error: error.message };
    }

    return { requests: data as DiscoveryRequest[] };
  } catch (err: any) {
    console.error("Error fetching discovery requests:", err);
    return { requests: [], error: err.message };
  }
};

export const getDiscoveryRequest = async (requestId: string): Promise<{
  request: DiscoveryRequest | null;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from("discovery_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (error) {
      console.error("Error fetching discovery request:", error);
      return { request: null, error: error.message };
    }

    return { request: data as DiscoveryRequest };
  } catch (err: any) {
    console.error("Error fetching discovery request:", err);
    return { request: null, error: err.message };
  }
};

export const createDiscoveryRequest = async (request: Omit<DiscoveryRequest, 'id' | 'created_at' | 'updated_at'>): Promise<{
  request: DiscoveryRequest | null;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from("discovery_requests")
      .insert(request)
      .select()
      .single();

    if (error) {
      console.error("Error creating discovery request:", error);
      return { request: null, error: error.message };
    }

    return { request: data as DiscoveryRequest };
  } catch (err: any) {
    console.error("Error creating discovery request:", err);
    return { request: null, error: err.message };
  }
};

export const updateDiscoveryRequest = async (id: string, updates: Partial<DiscoveryRequest>): Promise<{
  request: DiscoveryRequest | null;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from("discovery_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating discovery request:", error);
      return { request: null, error: error.message };
    }

    return { request: data as DiscoveryRequest };
  } catch (err: any) {
    console.error("Error updating discovery request:", err);
    return { request: null, error: err.message };
  }
};

// Discovery Responses
export const getDiscoveryResponses = async (requestId: string): Promise<{
  responses: DiscoveryResponse[];
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from("discovery_responses")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching discovery responses:", error);
      return { responses: [], error: error.message };
    }

    return { responses: data as DiscoveryResponse[] };
  } catch (err: any) {
    console.error("Error fetching discovery responses:", err);
    return { responses: [], error: err.message };
  }
};

export const createDiscoveryResponse = async (response: Omit<DiscoveryResponse, 'id' | 'created_at' | 'updated_at'>): Promise<{
  response: DiscoveryResponse | null;
  error?: string;
}> => {
  try {
    // Prepare response data, excluding citations for database insert
    const { citations, ...responseData } = response;
    
    const { data, error } = await supabase
      .from("discovery_responses")
      .insert(responseData)
      .select()
      .single();

    if (error) {
      console.error("Error creating discovery response:", error);
      return { response: null, error: error.message };
    }

    // Add citations back to the response object for return
    const responseWithCitations = {
      ...data,
      citations: citations || []
    } as DiscoveryResponse;

    return { response: responseWithCitations };
  } catch (err: any) {
    console.error("Error creating discovery response:", err);
    return { response: null, error: err.message };
  }
};

// Discovery Templates
export const getDiscoveryTemplates = async (): Promise<{
  templates: DiscoveryTemplate[];
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from("discovery_templates")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching discovery templates:", error);
      return { templates: [], error: error.message };
    }

    return { templates: data as DiscoveryTemplate[] };
  } catch (err: any) {
    console.error("Error fetching discovery templates:", err);
    return { templates: [], error: err.message };
  }
};

// Discovery Documents
export const getDiscoveryDocuments = async (responseId: string): Promise<{
  documents: DiscoveryDocument[];
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from("discovery_documents")
      .select("*")
      .eq("response_id", responseId);

    if (error) {
      console.error("Error fetching discovery documents:", error);
      return { documents: [], error: error.message };
    }

    return { documents: data as DiscoveryDocument[] };
  } catch (err: any) {
    console.error("Error fetching discovery documents:", err);
    return { documents: [], error: err.message };
  }
};
