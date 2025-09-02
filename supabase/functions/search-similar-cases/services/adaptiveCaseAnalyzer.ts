
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface CaseAnalysisResult {
  primaryLegalArea: string;
  legalConcepts: string[];
  relevantStatutes: string[];
  keyFactors: string[];
  searchTerms: string[];
  confidence: number;
}

export async function analyzeCase(clientId: string): Promise<CaseAnalysisResult> {
  try {
    console.log(`=== ADAPTIVE CASE ANALYSIS START for client ${clientId} ===`);
    
    // Get case content from multiple sources
    const caseContent = await extractCaseContent(clientId);
    
    if (!caseContent || caseContent.trim().length < 100) {
      console.log("Insufficient case content for analysis, using generic approach");
      return {
        primaryLegalArea: "general-legal-matter",
        legalConcepts: ["liability", "damages", "negligence"],
        relevantStatutes: [],
        keyFactors: ["legal dispute", "potential damages"],
        searchTerms: ["Texas law", "legal liability", "damages"],
        confidence: 0.3
      };
    }

    // Use AI to analyze the case content
    const analysisResult = await performAIAnalysis(caseContent);
    console.log(`AI Analysis completed with confidence: ${analysisResult.confidence}`);
    
    return analysisResult;
  } catch (error) {
    console.error("Error in adaptive case analysis:", error);
    return {
      primaryLegalArea: "general-legal-matter",
      legalConcepts: ["legal dispute"],
      relevantStatutes: [],
      keyFactors: ["dispute resolution"],
      searchTerms: ["Texas law", "legal case"],
      confidence: 0.2
    };
  }
}

async function extractCaseContent(clientId: string): Promise<string> {
  const contentSources: string[] = [];
  
  // Get legal analysis content
  const { data: analyses } = await supabase
    .from('legal_analyses')
    .select('content')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (analyses && analyses.length > 0) {
    contentSources.push(analyses[0].content);
    console.log(`Added legal analysis content (${analyses[0].content.length} chars)`);
  }
  
  // Get recent client messages
  const { data: messages } = await supabase
    .from('client_messages')
    .select('content, role')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (messages && messages.length > 0) {
    const messageContent = messages
      .filter(msg => msg.content && msg.content.length > 20)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    contentSources.push(messageContent);
    console.log(`Added message content (${messageContent.length} chars)`);
  }
  
  // Get case information
  const { data: cases } = await supabase
    .from('cases')
    .select('case_title, case_description, case_notes, case_type')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (cases && cases.length > 0) {
    const caseInfo = [
      cases[0].case_title,
      cases[0].case_description,
      cases[0].case_notes,
      cases[0].case_type
    ].filter(Boolean).join(' ');
    
    if (caseInfo.trim()) {
      contentSources.push(caseInfo);
      console.log(`Added case info (${caseInfo.length} chars)`);
    }
  }
  
  const combinedContent = contentSources.join('\n\n');
  console.log(`Total extracted content: ${combinedContent.length} characters`);
  
  return combinedContent;
}

