import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SimilarCase {
  source: "internal" | "courtlistener";
  clientId: string | null;
  clientName: string;
  similarity: number;
  relevantFacts: string;
  outcome: string;
  court?: string;
  citation?: string;
  dateDecided?: string;
  url?: string | null;
  agentReasoning?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== ENHANCED SEARCH SIMILAR CASES FUNCTION START ===");
    
    // Parse request body with error handling
    let clientId;
    try {
      const body = await req.json();
      clientId = body.clientId;
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return new Response(JSON.stringify({
        similarCases: [],
        error: "Invalid request format",
        searchStrategy: "parse-error"
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!clientId) {
      console.error("❌ Missing clientId in request");
      return new Response(JSON.stringify({
        similarCases: [],
        error: "Client ID is required",
        searchStrategy: "missing-client-id"
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 Processing AI-powered case search for client: ${clientId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client data for enhanced context
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !clientData) {
      console.error("❌ Client not found:", clientError);
      return new Response(JSON.stringify({
        similarCases: [],
        error: "Client not found",
        searchStrategy: "client-not-found"
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get recent client messages for context
    const { data: recentMessages } = await supabase
      .from('client_messages')
      .select('content, role')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Build intelligent search query from client context
    const caseTypes = clientData.case_types || [];
    const caseDescription = clientData.case_description || '';
    const incidentDescription = clientData.incident_description || '';
    
    // Extract key legal concepts
    const contextElements = [
      caseDescription,
      incidentDescription,
      caseTypes.join(' '),
      recentMessages?.slice(0, 3).map(m => m.content).join(' ') || ''
    ].filter(Boolean);

    // Detect HOA cases and enhance search
    const isHOACase = detectHOACase(contextElements);
    const searchQuery = buildTargetedSearchQuery(contextElements, isHOACase);

    console.log('🤖 Calling AI Agent Coordinator for intelligent case research...');

    // Use AI Agent Coordinator for intelligent case finding
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-agent-coordinator', {
        body: {
          query: searchQuery,
          clientId,
          researchTypes: ['legal-research', 'current-research'],
          context: {
            caseTypes,
            caseDescription,
            incidentDescription,
            searchFocus: 'similar-cases',
            isHOACase,
            specificSearchTerms: isHOACase ? generateHOASearchTerms(contextElements) : null
          }
        }
    });

    if (aiError) {
      console.error("❌ AI Agent Coordinator error:", aiError);
      return new Response(JSON.stringify({
        similarCases: [],
        error: "AI research temporarily unavailable",
        searchStrategy: "ai-coordinator-error"
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse AI response and extract cases
    const synthesizedContent = aiResponse?.synthesizedContent || '';
    const citations = aiResponse?.citations || [];
    
    console.log('✅ AI research completed. Parsing cases from response...');

    // Extract and format similar cases from AI response
    const similarCases: SimilarCase[] = [];

    // Process CourtListener verified citations from AI response
    const courtListenerCases = citations.filter(c => c.source === 'CourtListener' && c.verified);
    
    courtListenerCases.forEach((citation: any, index: number) => {
      const relevantFacts = extractRelevantFacts(synthesizedContent, citation.title);
      const outcome = extractOutcome(synthesizedContent, citation.title);
      
      similarCases.push({
        source: "courtlistener",
        clientId: null,
        clientName: citation.title,
        similarity: citation.relevance || 85,
        relevantFacts: relevantFacts || "Legal precedent relevant to the case analysis",
        outcome: outcome || "Court decision with applicable legal reasoning",
        court: citation.court || "Court not specified",
        citation: citation.title,
        dateDecided: citation.date_filed || "",
        url: citation.url,
        agentReasoning: `AI-identified case with ${citation.relevance || 85}% relevance based on legal analysis`
      });
    });

    // If no verified cases found, extract cases from content
    if (similarCases.length === 0) {
      const extractedCases = extractCasesFromContent(synthesizedContent);
      similarCases.push(...extractedCases);
    }

    // For HOA cases with insufficient results, try CourtListener fallback
    if (isHOACase && similarCases.length < 3) {
      console.log("🏘️ HOA case with insufficient results, trying CourtListener fallback...");
      const fallbackCases = await tryCourtListenerFallback(contextElements);
      similarCases.push(...fallbackCases);
    }

    console.log(`🎯 Found ${similarCases.length} similar cases through AI analysis`);

    // Try to save to database, but don't fail if it doesn't work
    let dbSaveSuccess = false;
    try {
      if (similarCases.length > 0) {
        // Get the most recent legal analysis for this client
        const { data: analysisData, error: analysisError } = await supabase
          .from('legal_analyses')
          .select('id')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (analysisError || !analysisData) {
          console.warn("⚠️ No legal analysis found for client, cannot save similar cases to database");
          console.warn("Analysis error:", analysisError);
        } else {
          // Save the search result to similar_cases table using the correct legal_analysis_id
          const { error: saveError } = await supabase
            .from('similar_cases')
            .upsert({
              client_id: clientId,
              legal_analysis_id: analysisData.id, // Use the actual legal analysis ID
              case_data: similarCases,
              search_metadata: {
                fallbackUsed: false,
                analysisFound: true,
                searchStrategy: "ai-agent-coordinator",
                citationsCount: citations.length,
                timestamp: new Date().toISOString()
              },
              global_case_ids: courtListenerCases.map(() => crypto.randomUUID()) // Generate UUIDs for global case tracking
            });
          
          if (saveError) {
            console.warn("⚠️ Failed to save to database, but returning results anyway:", saveError);
          } else {
            console.log("✅ Successfully saved similar cases to database");
            dbSaveSuccess = true;
          }
        }
      }
    } catch (dbError) {
      console.warn("⚠️ Database save failed, but returning results anyway:", dbError);
    }

    return new Response(JSON.stringify({
      similarCases,
      fallbackUsed: false,
      analysisFound: true,
      searchStrategy: "ai-agent-coordinator",
      dbSaved: dbSaveSuccess,
      aiMetadata: {
        researchSources: aiResponse?.researchSources || [],
        citationsCount: citations.length,
        synthesisEngine: "gemini-enhanced"
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("❌ Unexpected error in enhanced search similar cases:", error);
    
    return new Response(JSON.stringify({
      similarCases: [],
      error: `Unexpected error: ${error.message || "Unknown error occurred"}`,
      searchStrategy: "unexpected-error"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Extract relevant facts for a specific case from AI content
 */
function extractRelevantFacts(content: string, caseName: string): string {
  const lines = content.split('\n');
  let inCaseSection = false;
  let facts = '';
  
  for (const line of lines) {
    if (line.includes(caseName)) {
      inCaseSection = true;
      continue;
    }
    
    if (inCaseSection) {
      if (line.includes('Facts:') || line.includes('**Facts:**')) {
        const factsMatch = line.match(/\*\*Facts:\*\*(.+)/);
        if (factsMatch) {
          facts = factsMatch[1].trim();
          break;
        }
      }
      
      if (line.startsWith('### ') || line.startsWith('## ')) {
        break; // End of case section
      }
    }
  }
  
  return facts || "Case facts relevant to legal analysis";
}

/**
 * Extract outcome for a specific case from AI content
 */
function extractOutcome(content: string, caseName: string): string {
  const lines = content.split('\n');
  let inCaseSection = false;
  let outcome = '';
  
  for (const line of lines) {
    if (line.includes(caseName)) {
      inCaseSection = true;
      continue;
    }
    
    if (inCaseSection) {
      if (line.includes('Holding:') || line.includes('**Holding:**')) {
        const holdingMatch = line.match(/\*\*Holding:\*\*(.+)/);
        if (holdingMatch) {
          outcome = holdingMatch[1].trim();
          break;
        }
      }
      
      if (line.startsWith('### ') || line.startsWith('## ')) {
        break; // End of case section
      }
    }
  }
  
  return outcome || "Court decision with applicable legal precedent";
}

/**
 * Extract cases from AI content when no verified citations available
 */
function extractCasesFromContent(content: string): SimilarCase[] {
  const cases: SimilarCase[] = [];
  const casePattern = /\*\*([A-Z][^v]*v\.[^*]+)\*\*/g;
  let match;
  
  while ((match = casePattern.exec(content)) !== null && cases.length < 5) {
    const caseName = match[1].trim();
    
    cases.push({
      source: "courtlistener",
      clientId: null,
      clientName: caseName,
      similarity: 75,
      relevantFacts: extractRelevantFacts(content, caseName),
      outcome: extractOutcome(content, caseName),
      court: "Court not specified",
      citation: caseName,
      dateDecided: "",
      url: null,
      agentReasoning: "AI-identified case from legal research analysis"
    });
  }
  
  return cases;
}

/**
 * Detect if this is an HOA-related case
 */
function detectHOACase(contextElements: string[]): boolean {
  const combinedText = contextElements.join(' ').toLowerCase();
  
  const hoaIndicators = [
    'hoa', 'homeowners association', 'homeowner association',
    'cc&r', 'restrictive covenant', 'deed restriction',
    'commercial vehicle', 'hoa board', 'property restriction',
    'selective enforcement', 'covenant enforcement',
    'homeowners', 'homeowner'
  ];
  
  return hoaIndicators.some(indicator => combinedText.includes(indicator));
}

/**
 * Build targeted search query based on case type
 */
function buildTargetedSearchQuery(contextElements: string[], isHOACase: boolean): string {
  const baseContext = contextElements.join('. ');
  
  if (isHOACase) {
    return `Find me HOA and homeowners association legal precedents specifically related to: ${baseContext}. 

I need cases that deal with:
- HOA selective enforcement of CC&Rs and restrictive covenants
- Commercial vehicle restrictions in residential communities
- Texas Property Code sections 202 and 204 (HOA governance)
- Discriminatory or inconsistent enforcement by HOA boards
- Waiver and estoppel defenses against HOA enforcement
- Homeowners association board conflicts of interest
- Texas cases involving deed restrictions and covenant enforcement

Focus on Texas court decisions that establish precedents for HOA disputes, especially cases involving selective enforcement, waiver, estoppel, and Property Code violations.`;
  }
  
  return `Can you find me some case law related to: ${baseContext}. I need similar cases that deal with these legal issues, particularly focusing on case precedents that would be relevant for analysis.`;
}

/**
 * Generate HOA-specific search terms for fallback
 */
function generateHOASearchTerms(contextElements: string[]): string[] {
  const combinedText = contextElements.join(' ').toLowerCase();
  const terms = [];
  
  // Core HOA terms
  terms.push('"HOA selective enforcement"');
  terms.push('"homeowners association"');
  terms.push('"restrictive covenants"');
  
  // Texas Property Code
  terms.push('"Texas Property Code 202"');
  terms.push('"Texas Property Code 204"');
  
  // Specific to commercial vehicle cases
  if (combinedText.includes('vehicle') || combinedText.includes('commercial')) {
    terms.push('"commercial vehicle restriction"');
    terms.push('"CC&R vehicle"');
  }
  
  // Legal concepts
  terms.push('"selective enforcement"');
  terms.push('"waiver estoppel"');
  terms.push('"deed restrictions"');
  
  return terms;
}

/**
 * CourtListener fallback for HOA cases
 */
async function tryCourtListenerFallback(contextElements: string[]): Promise<SimilarCase[]> {
  try {
    console.log("🔍 Attempting CourtListener fallback for HOA case...");
    
    const hoaSearchTerms = generateHOASearchTerms(contextElements);
    const searchQuery = hoaSearchTerms.slice(0, 4).join(' OR ') + ' Texas';
    
    console.log(`CourtListener search terms: ${searchQuery}`);
    
    // This would be a direct CourtListener API call
    // For now, return empty array since we don't have the API key here
    // In a real implementation, this would make the API call
    
    return [];
  } catch (error) {
    console.error("CourtListener fallback failed:", error);
    return [];
  }
}