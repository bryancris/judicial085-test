
import { LegalCaseAgent, AgentAnalysis } from "./legalCaseAgent.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

export interface CourtListenerSearchResult {
  results: any[];
  searchQueries: string[];
  agentAnalysis?: AgentAnalysis;
}

export async function intelligentCourtListenerSearch(
  analysisContent: string,
  caseType: string,
  openaiApiKey: string,
  courtListenerApiKey: string
): Promise<CourtListenerSearchResult> {
  console.log("=== INTELLIGENT COURTLISTENER SEARCH START ===");
  
  // Initialize Supabase client for cache access
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  try {
    console.log("🤖 USING AI AGENT-POWERED SEARCH WITH GLOBAL CACHE");
    
    // Step 1: Analyze the case with AI agent
    console.log("Step 1: Analyzing case with AI agent...");
    const agent = new LegalCaseAgent(openaiApiKey);
    const agentAnalysis = await agent.analyzeCaseForSimilarity(analysisContent, caseType);
    
    console.log(`Agent analysis complete: { legalConcepts: ${agentAnalysis.legalConcepts.length}, keyFacts: ${agentAnalysis.keyFacts.length}, searchQueries: ${agentAnalysis.searchQueries.length} }`);
    
    // Step 2: Enhanced search with cache integration
    console.log("Step 2: Searching with cache-first strategy...");
    
    const allResults: any[] = [];
    const searchQueries: string[] = [];
    const cachedResults: any[] = [];
    
    // Enhanced search strategy with broader terms
    const enhancedQueries = generateEnhancedSearchQueries(agentAnalysis, caseType);
    console.log(`Generated ${enhancedQueries.length} enhanced search queries:`, enhancedQueries);
    
    for (let i = 0; i < enhancedQueries.length; i++) {
      const query = enhancedQueries[i];
      
      // Skip invalid queries
      if (!query || query.trim().length < 3 || query.includes("**")) {
        console.log(`⚠️ Skipping invalid query: "${query}"`);
        continue;
      }
      
      console.log(`Executing search query ${i + 1}: ${query}`);
      
      try {
        // First check cache
        const cacheResults = await checkGlobalCache(supabase, query);
        
        if (cacheResults.length > 0) {
          console.log(`📦 Cache hit for query "${query}": ${cacheResults.length} cases`);
          cachedResults.push(...cacheResults);
          allResults.push(...cacheResults);
          searchQueries.push(query);
        } else {
          // Cache miss - search CourtListener API
          console.log(`🌐 Cache miss - searching CourtListener API for: ${query}`);
          const queryResults = await searchCourtListenerV4WithCache(supabase, query, courtListenerApiKey);
          console.log(`Query ${i + 1} returned ${queryResults.length} results`);
          
          allResults.push(...queryResults);
          searchQueries.push(query);
        }
        
        // Stop if we found enough results
        if (allResults.length >= 10) {
          console.log(`Found sufficient results (${allResults.length}), stopping search`);
          break;
        }
        
        // Add delay between requests to avoid rate limiting (only for API calls)
        if (cachedResults.length === 0 && i < enhancedQueries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error executing query ${i + 1}:`, error);
        continue;
      }
    }
    
    // Remove duplicates based on opinion ID or case name
    const uniqueResults = deduplicateResults(allResults);
    console.log(`After deduplication: ${uniqueResults.length} unique results`);
    
    // Step 3: Score and filter results using the agent
    let validatedCases: any[] = [];
    
    if (uniqueResults.length > 0) {
      console.log("Step 3: Scoring cases with AI agent...");
      
      try {
        const scoredCases = await agent.scoreCaseRelevance(analysisContent, uniqueResults);
        
        // Filter cases with score >= 30 (lowered threshold)
        validatedCases = scoredCases
          .filter(scored => scored.relevanceScore >= 30)
          .map(scored => ({
            ...scored.case,
            similarity: scored.relevanceScore,
            agentReasoning: scored.reasoning
          }));
        
        console.log(`Found ${validatedCases.length} cases with relevance score >= 30`);
      } catch (error) {
        console.error("Error in AI scoring, using all results:", error);
        // Fallback: use all results with default scoring
        validatedCases = uniqueResults.map(result => ({
          ...result,
          similarity: 50,
          agentReasoning: "Default score - AI scoring failed"
        }));
      }
    }
    
    // Clean up the agent
    await agent.cleanup();
    
    console.log(`Found ${validatedCases.length} validated cases from CourtListener`);
    
    return {
      results: validatedCases,
      searchQueries: searchQueries,
      agentAnalysis: agentAnalysis
    };
    
  } catch (error) {
    console.error("Error in intelligent CourtListener search:", error);
    return {
      results: [],
      searchQueries: [],
      agentAnalysis: undefined
    };
  }
}

// Enhanced search query generation
function generateEnhancedSearchQueries(agentAnalysis: AgentAnalysis, caseType: string): string[] {
  const queries: string[] = [];
  
  // Start with agent's queries
  queries.push(...agentAnalysis.searchQueries);
  
  // Add broader case-type specific queries
  if (caseType.includes("premises") || caseType.includes("liability")) {
    queries.push(
      "premises liability Texas",
      "slip and fall Texas store",
      "negligence dangerous condition",
      "invitee business premises",
      "actual constructive knowledge",
      "Wal-Mart premises liability"
    );
  } else if (caseType.includes("contract") || caseType.includes("construction") || caseType.includes("warranty")) {
    queries.push(
      "breach of contract express warranty Texas",
      "construction contract material substitution",
      "home renovation contractor breach",
      "express warranty construction materials",
      "Texas Business Commerce Code warranty",
      "material specification breach contract",
      "contractor warranty violation Texas",
      "UCC express warranty breach"
    );
  }
  
  // Add common legal terms that appear in court opinions
  if (agentAnalysis.keyFacts.some(fact => fact.includes("slip") || fact.includes("fall"))) {
    queries.push(
      "slip fall retail store",
      "spilled substance floor",
      "unsafe condition premises"
    );
  }
  
  // Add construction/contract specific terms
  if (agentAnalysis.keyFacts.some(fact => 
    fact.includes("construction") || fact.includes("renovation") || 
    fact.includes("contractor") || fact.includes("material") ||
    fact.includes("specification") || fact.includes("warranty"))) {
    queries.push(
      "construction contract breach Texas",
      "home renovation material defect",
      "contractor warranty breach",
      "building contract specification"
    );
  }
  
  // Add statute-based searches
  if (agentAnalysis.relevantStatutes.length > 0) {
    agentAnalysis.relevantStatutes.forEach(statute => {
      queries.push(`"${statute}"`);
    });
  }
  
  // Remove duplicates and return
  return [...new Set(queries)].slice(0, 8); // Limit to 8 queries
}

async function searchCourtListenerV4(query: string, apiKey: string): Promise<any[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    // Enhanced V4 API with better parameters
    const url = `https://www.courtlistener.com/api/rest/v4/search/?q=${encodedQuery}&type=o&stat_Precedential=on&court=tex,texapp,texcrimapp,texjpml,tex.bankr&order_by=score%20desc&page_size=20`;
    
    console.log(`🔍 Searching CourtListener V4: ${query}`);
    console.log(`📍 URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'User-Agent': 'LegalAnalysis/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CourtListener API error: ${response.status} - ${errorText}`);
      
      // Log detailed error for debugging
      if (response.status === 403) {
        console.error("❌ 403 Forbidden - Check API key and permissions");
      } else if (response.status === 429) {
        console.error("❌ 429 Rate Limited - Too many requests");
      }
      
      return [];
    }
    
    const data = await response.json();
    console.log(`✅ CourtListener returned ${data.results?.length || 0} results for query: ${query}`);
    
    // Enhanced V4 API response processing
    const processedResults = (data.results || []).map((result: any) => ({
      id: result.id,
      caseName: result.caseName || result.case_name || "Unknown Case",
      case_name: result.caseName || result.case_name || "Unknown Case",
      court: result.court || result.court_id || "Unknown Court",
      court_name: result.court || result.court_id || "Unknown Court", 
      citation: Array.isArray(result.citation) ? result.citation[0] : result.citation || "No citation",
      dateFiled: result.dateFiled || result.date_filed,
      date_filed: result.dateFiled || result.date_filed,
      absolute_url: result.absolute_url || result.absolute_uri,
      snippet: result.snippet || result.text || "No summary available",
      text: result.snippet || result.text || "No summary available"
    }));
    
    return processedResults;
  } catch (error) {
    console.error(`Error searching CourtListener for "${query}":`, error);
    return [];
  }
}

function deduplicateResults(results: any[]): any[] {
  const seen = new Set<string>();
  const unique: any[] = [];
  
  for (const result of results) {
    // Create a unique key based on opinion ID, case name, or snippet
    const key = result.id || 
                result.caseName || 
                result.case_name ||
                result.snippet?.substring(0, 100) || 
                JSON.stringify(result).substring(0, 100);
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(result);
    }
  }
  
  return unique;
}

// Generate MD5 hash for query caching
async function generateQueryHash(query: string): Promise<string> {
  const normalizedQuery = query.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedQuery);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check global cache for search results
async function checkGlobalCache(supabase: any, query: string): Promise<any[]> {
  try {
    const queryHash = await generateQueryHash(query);
    
    // Check for valid cache entry
    const { data: cacheData, error: cacheError } = await supabase
      .from("courtlistener_search_cache")
      .select("*")
      .eq("query_hash", queryHash)
      .gt("expires_at", new Date().toISOString())
      .limit(1);

    if (cacheError || !cacheData || cacheData.length === 0) {
      return [];
    }

    const cacheEntry = cacheData[0];
    
    // Increment hit count
    await supabase
      .from("courtlistener_search_cache")
      .update({ hit_count: cacheEntry.hit_count + 1 })
      .eq("id", cacheEntry.id);

    // Fetch the actual case data
    if (!cacheEntry.result_case_ids || cacheEntry.result_case_ids.length === 0) {
      return [];
    }

    const { data: cases, error: casesError } = await supabase
      .from("courtlistener_cases")
      .select("*")
      .in("id", cacheEntry.result_case_ids);

    if (casesError) {
      console.error("Error fetching cached cases:", casesError);
      return [];
    }

    // Convert to expected format
    return (cases || []).map((case_: any) => ({
      id: case_.courtlistener_id,
      caseName: case_.case_name,
      case_name: case_.case_name,
      court: case_.court,
      court_name: case_.court_name || case_.court,
      citation: case_.citation,
      dateFiled: case_.date_filed,
      date_filed: case_.date_filed,
      absolute_url: case_.absolute_url,
      snippet: case_.snippet,
      text: case_.snippet
    }));
  } catch (error) {
    console.error("Error checking global cache:", error);
    return [];
  }
}

// Search CourtListener with cache storage
async function searchCourtListenerV4WithCache(supabase: any, query: string, apiKey: string): Promise<any[]> {
  try {
    // Perform the API search
    const results = await searchCourtListenerV4(query, apiKey);
    
    if (results.length === 0) {
      return [];
    }
    
    // Store results in global dataset
    const storedCaseIds = await storeGlobalCases(supabase, results);
    
    // Cache the search query and results
    await cacheSearchResults(supabase, query, storedCaseIds, results.length);
    
    return results;
  } catch (error) {
    console.error("Error in cached search:", error);
    return [];
  }
}

// Store cases in global dataset
async function storeGlobalCases(supabase: any, courtListenerResults: any[]): Promise<string[]> {
  const storedCaseIds: string[] = [];

  for (const result of courtListenerResults) {
    try {
      // Check if case already exists by courtlistener_id
      const { data: existingCase } = await supabase
        .from("courtlistener_cases")
        .select("id, api_fetch_count")
        .eq("courtlistener_id", result.id?.toString())
        .limit(1);

      let caseId: string;

      if (existingCase && existingCase.length > 0) {
        // Update existing case and increment fetch count
        caseId = existingCase[0].id;
        await supabase
          .from("courtlistener_cases")
          .update({ 
            api_fetch_count: (existingCase[0].api_fetch_count || 0) + 1,
            last_updated_at: new Date().toISOString()
          })
          .eq("id", caseId);
      } else {
        // Insert new case
        const caseData = {
          courtlistener_id: result.id?.toString() || `temp_${Date.now()}_${Math.random()}`,
          case_name: result.caseName || result.case_name || 'Unknown Case',
          court: result.court,
          court_name: result.court_name,
          citation: result.citation,
          date_filed: result.dateFiled || result.date_filed,
          date_decided: result.dateDecided || result.date_decided,
          absolute_url: result.absolute_url,
          snippet: result.snippet,
          full_text: result.text || result.full_text,
          jurisdiction: result.jurisdiction || 'Texas',
          case_type: result.case_type,
          precedential_status: result.precedential_status,
          api_fetch_count: 1
        };

        const { data: newCase, error: insertError } = await supabase
          .from("courtlistener_cases")
          .insert(caseData)
          .select("id")
          .single();

        if (insertError) {
          console.error("Error inserting case:", insertError);
          continue;
        }

        caseId = newCase.id;
      }

      storedCaseIds.push(caseId);
    } catch (error) {
      console.error("Error storing case:", error);
    }
  }

  return storedCaseIds;
}

// Cache search results
async function cacheSearchResults(supabase: any, query: string, caseIds: string[], totalResults: number): Promise<void> {
  try {
    const queryHash = await generateQueryHash(query);
    
    const cacheData = {
      query_hash: queryHash,
      original_query: query,
      search_parameters: {},
      result_case_ids: caseIds,
      total_results: totalResults,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      hit_count: 0
    };

    await supabase
      .from("courtlistener_search_cache")
      .insert(cacheData);

    console.log(`📦 Cached search results for query: ${query} (${caseIds.length} cases)`);
  } catch (error) {
    console.error("Error caching search results:", error);
  }
}
