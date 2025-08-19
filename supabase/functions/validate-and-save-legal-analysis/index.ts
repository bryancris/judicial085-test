import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ValidationResult {
  validation_status: string;
  validation_score: number;
  validation_details: any;
}

interface SaveRequest {
  clientId: string;
  caseId?: string;
  content: string;
  timestamp: string;
  analysisType?: string;
  caseType?: string;
  lawReferences?: any[];
  documentsUsed?: any[];
  factSources?: any[];
  citations?: any[];
  provenance?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: SaveRequest = await req.json();
    const { 
      clientId, 
      caseId, 
      content, 
      timestamp, 
      analysisType = 'client-intake',
      caseType,
      lawReferences = [],
      documentsUsed = [],
      factSources = [],
      citations = [],
      provenance = {}
    } = payload;

    if (!clientId || !content || !timestamp) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: clientId, content, timestamp' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for validation
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.0");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Validating analysis for client ${clientId} by user ${user.id}`);

    // STEP 1: Run validation checks
    // 🔥 PRE-VALIDATION HYPOTHETICAL DETECTOR: Additional safety check
    const hypotheticalPatterns = [
      'hypothetical', 'illustrative scenario', 'without specific facts',
      'for example, a car accident', 'generic legal analysis', 'theoretical case',
      'sample case', 'typical situation'
    ];
    
    const lowerContent = content.toLowerCase();
    const foundHypotheticalPattern = hypotheticalPatterns.find(pattern => 
      lowerContent.includes(pattern)
    );
    
    if (foundHypotheticalPattern) {
      console.log(`❌ BLOCKING in validator: Hypothetical content detected: "${foundHypotheticalPattern}"`);
      return new Response(
        JSON.stringify({ 
          error: "Content appears to be hypothetical or generic and cannot be saved.",
          code: "HYPOTHETICAL_CONTENT_BLOCKED"
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: validationResult, error: validationError } = await supabase
      .rpc('validate_legal_analysis', {
        analysis_content: content,
        fact_sources: factSources,
        citations: citations
      }) as { data: ValidationResult[] | null; error: any };

    if (validationError) {
      console.error('❌ Validation function error:', validationError);
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validationResult || validationResult.length === 0) {
      console.error('❌ No validation result returned');
      return new Response(
        JSON.stringify({ error: 'Validation failed - no result' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validationResult[0];
    
    console.log(`📊 Validation result: ${validation.validation_status} (score: ${validation.validation_score})`);
    console.log(`📋 Validation details:`, validation.validation_details);

    // STEP 2: Blocking check - reject if status is 'rejected'
    if (validation.validation_status === 'rejected') {
      console.error('🚫 Analysis rejected by validation');
      return new Response(
        JSON.stringify({ 
          error: 'Analysis rejected by validation system',
          validation: validation
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 3: Enhanced provenance tracking
    const enhancedProvenance = {
      ...provenance,
      validated_at: new Date().toISOString(),
      validator_version: '1.0',
      validation_score: validation.validation_score,
      validation_details: validation.validation_details,
      fact_sources_count: factSources.length,
      citations_count: citations.length,
      content_length: content.length,
      user_id: user.id
    };

    // STEP 4: Save to database with validation metadata
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('legal_analyses')
      .insert({
        client_id: clientId,
        case_id: caseId || null,
        user_id: user.id,
        content,
        timestamp,
        analysis_type: analysisType,
        case_type: caseType,
        law_references: lawReferences,
        validation_status: validation.validation_status,
        validation_score: validation.validation_score,
        validated_at: new Date().toISOString(),
        provenance: enhancedProvenance,
        fact_sources: factSources,
        citation_verified: citations.length > 0
      })
      .select()
      .single();

    if (saveError) {
      console.error('❌ Database save error:', saveError);
      return new Response(
        JSON.stringify({ error: 'Failed to save analysis', details: saveError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Analysis saved successfully with ID: ${savedAnalysis.id}`);

    // STEP 5: Return success response
    return new Response(
      JSON.stringify({
        success: true,
        analysis_id: savedAnalysis.id,
        validation: {
          status: validation.validation_status,
          score: validation.validation_score,
          details: validation.validation_details
        },
        metadata: {
          validated: true,
          fact_sources_verified: factSources.length > 0,
          citations_verified: citations.length > 0,
          content_verified: content.length > 50
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Unexpected error in validate-and-save-legal-analysis:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});