async function performAIAnalysis(content: string): Promise<CaseAnalysisResult> {
  if (!openAIApiKey) {
    console.error("OpenAI API key not available");
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `Analyze this legal case content and extract the key information for finding similar cases. Focus on identifying the primary legal area, relevant statutes, and important concepts.

Case Content:
${content.substring(0, 4000)}

Please respond with a JSON object containing:
{
  "primaryLegalArea": "primary area of law (e.g., lemon-law, property-law, personal-injury, consumer-protection, contract-law, criminal-law, employment-law, family-law, etc.)",
  "legalConcepts": ["array of 3-5 key legal concepts"],
  "relevantStatutes": ["array of specific statutes mentioned or applicable"],
  "keyFactors": ["array of 3-5 important factual elements"],
  "searchTerms": ["array of 5-8 specific search terms for finding similar cases"],
  "confidence": 0.8
}

Guidelines:
- CRITICAL: If this involves vehicles, cars, trucks, automotive warranties, lemon law, manufacturer defects, repair attempts, or motor vehicles, use "lemon-law" as primaryLegalArea
- Use property-law for HOA cases, real estate disputes
- Use consumer-protection for general DTPA cases that don't involve vehicles
- Extract actual statute numbers when mentioned (especially Texas Occupations Code 2301 for lemon law)
- Focus on legal concepts that would help find similar cases
- Generate search terms that combine legal concepts with factual elements
- For lemon law cases, include terms like "Texas Lemon Law", "motor vehicle warranty", "automotive defects", "reasonable repair attempts"
- Set confidence based on clarity and specificity of the content
- For Texas cases, include "Texas" in search terms
- If unclear, use broader legal categories

Respond only with valid JSON. Do not include markdown code fences or any extra text; return a single minified JSON object.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a legal analysis expert. Analyze case content and return structured JSON data.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content;

    if (!analysisText) {
      throw new Error("No analysis received from OpenAI");
    }

    // Parse the JSON response robustly (strip code fences, extract JSON object)
    let jsonText = analysisText.trim()
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .trim();

    if (!(jsonText.trim().startsWith('{') && jsonText.trim().endsWith('}'))) {
      const start = jsonText.indexOf('{');
      const end = jsonText.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        jsonText = jsonText.slice(start, end + 1);
      }
    }

    let analysisResult: any;
    try {
      analysisResult = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse analysis JSON. Raw start:', analysisText.substring(0, 200));
      throw e;
    }
    
    // Validate and clean the result
    const cleanResult: CaseAnalysisResult = {
      primaryLegalArea: analysisResult.primaryLegalArea || "general-legal-matter",
      legalConcepts: Array.isArray(analysisResult.legalConcepts) ? analysisResult.legalConcepts.slice(0, 5) : [],
      relevantStatutes: Array.isArray(analysisResult.relevantStatutes) ? analysisResult.relevantStatutes.slice(0, 5) : [],
      keyFactors: Array.isArray(analysisResult.keyFactors) ? analysisResult.keyFactors.slice(0, 5) : [],
      searchTerms: Array.isArray(analysisResult.searchTerms) ? analysisResult.searchTerms.slice(0, 8) : [],
      confidence: Math.min(Math.max(analysisResult.confidence || 0.5, 0.1), 1.0)
    };

    console.log(`AI Analysis Result:`, cleanResult);
    return cleanResult;

  } catch (error) {
    console.error("Error in AI analysis:", error);
    throw error;
  }
}

export function generateAdaptiveSearchTerms(analysisResult: CaseAnalysisResult): string {
  const searchTerms: string[] = [];
  
  // Start with Texas for jurisdiction
  searchTerms.push("Texas");
  
  // Add primary legal area (simplified)
  if (analysisResult.primaryLegalArea && analysisResult.primaryLegalArea !== "general-legal-matter") {
    const areaTerms = analysisResult.primaryLegalArea.replace(/-/g, ' ');
    searchTerms.push(areaTerms);
  }
  
  // Add 1-2 key legal concepts (no quotes, natural language)
  const topConcepts = analysisResult.legalConcepts.slice(0, 2);
  topConcepts.forEach(concept => {
    if (concept.trim()) {
      // Simplify concept names for better search
      const simplifiedConcept = concept
        .replace(/Texas\s+/gi, '')
        .replace(/\s+Law$/gi, ' law')
        .replace(/Act\s*\([^)]+\)/gi, '')
        .trim();
      if (simplifiedConcept) {
        searchTerms.push(simplifiedConcept);
      }
    }
  });
  
  // Add "cases" at the end
  searchTerms.push("cases");
  
  const finalTerms = searchTerms.join(' ');
  console.log(`Generated simplified search terms: ${finalTerms}`);
  
  return finalTerms;
}
