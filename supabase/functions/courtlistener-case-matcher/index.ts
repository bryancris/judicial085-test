import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CourtListenerSearchResult {
  id: number;
  absolute_url: string;
  caseName: string;
  caseNameShort: string;
  court: string;
  court_id: string;
  dateFiled: string;
  citation: string[];
  snippet: string;
  status: string;
  docket_id: number;
  cluster_id: number;
  judge: string;
  citeCount: number;
}

interface MatchResult {
  case: CourtListenerSearchResult;
  confidence: number;
  reasoning: string;
}

interface CaseMatcherResponse {
  success: boolean;
  bestMatch?: MatchResult;
  allMatches?: MatchResult[];
  error?: string;
}

const TEXAS_COURTS = [
  "tex", "texcrimapp", "texapp1st", "texapp2nd", "texapp3rd", "texapp4th",
  "texapp5th", "texapp6th", "texapp7th", "texapp8th", "texapp9th", "texapp10th",
  "texapp11th", "texapp12th", "texapp13th", "texapp14th"
];

async function searchCourtListener(caseName: string, apiKey: string): Promise<CourtListenerSearchResult[]> {
  const courtQuery = TEXAS_COURTS.map(court => `court_id:${court}`).join(" OR ");
  const query = `(${courtQuery}) AND caseName:"${caseName}"`;
  
  const url = new URL("https://www.courtlistener.com/api/rest/v4/search/");
  url.searchParams.append("q", query);
  url.searchParams.append("type", "o");
  url.searchParams.append("order_by", "score desc");
  url.searchParams.append("page_size", "10");

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`CourtListener API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}

async function matchCaseWithAI(
  caseName: string,
  aiSummary: string,
  courtListenerResults: CourtListenerSearchResult[],
  openaiKey: string
): Promise<MatchResult[]> {
  const matches: MatchResult[] = [];

  for (const result of courtListenerResults) {
    const prompt = `
You are a legal case matching expert. Compare the following case information and determine if they refer to the same legal case.

CASE TO MATCH:
Name: ${caseName}
AI Summary: ${aiSummary}

POTENTIAL MATCH FROM COURTLISTENER:
Name: ${result.caseName}
Court: ${result.court}
Date Filed: ${result.dateFiled}
Status: ${result.status}
Judge: ${result.judge}
Snippet: ${result.snippet}

Compare these cases based on:
1. Case name similarity (accounting for different formatting)
2. Court and jurisdiction
3. Legal issues and facts described
4. Dates and timeline consistency
5. Overall legal context

Respond with a JSON object containing:
{
  "confidence": [0-100 integer score],
  "reasoning": "[brief explanation of why this is/isn't a match]"
}

A confidence score of:
- 85-100: Very likely the same case
- 70-84: Probably the same case
- 50-69: Possibly related but uncertain
- Below 50: Unlikely to be the same case
`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        console.error(`OpenAI API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        const matchData = JSON.parse(content);
        matches.push({
          case: result,
          confidence: matchData.confidence,
          reasoning: matchData.reasoning
        });
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        // Fallback: basic name similarity
        const similarity = calculateNameSimilarity(caseName, result.caseName);
        matches.push({
          case: result,
          confidence: similarity * 100,
          reasoning: "AI parsing failed, using name similarity"
        });
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      // Fallback: basic name similarity
      const similarity = calculateNameSimilarity(caseName, result.caseName);
      matches.push({
        case: result,
        confidence: similarity * 100,
        reasoning: "AI unavailable, using name similarity"
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  
  if (n1 === n2) return 1.0;
  
  const words1 = n1.split(/\s+/);
  const words2 = n2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  
  return commonWords.length / Math.max(words1.length, words2.length);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { caseName, aiSummary } = await req.json();
    
    if (!caseName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Case name is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const courtListenerKey = Deno.env.get('COURTLISTENER_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!courtListenerKey) {
      throw new Error('COURTLISTENER_API_KEY not configured');
    }

    // Search CourtListener
    const searchResults = await searchCourtListener(caseName, courtListenerKey);
    
    if (searchResults.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No cases found in CourtListener'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let matches: MatchResult[] = [];

    // Use AI matching if both API key and summary are available
    if (openaiKey && aiSummary) {
      matches = await matchCaseWithAI(caseName, aiSummary, searchResults, openaiKey);
    } else {
      // Fallback to name similarity
      matches = searchResults.map(result => ({
        case: result,
        confidence: calculateNameSimilarity(caseName, result.caseName) * 100,
        reasoning: "Name similarity only (AI matching unavailable)"
      })).sort((a, b) => b.confidence - a.confidence);
    }

    const bestMatch = matches[0];
    const response: CaseMatcherResponse = {
      success: true,
      bestMatch,
      allMatches: matches
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Case matcher error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});