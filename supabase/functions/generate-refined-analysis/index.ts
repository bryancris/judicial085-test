import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.3";
// Removed Gemini import - using OpenAI directly

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  clientId: string;
  caseId?: string | null;
  instructions?: string; // optional override
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, caseId, instructions }: RequestBody = await req.json();

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "clientId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase environment configuration");
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get user_id from client record
    console.log("🔍 Looking up user_id for client:", clientId);
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("user_id")
      .eq("id", clientId)
      .single();

    if (clientError || !clientData) {
      console.error("Failed to find client:", clientError);
      return new Response(
        JSON.stringify({ error: "Client not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = clientData.user_id;
    console.log("✅ Found user_id:", userId);

    // Ensure OpenAI API key exists before proceeding
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      console.error("❌ OpenAI API key not found");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1) Load latest substantive analysis as context (prefer case-specific)
    console.log("🧱 Loading base analysis for refined synthesis", { clientId, caseId });

    const baseSelect = supabaseAdmin
      .from("legal_analyses")
      .select("id, content, created_at, analysis_type, validation_status, case_id")
      .eq("client_id", clientId)
      .in("validation_status", ["validated", "pending_review"]) as any;

    let baseAnalysis: any = null;

    if (caseId) {
      const { data: caseAnalyses, error: caseErr } = await baseSelect
        .eq("case_id", caseId)
        .neq("analysis_type", "coordinator-research")
        .neq("analysis_type", "step-7-refined-analysis")
        .order("created_at", { ascending: false })
        .limit(1);
      if (caseErr) throw caseErr;
      if (caseAnalyses && caseAnalyses.length > 0) baseAnalysis = caseAnalyses[0];
    }

    if (!baseAnalysis) {
      const { data: clientAnalyses, error: clientErr } = await baseSelect
        .is("case_id", null)
        .neq("analysis_type", "coordinator-research")
        .neq("analysis_type", "step-7-refined-analysis")
        .order("created_at", { ascending: false })
        .limit(1);
      if (clientErr) throw clientErr;
      if (clientAnalyses && clientAnalyses.length > 0) baseAnalysis = clientAnalyses[0];
    }

    if (!baseAnalysis) {
      console.warn("No base analysis found; proceeding with minimal context");
    }

    // 2) Build prompt for Step 7 (freeform refined analysis)
    const contextText = baseAnalysis?.content ?? "";
    const header = `You are a senior attorney. Produce Step 7: Refined Analysis (Comprehensive synthesis + Risk Assessment + Practical counsel) for client ${clientId}${caseId ? `, case ${caseId}` : ''}.`;

    const defaultInstructions = `
- Synthesize the fact pattern into the most salient legal issues.
- Integrate relevant statutes and case law by name (no hallucinations; be conservative where unsure).
- Provide a structured, practical strategy (1-2 pages) with:
  1) Issues and likely outcomes, 2) Best arguments for both sides, 3) Key risks and risk ratings, 4) Next actions with timelines, 5) Client-facing plain-language counsel.
- Keep it actionable, concise, and avoid speculation. Use bullet lists where helpful.
`;

    const prompt = `${header}\n\nContext:\n${contextText}\n\nInstructions:\n${instructions || defaultInstructions}`;

    console.log("🧠 Generating refined analysis with OpenAI. Context length:", contextText.length);

    // 3) Generate with OpenAI API
    const systemPrompt = "You are a senior attorney. Follow strict legal writing standards, avoid hallucinations, cite only real statutes/cases conservatively, and provide practical, client-facing guidance. Output clear markdown headings.";
    
    console.log("🤖 OpenAI API Request (gpt-5-2025-08-07):", {
      model: "gpt-5-2025-08-07",
      promptLength: prompt.length,
      hasSystemPrompt: true
    });

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5-2025-08-07",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        max_completion_tokens: 2000
      })
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('❌ OpenAI API returned an error:', errorData);
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const openAIData = await openAIResponse.json();

    if (!openAIData.choices || openAIData.choices.length === 0) {
      console.error('❌ OpenAI API error:', openAIData);
      throw new Error('Failed to generate response');
    }

    const content = (openAIData.choices[0].message.content || "").trim();
    const contentLength = content.length;
    
    console.log("✅ OpenAI API Success:", {
      responseLength: contentLength,
      usage: openAIData.usage
    });

    console.log("📝 Refined analysis generated. Length:", contentLength);

    if (contentLength < 200) {
      return new Response(
        JSON.stringify({ error: "Generated content too short", contentLength }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4) Insert into legal_analyses as dedicated Step 7 record
    const insertPayload: any = {
      client_id: clientId,
      user_id: userId,
      analysis_type: "step-7-refined-analysis",
      content,
      validation_status: contentLength >= 400 ? "validated" : "pending_review",
      timestamp: new Date().toISOString(),
      ai_provider: "openai-gpt-5",
      provenance: "individual-step-refresh",
      metadata: {
        model: "gpt-5-2025-08-07",
        usage: openAIData.usage,
        contentLength
      }
    };
    if (caseId) insertPayload.case_id = caseId;

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("legal_analyses")
      .insert(insertPayload)
      .select("id, created_at")
      .limit(1);

    if (insertErr) {
      console.error("Failed to save refined analysis:", insertErr);
      return new Response(
        JSON.stringify({ error: "Failed to save refined analysis", details: insertErr.message, contentLength }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("💾 Saved refined analysis", inserted?.[0]);

    return new Response(
      JSON.stringify({ ok: true, contentLength, id: inserted?.[0]?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error in generate-refined-analysis:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});