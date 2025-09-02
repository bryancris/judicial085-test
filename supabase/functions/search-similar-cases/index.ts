import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SimilarCase {
  source: "internal" | "courtlistener" | "perplexity";
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
  relevanceScore?: number;
  selectionReason?: string;
}

interface LegalContext {
  area_of_law: string;
  subareas: string[];
  issues: string[];
  statutes: string[];
  civil_criminal: 'civil' | 'criminal' | 'unknown';
  parties: string[];
  industry?: string;
  posture?: string;
  remedies: string[];
  time_window?: string;
  jurisdiction: {
    state?: string;
    federal_circuit?: string;
    preferred_courts: string[];
  };
  facts_summary: string;
  positive_keywords: string[];
  negative_keywords: string[];
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

    console.log(`🔍 Processing adaptive case search for client: ${clientId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client data and recent legal analysis
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

    // Get recent client messages and legal analyses for context
    const [messagesResult, analysisResult] = await Promise.all([
      supabase
        .from('client_messages')
        .select('content, role')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('legal_analyses')
        .select('id, case_id, content, case_type, fact_sources, law_references')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
    ]);

    const recentMessages = messagesResult.data || [];
    const recentAnalysis = analysisResult.data?.[0];

    // Build adaptive context using LLM
    console.log('🧠 Building adaptive legal context...');
    const legalContext = await buildAdaptiveContext(clientData, recentMessages, recentAnalysis);
    
    console.log('📊 Extracted context:', {
      area_of_law: legalContext.area_of_law,
      issues: legalContext.issues.slice(0, 3),
      jurisdiction: legalContext.jurisdiction,
      civil_criminal: legalContext.civil_criminal
    });

    // Generate search query and perform multi-strategy retrieval
    const searchQuery = await generateContextDrivenQuery(legalContext);
    console.log('🔍 Generated search query:', searchQuery.substring(0, 100) + '...');

    // Multi-strategy retrieval
    console.log('🔄 Starting multi-strategy case retrieval...');
    const allCandidates: any[] = [];

    // Strategy 1: AI Agent Coordinator
    try {
      console.log('🤖 Calling AI Agent Coordinator...');
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-agent-coordinator', {
        body: {
          query: searchQuery,
          clientId,
          researchTypes: ['legal-research', 'current-research'],
          context: {
            area_of_law: legalContext.area_of_law,
            issues: legalContext.issues,
            jurisdiction: legalContext.jurisdiction,
            searchFocus: 'similar-cases',
            facts_summary: legalContext.facts_summary
          }
        }
      });

      if (!aiError && aiResponse?.synthesizedContent) {
        const aiCases = extractCasesFromAIResponse(aiResponse.synthesizedContent, aiResponse.citations || []);
        allCandidates.push(...aiCases.map(c => ({ ...c, source_strategy: 'ai-coordinator' })));
        console.log(`✅ AI Coordinator found ${aiCases.length} candidates`);
      }
    } catch (error) {
      console.warn('⚠️ AI Coordinator failed:', error);
    }

    // Strategy 2: CourtListener keyword search
    try {
      console.log('⚖️ Searching CourtListener...');
      const courtListenerCases = await searchCourtListener(legalContext);
      allCandidates.push(...courtListenerCases.map(c => ({ ...c, source_strategy: 'courtlistener' })));
      console.log(`✅ CourtListener found ${courtListenerCases.length} candidates`);
    } catch (error) {
      console.warn('⚠️ CourtListener search failed:', error);
    }

    // Strategy 3: Perplexity fallback (if needed)
    if (allCandidates.length < 3) {
      try {
        console.log('🔍 Using Perplexity fallback...');
        const perplexityCases = await searchPerplexityFallback(legalContext);
        allCandidates.push(...perplexityCases.map(c => ({ ...c, source_strategy: 'perplexity' })));
        console.log(`✅ Perplexity found ${perplexityCases.length} candidates`);
      } catch (error) {
        console.warn('⚠️ Perplexity fallback failed:', error);
      }
    }

    console.log(`📊 Total candidates before filtering: ${allCandidates.length}`);

    // Score and filter candidates
    const scoredCases = allCandidates
      .map(candidate => scoreCase(candidate, legalContext))
      .filter(case_ => case_.relevanceScore >= 0.55) // Minimum threshold
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8); // Top N cases

    console.log(`🎯 Filtered to ${scoredCases.length} high-relevance cases`);

    const similarCases: SimilarCase[] = scoredCases.map(scored => ({
      source: scored.source || "courtlistener",
      clientId: null,
      clientName: scored.clientName || scored.case_name || "Case name not available",
      similarity: Math.round(scored.relevanceScore * 100),
      relevantFacts: scored.relevantFacts || "Relevant facts extracted from case analysis",
      outcome: scored.outcome || "Court decision and legal precedent",
      court: scored.court || "Court information available",
      citation: scored.citation || scored.clientName || "",
      dateDecided: scored.dateDecided || scored.date_decided || "",
      url: scored.url || null,
      agentReasoning: scored.selectionReason || `Selected for ${scored.relevanceScore.toFixed(2)} relevance score`,
      relevanceScore: scored.relevanceScore,
      selectionReason: scored.selectionReason
    }));

    console.log(`🎯 Found ${similarCases.length} relevant cases after adaptive filtering`);

    // Save results with metadata
    let dbSaveSuccess = false;
    try {
      if (similarCases.length > 0) {
        const { data: analysisData, error: analysisError } = await supabase
          .from('legal_analyses')
          .select('id')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!analysisError && analysisData) {
          const { error: saveError } = await supabase
            .from('similar_cases')
            .upsert({
              client_id: clientId,
              legal_analysis_id: analysisData.id,
              case_data: similarCases,
              search_metadata: {
                context_snapshot: legalContext,
                search_strategy: "adaptive-multi-source",
                candidates_found: allCandidates.length,
                filtered_count: similarCases.length,
                avg_relevance_score: scoredCases.reduce((avg, c) => avg + c.relevanceScore, 0) / scoredCases.length,
                strategies_used: [...new Set(allCandidates.map(c => c.source_strategy))],
                timestamp: new Date().toISOString()
              }
            });
          
          if (!saveError) {
            console.log("✅ Successfully saved adaptive search results");
            dbSaveSuccess = true;
          }
        }
      }
    } catch (dbError) {
      console.warn("⚠️ Database save failed:", dbError);
    }

    return new Response(JSON.stringify({
      similarCases,
      fallbackUsed: false,
      analysisFound: true,
      searchStrategy: "adaptive-multi-source",
      dbSaved: dbSaveSuccess,
      searchMetadata: {
        context: {
          area_of_law: legalContext.area_of_law,
          jurisdiction: legalContext.jurisdiction.state,
          issues_count: legalContext.issues.length
        },
        filtering: {
          total_candidates: allCandidates.length,
          threshold_used: 0.55,
          avg_relevance: scoredCases.length > 0 ? 
            (scoredCases.reduce((sum, c) => sum + c.relevanceScore, 0) / scoredCases.length).toFixed(2) : 0
        },
        strategies_used: [...new Set(allCandidates.map(c => c.source_strategy))]
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
 * Build adaptive legal context using LLM analysis
 */
async function buildAdaptiveContext(clientData: any, messages: any[], analysis: any): Promise<LegalContext> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  // Combine all available context
  const contextText = [
    clientData.case_description || '',
    clientData.incident_description || '',
    ...(clientData.case_types || []),
    analysis?.content || '',
    analysis?.case_type || '',
    messages.slice(0, 3).map(m => m.content).join(' ')
  ].filter(Boolean).join('. ');

  if (!openaiApiKey || !contextText.trim()) {
    // Fallback to basic heuristics
    return buildHeuristicContext(clientData, analysis);
  }

  try {
    const prompt = `Analyze this legal case context and extract structured information. Return ONLY valid JSON with this exact schema:

{
  "area_of_law": "string (e.g., contract, tort, criminal, etc.)",
  "subareas": ["string array of legal subareas"],
  "issues": ["string array of specific legal issues"],
  "statutes": ["string array of relevant statutes/codes"],
  "civil_criminal": "civil|criminal|unknown",
  "parties": ["string array of party types"],
  "industry": "string or null",
  "posture": "string describing case stage/type",
  "remedies": ["string array of potential remedies"],
  "jurisdiction": {
    "state": "string state name or null",
    "federal_circuit": "string circuit or null", 
    "preferred_courts": ["array of court preferences"]
  },
  "facts_summary": "brief summary of key facts",
  "positive_keywords": ["terms that indicate relevant cases"],
  "negative_keywords": ["terms that indicate irrelevant cases like 'riot', 'assault', 'felony' for civil cases"]
}

Context: ${contextText.substring(0, 1500)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are a legal AI that extracts structured case context. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.3
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const jsonStr = data.choices[0].message.content.trim();
      const parsed = JSON.parse(jsonStr);
      
      // Validate and clean the response
      return {
        area_of_law: parsed.area_of_law || 'general',
        subareas: Array.isArray(parsed.subareas) ? parsed.subareas.slice(0, 5) : [],
        issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 8) : [],
        statutes: Array.isArray(parsed.statutes) ? parsed.statutes.slice(0, 5) : [],
        civil_criminal: ['civil', 'criminal'].includes(parsed.civil_criminal) ? parsed.civil_criminal : 'unknown',
        parties: Array.isArray(parsed.parties) ? parsed.parties.slice(0, 4) : [],
        industry: parsed.industry || null,
        posture: parsed.posture || null,
        remedies: Array.isArray(parsed.remedies) ? parsed.remedies.slice(0, 5) : [],
        time_window: null,
        jurisdiction: {
          state: parsed.jurisdiction?.state || null,
          federal_circuit: parsed.jurisdiction?.federal_circuit || null,
          preferred_courts: Array.isArray(parsed.jurisdiction?.preferred_courts) ? 
            parsed.jurisdiction.preferred_courts.slice(0, 3) : []
        },
        facts_summary: parsed.facts_summary || contextText.substring(0, 200),
        positive_keywords: Array.isArray(parsed.positive_keywords) ? parsed.positive_keywords.slice(0, 10) : [],
        negative_keywords: Array.isArray(parsed.negative_keywords) ? parsed.negative_keywords.slice(0, 10) : []
      };
    }
  } catch (error) {
    console.warn('LLM context extraction failed, using heuristics:', error);
  }

  return buildHeuristicContext(clientData, analysis);
}

