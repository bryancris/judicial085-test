import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }

    console.log("=== STARTING GLOBAL CASE ENRICHMENT JOB ===");

    // Get cases that need embeddings (no embeddings yet)
    const { data: casesNeedingEmbeddings, error: fetchError } = await supabase
      .from("courtlistener_cases")
      .select("id, case_name, snippet, full_text")
      .not("snippet", "is", null)
      .limit(10); // Process in batches

    if (fetchError) {
      throw new Error(`Error fetching cases: ${fetchError.message}`);
    }

    if (!casesNeedingEmbeddings || casesNeedingEmbeddings.length === 0) {
      console.log("No cases need embeddings");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No cases need enrichment",
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${casesNeedingEmbeddings.length} cases for enrichment`);

    let processed = 0;
    let errors = 0;

    for (const case_ of casesNeedingEmbeddings) {
      try {
        // Check if embeddings already exist for this case
        const { data: existingEmbeddings } = await supabase
          .from("courtlistener_case_embeddings")
          .select("id")
          .eq("case_id", case_.id)
          .limit(1);

        if (existingEmbeddings && existingEmbeddings.length > 0) {
          console.log(`Case ${case_.id} already has embeddings, skipping`);
          continue;
        }

        // Generate embedding for snippet
        if (case_.snippet) {
          const embedding = await generateEmbedding(case_.snippet, openaiApiKey);
          if (embedding) {
            await supabase
              .from("courtlistener_case_embeddings")
              .insert({
                case_id: case_.id,
                content_type: "snippet",
                content: case_.snippet,
                embedding: embedding
              });
            
            console.log(`✅ Generated snippet embedding for case ${case_.id}`);
          }
        }

        // Generate embedding for full text if available
        if (case_.full_text && case_.full_text.length > 100) {
          // Truncate very long texts to avoid API limits
          const truncatedText = case_.full_text.substring(0, 8000);
          const embedding = await generateEmbedding(truncatedText, openaiApiKey);
          if (embedding) {
            await supabase
              .from("courtlistener_case_embeddings")
              .insert({
                case_id: case_.id,
                content_type: "full_text",
                content: truncatedText,
                embedding: embedding
              });
            
            console.log(`✅ Generated full text embedding for case ${case_.id}`);
          }
        }

        // Extract legal concepts using AI
        await extractLegalConcepts(supabase, case_, openaiApiKey);

        processed++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing case ${case_.id}:`, error);
        errors++;
      }
    }

    // Clean up expired cache entries
    await cleanupExpiredCache(supabase);

    console.log(`=== ENRICHMENT JOB COMPLETE ===`);
    console.log(`Processed: ${processed} cases`);
    console.log(`Errors: ${errors} cases`);

    return new Response(JSON.stringify({ 
      success: true,
      processed: processed,
      errors: errors,
      message: `Successfully enriched ${processed} cases`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enrichment job:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Generate OpenAI embedding
async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

// Extract legal concepts using AI
async function extractLegalConcepts(supabase: any, case_: any, openaiApiKey: string): Promise<void> {
  try {
    const prompt = `Analyze this legal case and extract key legal concepts. Return a JSON array of objects with "type" and "value" fields.

Types should be one of: "legal_issue", "statute", "doctrine", "remedy"

Case: ${case_.case_name}
Text: ${case_.snippet || case_.full_text || ''}

Return only valid JSON, no explanation.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a legal concept extraction expert. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      console.error("OpenAI concept extraction error:", await response.text());
      return;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) return;

    try {
      const concepts = JSON.parse(content);
      
      if (Array.isArray(concepts)) {
        for (const concept of concepts) {
          if (concept.type && concept.value) {
            await supabase
              .from("courtlistener_case_concepts")
              .insert({
                case_id: case_.id,
                concept_type: concept.type,
                concept_value: concept.value,
                confidence: 0.8,
                extracted_by: "ai_analysis"
              });
          }
        }
        
        console.log(`✅ Extracted ${concepts.length} concepts for case ${case_.id}`);
      }
    } catch (parseError) {
      console.error("Error parsing extracted concepts:", parseError);
    }
  } catch (error) {
    console.error("Error extracting legal concepts:", error);
  }
}

// Clean up expired cache entries
async function cleanupExpiredCache(supabase: any): Promise<void> {
  try {
    const { error } = await supabase
      .from("courtlistener_search_cache")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (error) {
      console.error("Error cleaning up expired cache:", error);
    } else {
      console.log("✅ Cleaned up expired cache entries");
    }
  } catch (error) {
    console.error("Error in cache cleanup:", error);
  }
}