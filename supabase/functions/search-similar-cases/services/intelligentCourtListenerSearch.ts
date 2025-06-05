
import { LegalCaseAgent, AgentAnalysis } from "./legalCaseAgent.ts";

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
  
  try {
    console.log("🤖 USING AI AGENT-POWERED SEARCH");
    
    // Step 1: Analyze the case with AI agent
    console.log("Step 1: Analyzing case with AI agent...");
    const agent = new LegalCaseAgent(openaiApiKey);
    const agentAnalysis = await agent.analyzeCaseForSimilarity(analysisContent, caseType);
    
    console.log(`Agent analysis complete: { legalConcepts: ${agentAnalysis.legalConcepts.length}, keyFacts: ${agentAnalysis.keyFacts.length}, searchQueries: ${agentAnalysis.searchQueries.length} }`);
    
    // Step 2: Use agent's search queries to search CourtListener V4
    console.log("Step 2: Searching CourtListener with agent queries...");
    console.log(`Agent provided ${agentAnalysis.searchQueries.length} search queries`);
    
    const allResults: any[] = [];
    const searchQueries: string[] = [];
    
    for (let i = 0; i < agentAnalysis.searchQueries.length; i++) {
      const query = agentAnalysis.searchQueries[i];
      
      // Skip invalid queries
      if (!query || query.trim().length < 3 || query.includes("**")) {
        console.log(`⚠️ Skipping invalid query: "${query}"`);
        continue;
      }
      
      console.log(`Executing search query ${i + 1}: ${query}`);
      
      try {
        const queryResults = await searchCourtListenerV4(query, courtListenerApiKey);
        console.log(`Query ${i + 1} returned ${queryResults.length} results`);
        
        allResults.push(...queryResults);
        searchQueries.push(query);
        
        // Add delay between requests to avoid rate limiting
        if (i < agentAnalysis.searchQueries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
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

async function searchCourtListenerV4(query: string, apiKey: string): Promise<any[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    // FIXED: Using V4 API instead of V3
    const url = `https://www.courtlistener.com/api/rest/v4/search/?q=${encodedQuery}&type=o&stat_Precedential=on&court=tex,texapp,texcrimapp,texjpml&page_size=10`;
    
    console.log(`🔍 Searching CourtListener V4: ${query}`);
    console.log(`📍 URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'User-Agent': 'LegalAnalysis/1.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CourtListener API error: ${response.status} - ${errorText}`);
      return [];
    }
    
    const data = await response.json();
    console.log(`✅ CourtListener returned ${data.results?.length || 0} results for query: ${query}`);
    
    // Process V4 API response format
    const processedResults = (data.results || []).map((result: any) => ({
      id: result.id,
      caseName: result.case_name || result.caseName || "Unknown Case",
      case_name: result.case_name || result.caseName || "Unknown Case",
      court: result.court || "Unknown Court",
      court_name: result.court || "Unknown Court", 
      citation: result.citation?.[0] || "No citation",
      dateFiled: result.date_filed || result.dateFiled,
      date_filed: result.date_filed || result.dateFiled,
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
