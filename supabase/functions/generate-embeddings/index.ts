
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const { texts, documentId, clientId, metadata } = await req.json();
    
    if (!texts || !texts.length || !documentId || !clientId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Processing ${texts.length} chunks for document ${documentId}`);
    
    // Process each text chunk
    const results = [];
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      
      try {
        // Generate embedding using OpenAI API
        const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openAIApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: text,
          }),
        });
        
        if (!embeddingResponse.ok) {
          const errorData = await embeddingResponse.json();
          console.error("Error from OpenAI:", errorData);
          throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
        }
        
        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;
        
        // Store the document chunk with its embedding
        const { data: chunkData, error: chunkError } = await supabase
          .from("document_chunks")
          .insert({
            document_id: documentId,
            client_id: clientId,
            chunk_index: i,
            content: text,
            embedding: embedding,
            metadata: { ...metadata, chunkIndex: i, totalChunks: texts.length }
          })
          .select();
        
        if (chunkError) {
          throw new Error(`Error storing chunk: ${chunkError.message}`);
        }
        
        results.push({ 
          success: true, 
          chunkIndex: i,
          id: chunkData?.[0]?.id 
        });
        
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error);
        results.push({ 
          success: false, 
          chunkIndex: i,
          error: error.message 
        });
      }
    }
    
    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in generate-embeddings function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