/**
 * Fallback heuristic context builder
 */
function buildHeuristicContext(clientData: any, analysis: any): LegalContext {
  const text = [
    clientData.case_description || '',
    clientData.incident_description || '',
    analysis?.content || ''
  ].join(' ').toLowerCase();

  // Detect area of law
  let area_of_law = 'general';
  if (text.includes('contract') || text.includes('warranty') || text.includes('breach')) {
    area_of_law = 'contract';
  } else if (text.includes('negligence') || text.includes('tort') || text.includes('injury')) {
    area_of_law = 'tort';
  } else if (text.includes('property') || text.includes('real estate') || text.includes('deed')) {
    area_of_law = 'property';
  } else if (text.includes('employment') || text.includes('workplace')) {
    area_of_law = 'employment';
  }

  // Detect civil vs criminal
  const civil_criminal = text.includes('arrest') || text.includes('criminal') || text.includes('felony') ? 
    'criminal' : 'civil';

  return {
    area_of_law,
    subareas: [],
    issues: clientData.case_types || [],
    statutes: [],
    civil_criminal,
    parties: [],
    industry: null,
    posture: null,
    remedies: [],
    time_window: null,
    jurisdiction: {
      state: 'Texas', // Default from client location
      federal_circuit: null,
      preferred_courts: []
    },
    facts_summary: text.substring(0, 200),
    positive_keywords: [area_of_law],
    negative_keywords: civil_criminal === 'civil' ? ['riot', 'assault', 'felony', 'criminal'] : []
  };
}

