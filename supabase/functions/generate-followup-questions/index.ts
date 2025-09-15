import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateLegalAnalysis } from "./openAiService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  clientId: string;
  caseId?: string;
  instructions?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { clientId, caseId, instructions }: RequestBody = await req.json();

    if (!clientId) {
      throw new Error("clientId is required");
    }

    console.log("🔄 Generate Follow-up Questions - Step 8:", { clientId, caseId });

    // Environment validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const geminiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !geminiKey) {
      throw new Error("Missing required environment variables");
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user_id from client record
    console.log("🔍 Looking up user_id for client:", clientId);
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("user_id")
      .eq("id", clientId)
      .single();

    if (clientError || !clientData) {
      console.error("Failed to find client:", clientError);
      throw new Error("Client not found");
    }

    const userId = clientData.user_id;
    console.log("✅ Found user_id:", userId);

    // 1) Fetch existing legal analyses to use as context
    console.log("📋 Fetching existing analysis context...");
    
    let query = supabase
      .from("legal_analyses")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (caseId) {
      query = query.eq("case_id", caseId);
    } else {
      query = query.is("case_id", null);
    }

    const { data: analyses, error: fetchError } = await query.limit(10);

    if (fetchError) {
      throw new Error(`Failed to fetch analysis context: ${fetchError.message}`);
    }

    if (!analyses || analyses.length === 0) {
      throw new Error("No existing legal analysis found to generate follow-up questions");
    }

    console.log(`📄 Found ${analyses.length} analysis records for context`);

    // 2) Prepare context from existing analyses
    const contextParts = [];
    
    // Include ALL available analyses to provide comprehensive context
    for (const analysis of analyses) {
      if (analysis?.content && analysis.content.trim().length > 50) {
        const cleanType = analysis.analysis_type.replace(/-/g, ' ').toUpperCase();
        contextParts.push(`=== ${cleanType} ===\n${analysis.content.trim()}\n`);
      }
    }

    const contextText = contextParts.join("\n");
    console.log("📝 Prepared context length:", contextText.length);
    
    // If we still don't have enough context, get more details
    if (contextText.length < 500) {
      console.log("⚠️ Limited context available. Including all analysis types...");
      for (const analysis of analyses) {
        if (analysis?.content) {
          contextParts.push(`${analysis.analysis_type}: ${analysis.content.substring(0, 1000)}`);
        }
      }
    }

    // 3) Create prompt for follow-up questions generation
    const baseInstructions = instructions || "Generate strategic follow-up questions to strengthen the case";
    
    const prompt = `Based on the comprehensive legal analysis provided below, generate targeted follow-up questions that would help strengthen this specific case and identify any gaps in the current analysis.

IMPORTANT: You MUST analyze the provided case context carefully and generate questions that are directly relevant to the specific facts, legal issues, and circumstances described in this case.

${baseInstructions}

CONTEXT FROM EXISTING ANALYSIS:
${contextText || "No detailed analysis context available yet. Please generate general strategic questions."}

Please generate 6-10 strategic follow-up questions that are SPECIFIC to this case. Organize them into these categories:

## Critical Information Gaps
- What specific facts are missing that could change the legal outcome?
- What timeline details need clarification?
- Which parties or relationships need better definition?

## Additional Investigation Needed  
- What evidence should be gathered?
- Which witnesses should be interviewed?
- What documents are missing?

## Expert Consultation
- What type of expert testimony might strengthen the case?
- Are there technical or specialized areas requiring professional analysis?

Format your response in clear, readable markdown. Each question should be actionable and directly relevant to the case details provided above. Avoid generic legal questions.`;

    console.log("🧠 Generating follow-up questions with OpenAI. Context length:", contextText.length);

    // 4) Generate with OpenAI using shared service
    const systemPrompt = "You are a senior legal strategist. Generate practical, actionable follow-up questions that help identify case strengths, weaknesses, and missing information. Focus on questions that would genuinely improve case preparation and strategy.";
    const { text: contentText } = await generateLegalAnalysis(prompt, systemPrompt, geminiKey);
    const content = (contentText || "").trim();
    const contentLength = content.length;

    console.log("📝 Follow-up questions generated. Length:", contentLength);

    if (contentLength < 100) {
      throw new Error("Generated content appears too short to be meaningful follow-up questions");
    }

    // 5) Try to preserve law references from the latest analysis
    let lawReferences = [];
    try {
      const latestAnalysisWithRefs = analyses.find(a => a.law_references && Array.isArray(a.law_references) && a.law_references.length > 0);
      if (latestAnalysisWithRefs) {
        lawReferences = latestAnalysisWithRefs.law_references;
        console.log("✅ Preserving law references from existing analysis:", lawReferences.length, "references");
      } else {
        console.log("📋 No law references found in existing analyses to preserve");
      }
    } catch (e) {
      console.warn("Failed to preserve law references:", e);
    }

    // 6) Save to legal_analyses table
    const insertData = {
      client_id: clientId,
      user_id: userId,
      case_id: caseId || null,
      analysis_type: "step-8-followup-questions",
      content: content,
      timestamp: new Date().toISOString(),
      law_references: lawReferences,
      provenance: {
        source: "individual-step-refresh",
        aiProvider: "openai-gpt5",
        step: 8,
        generatedAt: new Date().toISOString(),
        contentLength,
        contextAnalysesUsed: analyses.length,
        instructions: baseInstructions,
        preservedLawReferences: lawReferences.length
      }
    };

    const { data: savedAnalysis, error: saveError } = await supabase
      .from("legal_analyses")
      .insert(insertData)
      .select()
      .single();

    if (saveError) {
      throw new Error(`Failed to save follow-up questions: ${saveError.message}`);
    }

    console.log("✅ Follow-up questions saved with ID:", savedAnalysis.id);

    return new Response(
      JSON.stringify({
        success: true,
        id: savedAnalysis.id,
        contentLength,
        message: "Follow-up questions generated successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("❌ Error in generate-followup-questions:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to generate follow-up questions" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});