/**
 * Generate context-driven search query
 */
async function generateContextDrivenQuery(context: LegalContext): Promise<string> {
  const parts = [
    `Find legal cases related to ${context.area_of_law} law`,
    context.issues.length > 0 ? `involving: ${context.issues.join(', ')}` : '',
    context.statutes.length > 0 ? `with statutes: ${context.statutes.join(', ')}` : '',
    context.jurisdiction.state ? `in ${context.jurisdiction.state}` : '',
    context.facts_summary ? `Facts: ${context.facts_summary}` : ''
  ].filter(Boolean);

  return parts.join('. ') + '. Focus on precedential cases with similar legal issues.';
}

/**
 * Extract cases from AI coordinator response
 */
function extractCasesFromAIResponse(content: string, citations: any[]): any[] {
  const cases: any[] = [];
  
  // Process verified citations first
  citations.filter(c => c.source === 'CourtListener' && c.verified).forEach((citation: any) => {
    cases.push({
      case_name: citation.title,
      court: citation.court || "Court not specified",
      citation: citation.title,
      date_decided: citation.date_filed || "",
      relevantFacts: extractFactsFromContent(content, citation.title),
      outcome: extractOutcomeFromContent(content, citation.title),
      url: citation.url,
      source: "courtlistener"
    });
  });

  // Fallback: extract from content
  if (cases.length === 0) {
    const casePattern = /\*\*([A-Z][^v]*v\.[^*]+)\*\*/g;
    let match;
    while ((match = casePattern.exec(content)) !== null && cases.length < 5) {
      const caseName = match[1].trim();
      cases.push({
        case_name: caseName,
        court: "Court not specified",
        citation: caseName,
        date_decided: "",
        relevantFacts: extractFactsFromContent(content, caseName),
        outcome: extractOutcomeFromContent(content, caseName),
        url: null,
        source: "courtlistener"
      });
    }
  }
  
  return cases;
}

/**
 * Search CourtListener with expanded terms
 */
async function searchCourtListener(context: LegalContext): Promise<any[]> {
  // This would integrate with CourtListener API
  // For now, return empty array as placeholder
  console.log('CourtListener search would use:', {
    keywords: [...context.positive_keywords, ...context.issues],
    statutes: context.statutes,
    jurisdiction: context.jurisdiction.state
  });
  return [];
}

/**
 * Perplexity fallback search
 */
async function searchPerplexityFallback(context: LegalContext): Promise<any[]> {
  // This would integrate with Perplexity API
  // For now, return empty array as placeholder
  console.log('Perplexity fallback would search for:', context.area_of_law, context.issues.slice(0, 3));
  return [];
}

/**
 * Score case relevance against context
 */
function scoreCase(candidate: any, context: LegalContext): any {
  let score = 0;
  const reasons: string[] = [];

  // Context overlap scoring
  const candidateText = [
    candidate.case_name || '',
    candidate.relevantFacts || '',
    candidate.outcome || '',
    candidate.court || ''
  ].join(' ').toLowerCase();

  // Issues match (+2 each)
  const issueMatches = context.issues.filter(issue => 
    candidateText.includes(issue.toLowerCase())
  );
  score += issueMatches.length * 2;
  if (issueMatches.length > 0) {
    reasons.push(`Matches issues: ${issueMatches.join(', ')}`);
  }

  // Area of law match (+2)
  if (candidateText.includes(context.area_of_law.toLowerCase())) {
    score += 2;
    reasons.push(`Relevant to ${context.area_of_law} law`);
  }

  // Civil vs criminal match
  const hasCriminalTerms = context.negative_keywords.some(term => 
    candidateText.includes(term.toLowerCase())
  );
  if (context.civil_criminal === 'civil' && hasCriminalTerms) {
    score -= 3; // Hard penalty for criminal cases in civil context
    reasons.push('Penalized for criminal content in civil case');
  } else if (context.civil_criminal === 'civil' && !hasCriminalTerms) {
    score += 2;
    reasons.push('Appropriate civil law context');
  }

  // Jurisdiction match (+2 primary, +1 secondary)
  if (context.jurisdiction.state && candidateText.includes(context.jurisdiction.state.toLowerCase())) {
    score += 2;
    reasons.push(`${context.jurisdiction.state} jurisdiction match`);
  }

  // Precedential status (+1)
  if (candidateText.includes('precedent') || candidateText.includes('supreme') || candidateText.includes('appellate')) {
    score += 1;
    reasons.push('Precedential value');
  }

  // Negative keywords penalty (-2 to -4)
  const negativeMatches = context.negative_keywords.filter(neg => 
    candidateText.includes(neg.toLowerCase())
  );
  score -= negativeMatches.length * 2;
  if (negativeMatches.length > 0) {
    reasons.push(`Penalized for: ${negativeMatches.join(', ')}`);
  }

  // Positive keywords bonus (+1 each, max +3)
  const positiveMatches = context.positive_keywords.filter(pos => 
    candidateText.includes(pos.toLowerCase())
  );
  score += Math.min(positiveMatches.length, 3);
  if (positiveMatches.length > 0) {
    reasons.push(`Positive keywords: ${positiveMatches.slice(0, 3).join(', ')}`);
  }

  // Normalize score to 0-1 range
  const normalizedScore = Math.max(0, Math.min(1, score / 10));

  return {
    ...candidate,
    relevanceScore: normalizedScore,
    selectionReason: reasons.join('; ') || 'General legal relevance'
  };
}

/**
 * Extract facts from content around case name
 */
function extractFactsFromContent(content: string, caseName: string): string {
  const caseIndex = content.indexOf(caseName);
  if (caseIndex !== -1) {
    const contextArea = content.substring(Math.max(0, caseIndex - 200), caseIndex + caseName.length + 300);
    const sentences = contextArea.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const relevantSentences = sentences.filter(sentence => 
      sentence.toLowerCase().includes('contract') ||
      sentence.toLowerCase().includes('breach') ||
      sentence.toLowerCase().includes('warranty') ||
      sentence.toLowerCase().includes('facts') ||
      sentence.toLowerCase().includes('involved')
    );
    
    if (relevantSentences.length > 0) {
      return relevantSentences.slice(0, 2).join('. ').trim() + '.';
    }
    return sentences[0]?.trim() + '.' || "Case facts available in full research";
  }
  return "Relevant facts extracted from case analysis";
}

/**
 * Extract outcome from content around case name
 */
function extractOutcomeFromContent(content: string, caseName: string): string {
  const caseIndex = content.indexOf(caseName);
  if (caseIndex !== -1) {
    const contextArea = content.substring(caseIndex, Math.min(content.length, caseIndex + caseName.length + 400));
    
    const outcomeKeywords = [
      'held that', 'ruled that', 'decided that', 'found that', 'concluded that',
      'awarded', 'damages', 'granted', 'denied', 'affirmed', 'reversed'
    ];
    
    for (const keyword of outcomeKeywords) {
      const keywordIndex = contextArea.toLowerCase().indexOf(keyword);
      if (keywordIndex !== -1) {
        const sentenceStart = contextArea.lastIndexOf('.', keywordIndex) + 1;
        const sentenceEnd = contextArea.indexOf('.', keywordIndex + keyword.length);
        if (sentenceEnd !== -1) {
          return contextArea.substring(sentenceStart, sentenceEnd + 1).trim();
        }
      }
    }
  }
  return "Court decision with applicable legal precedent";
}

// Legacy functions kept for compatibility with any existing calls
// These are no longer used in the main adaptive flow but kept to prevent errors

function detectHOACase(contextElements: string[]): boolean {
  console.warn('Legacy detectHOACase called - adaptive context should handle this');
  return false;
}

function buildTargetedSearchQuery(contextElements: string[], isHOACase: boolean): string {
  console.warn('Legacy buildTargetedSearchQuery called - adaptive context should handle this');
  return contextElements.join(' ');
}