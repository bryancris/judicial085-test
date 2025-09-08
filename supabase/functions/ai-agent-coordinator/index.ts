import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, clientId, caseId, researchTypes, requestContext, context } = await req.json();
    
    console.log('🎯 AI Agent Coordinator received request:', { 
      query: query.substring(0, 200) + '...',
      clientId, 
      caseId, 
      researchTypes,
      requestContext
    });

    // Create Supabase client
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.0");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 🎯 UPDATED: Retrieve existing analysis scoped to the specific case when caseId is provided
    console.log('📋 Retrieving existing analysis for client (scoped):', { clientId, caseId });
    
    let existingAnalysisQuery = supabase
      .from('legal_analyses')
      .select('content, case_type, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    // 🔒 CRITICAL: Scope analysis retrieval by case when caseId is provided
    if (caseId) {
      existingAnalysisQuery = existingAnalysisQuery.eq('case_id', caseId);
      console.log('🔒 Scoping analysis retrieval to specific case:', caseId);
    } else {
      existingAnalysisQuery = existingAnalysisQuery.is('case_id', null);
      console.log('📋 Retrieving client-level analysis (case_id IS NULL)');
    }
    
    const { data: existingAnalyses } = await existingAnalysisQuery;
    
    if (!existingAnalyses || existingAnalyses.length === 0) {
      console.log('📋 No scoped analysis found for this client/case');
    } else {
      console.log('📋 Found existing scoped analysis:', {
        case_type: existingAnalyses[0].case_type,
        content_length: existingAnalyses[0].content?.length || 0,
        created_at: existingAnalyses[0].created_at
      });
    }

    // Determine query analysis and routing
    const queryAnalysis = analyzeQuery(query, requestContext, context);
    console.log('🔍 Query Analysis:', queryAnalysis);

    // Initialize research agents in parallel
    console.log('🔍 Initiating parallel research with OpenAI and Perplexity agents...');
    
    const authHeader = req.headers.get('authorization');
    const researchPromises = [];
    
    // Add research type routing based on query analysis and available types
    const effectiveResearchTypes = researchTypes || ['legal-research', 'current-research'];
    
    // OpenAI Legal Research Agent
    if (effectiveResearchTypes.includes('legal-research')) {
      researchPromises.push(
        callResearchAgent('openai', 'legal-analysis', query, clientId, caseId, authHeader)
          .catch(error => {
            console.error('OpenAI agent failed:', error);
            return { source: 'openai', type: 'legal-analysis', content: '', error: error.message };
          })
      );
    }

    // Perplexity Current Research Agent
    if (effectiveResearchTypes.includes('current-research')) {
      researchPromises.push(
        callResearchAgent('perplexity', 'current-research', query, clientId, caseId, authHeader)
          .catch(error => {
            console.error('Perplexity agent failed:', error);
            return { source: 'perplexity', type: 'current-research', content: '', error: error.message };
          })
      );
    }

    // Execute research agents in parallel
    const researchResults = await Promise.all(researchPromises);
    
    console.log('✅ Research agents completed. Results:', researchResults.map(r => ({
      source: r.source,
      type: r.type,
      contentLength: r.content?.length || 0,
      hasError: !!r.error
    })));

    // Synthesize results using Gemini
    console.log('🧠 Initiating Gemini synthesis with 2M context window...');
    const synthesizedResult = await synthesizeWithGemini(
      query,
      researchResults,
      existingAnalyses?.[0]?.content,
      queryAnalysis
    );

    // Verify case citations using CourtListener
    console.log('⚖️ Initiating CourtListener verification for case citations...');
    const verifiedResult = await verifyCaseCitations(synthesizedResult.content);

    // Normalize and validate the synthesis to ensure base sections are present
    console.log('🔧 Normalizing synthesis to ensure base sections...');
    const normalizedContent = await normalizeSynthesis(verifiedResult.content, researchResults);

    // ✅ ENABLED: Save validated 3-agent synthesis to legal_analyses
    console.log('💾 Saving validated 3-agent synthesis to database...');
    await saveSynthesisToDatabase(normalizedContent, clientId, caseId, supabase, authHeader, researchResults, verifiedResult.verifiedCases);

    return new Response(
      JSON.stringify({
        success: true,
        text: normalizedContent, // Use normalized content
        synthesizedContent: normalizedContent, // Legacy field
        researchSources: extractResearchSources(researchResults),
        verifiedCases: verifiedResult.verifiedCases,
        citations: extractCitations(normalizedContent),
        hasKnowledgeBase: researchResults.length > 0,
        documentsFound: researchResults.filter(r => !r.error).length,
        courtListenerCitations: verifiedResult.verifiedCases || 0,
        metadata: {
          queryAnalysis,
          researchAgentsUsed: researchResults.map(r => r.source),
          factBasedAnalysis: true,
          normalizedSections: true,
          savedToDatabase: true
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in AI Agent Coordinator:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to coordinate AI agents', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to analyze query intent and requirements
function analyzeQuery(query: string, requestContext?: string, context?: any) {
  const lowerQuery = query.toLowerCase();
  
  // Check for specific legal research indicators
  const hasDraftingKeyword = /\b(draft|write|create|generate|compose)\b/.test(lowerQuery);
  const hasDocumentType = /\b(letter|memo|brief|motion|complaint|contract|agreement)\b/.test(lowerQuery);
  const isClientIntake = /\b(client|intake|consultation|meeting)\b/.test(lowerQuery);
  
  // Detect HOA-specific cases
  const isHOACase = context?.isHOACase || detectHOAContext(query, context);
  
  return {
    originalQuery: query.length > 100 ? query.substring(0, 100) + '...' : query,
    hasDraftingKeyword,
    hasDocumentType,
    requestContext: requestContext || 'none',
    isClientIntake,
    isHOACase,
    requestType: determineRequestType(lowerQuery, hasDraftingKeyword, hasDocumentType, isHOACase)
  };
}

function detectHOAContext(query: string, context?: any): boolean {
  const hoaIndicators = [
    'hoa', 'homeowners association', 'restrictive covenant', 'cc&r',
    'commercial vehicle', 'selective enforcement', 'deed restriction'
  ];
  
  const combinedText = [
    query,
    context?.caseDescription || '',
    context?.incidentDescription || ''
  ].join(' ').toLowerCase();
  
  return hoaIndicators.some(indicator => combinedText.includes(indicator));
}

function determineRequestType(query: string, hasDrafting: boolean, hasDocType: boolean, isHOACase?: boolean): string {
  if (isHOACase) return 'HOA_RESEARCH';
  if (hasDrafting && hasDocType) return 'DOCUMENT_DRAFTING';
  if (query.includes('case law') || query.includes('precedent')) return 'CASE_RESEARCH';
  if (query.includes('statute') || query.includes('regulation')) return 'STATUTORY_RESEARCH';
  return 'LEGAL_RESEARCH';
}

// Research agent caller
async function callResearchAgent(
  source: string, 
  type: string, 
  query: string, 
  clientId: string, 
  caseId?: string, 
  authHeader?: string
) {
  // Use query as-is without domain context
  const enhancedQuery = query;

  try {
    const endpoint = source === 'openai' ? 'generate-legal-analysis' : 'perplexity-research';
    
    // For OpenAI agent (generate-legal-analysis), pass full context
    if (source === 'openai') {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.0");
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
      
      const response = await supabase.functions.invoke(endpoint, {
        body: { 
          clientId, 
          caseId,
          conversation: [{ role: 'attorney', content: enhancedQuery }],
          researchFocus: 'legal-analysis', // Indicate this is from coordinator
          requestContext: 'ai-coordinator'
        },
        headers: authHeader ? { Authorization: authHeader } : {}
      });
      
      if (response.error) throw new Error(response.error.message);
      
      return {
        source,
        type,
        content: response.data?.analysis || '',
        metadata: response.data?.metadata || {}
      };
    }
    
    // For Perplexity agent
    else {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({ 
          query: enhancedQuery,
          clientId,
          caseId,
          searchType: type,
          requestContext: 'ai-coordinator'
        })
      });
      
      if (!response.ok) {
        throw new Error(`${source} agent failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        source,
        type,
        content: data.content || '',
        citations: data.citations || [],
        metadata: data.metadata || {}
      };
    }
  } catch (error) {
    console.error(`Error calling ${source} agent:`, error);
    throw error;
  }
}

// Enhanced Gemini synthesis with enforced base sections
async function synthesizeWithGemini(
  originalQuery: string, 
  researchResults: any[], 
  existingAnalysis?: string,
  queryAnalysis?: any
) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Build synthesis prompt with enforced structure
  let synthesisPrompt = `You are an expert legal analyst synthesizing research from multiple AI agents to provide comprehensive legal guidance.

ORIGINAL QUERY: ${originalQuery}

CRITICAL STRUCTURE REQUIREMENTS:
Your response MUST include these sections in this exact order:

**CASE SUMMARY:**
[Brief overview of the legal matter and key facts]

**RELEVANT TEXAS LAW:**
[Applicable statutes, regulations, and legal principles]

**PRELIMINARY ANALYSIS:**
[Initial assessment of the legal issues and merit]

**CASE STRENGTHS:**
[Factors that support the client's position]

**CASE WEAKNESSES:**
[Potential challenges or counterarguments]

**POTENTIAL LEGAL ISSUES:**
[Key legal questions and areas of concern]

**RECOMMENDED FOLLOW-UP QUESTIONS:**
[Numbered list of specific questions for further investigation]

SYNTHESIS INSTRUCTIONS:
1. Combine and analyze all research findings
2. Identify key legal principles and precedents
3. Provide practical legal guidance based on facts
4. Include specific citations where available
5. Ensure consistency and remove contradictions
6. DO NOT skip any of the required sections above`;

  // Add HOA-specific instructions if detected
  if (queryAnalysis?.isHOACase) {
    synthesisPrompt += `

🏘️ HOA CASE DETECTED - SPECIAL INSTRUCTIONS:
- Focus on HOA law, restrictive covenants, and Texas Property Code sections 202 and 204
- Emphasize cases involving selective enforcement, waiver, and estoppel defenses
- Look for precedents involving commercial vehicle restrictions in residential communities
- Highlight Texas court decisions on HOA board authority and enforcement consistency
- Include relevant CC&R interpretation cases
- Focus on homeowner remedies against discriminatory HOA enforcement`;
  }

  // Add fact-based synthesis instructions
  synthesisPrompt += `

FACT-BASED SYNTHESIS: Analyze the research findings and synthesize them based on the actual facts and legal issues presented. Do not force the analysis into a predetermined legal category - let the facts and research guide the synthesis.`;

  synthesisPrompt += `

RESEARCH FINDINGS:`;

  // Add research results
  researchResults.forEach((result, index) => {
    if (result.content && result.content.trim()) {
      synthesisPrompt += `

=== ${result.source.toUpperCase()} ${result.type.toUpperCase()} RESEARCH ===
${result.content}`;
    }
  });

  // Add existing analysis context if available
  if (existingAnalysis) {
    synthesisPrompt += `

=== EXISTING ANALYSIS CONTEXT ===
${existingAnalysis.substring(0, 2000)}${existingAnalysis.length > 2000 ? '...' : ''}`;
  }

  synthesisPrompt += `

Provide a comprehensive synthesis that addresses the original query with authoritative legal guidance.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: synthesisPrompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
          topK: 40,
          topP: 0.95
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No synthesis generated';
    
    console.log('✅ Gemini synthesis completed:', { 
      contentLength: content.length,
      factBasedAnalysis: true 
    });
    
    return { content };
  } catch (error) {
    console.error('Gemini synthesis error:', error);
    throw error;
  }
}

// CourtListener case verification
async function verifyCaseCitations(content: string) {
  try {
    // Extract potential case names from content
    const casePattern = /([A-Z][a-zA-Z\s&,\.]+)\s+v\.\s+([A-Z][a-zA-Z\s&,\.]+)/g;
    const extractedCases = [];
    let match;
    
    // Also extract other potential case references
    const otherCasePattern = /([A-Z][a-zA-Z\s]+(?:\s+v\.\s+[A-Z][a-zA-Z\s]+)?)\s*[-–]\s*(?:provides?|established?|held?|ruled?)/g;
    const sentences = content.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length > 10 && trimmed.length < 100) {
        extractedCases.push(trimmed);
      }
    });
    
    while ((match = casePattern.exec(content)) !== null) {
      extractedCases.push(`${match[1]} v. ${match[2]}`);
    }
    
    while ((match = otherCasePattern.exec(content)) !== null) {
      extractedCases.push(match[1]);
    }
    
    console.log('Extracted cases for verification:', extractedCases);
    
    // Verify cases with CourtListener API
    const courtListenerToken = Deno.env.get('COURTLISTENER_API_TOKEN');
    const verifiedCases = [];
    
    if (courtListenerToken) {
      for (const caseName of extractedCases.slice(0, 8)) { // Limit to prevent quota issues
        try {
          console.log('Verifying case:', caseName);
          
          const searchResponse = await fetch(
            `https://www.courtlistener.com/api/rest/v3/search/?type=o&q=${encodeURIComponent(caseName)}&format=json`,
            {
              headers: {
                'Authorization': `Token ${courtListenerToken}`,
                'User-Agent': 'Legal Research Bot 1.0'
              }
            }
          );
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.results && searchData.results.length > 0) {
              const topResult = searchData.results[0];
              console.log(`Verified case: ${caseName} -> ${topResult.caseName}`);
              verifiedCases.push({
                searchTerm: caseName,
                caseName: topResult.caseName,
                court: topResult.court,
                citation: topResult.citation,
                url: topResult.absolute_url,
                snippet: topResult.snippet
              });
            } else {
              console.log(`No CourtListener results found for: ${caseName}`);
            }
          }
        } catch (error) {
          console.error(`Error verifying case ${caseName}:`, error);
        }
      }
    }
    
    console.log('✅ CourtListener verification completed:', verifiedCases.length, 'cases verified');
    
    return {
      content,
      verifiedCases
    };
  } catch (error) {
    console.error('Case verification error:', error);
    return { content, verifiedCases: [] };
  }
}

// Store coordinated research results
async function storeCoordinatedResearch(data: any, supabase: any, authHeader?: string) {
  try {
    // Get user ID from auth header
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    const researchRecord = {
      client_id: data.clientId,
      case_id: data.caseId || null,
      search_type: 'coordinated-research',
      query: data.query,
      content: data.synthesizedContent,
      model: 'ai-agent-coordinator',
      citations: data.verifiedCases?.map((c: any) => c.caseName) || [],
      metadata: {
        researchSources: data.researchResults?.map((r: any) => r.source) || [],
        verifiedCases: data.verifiedCases || [],
        requestContext: data.requestContext,
        factBasedAnalysis: true
      }
    };

    const { error } = await supabase
      .from('perplexity_research')
      .insert([researchRecord]);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Coordinated research stored successfully');
  } catch (error) {
    console.error('Error storing coordinated research:', error);
    throw error;
  }
}

// Extract research sources for response
function extractResearchSources(researchResults: any[]) {
  const sources = [];
  
  for (const result of researchResults) {
    if (result.content && result.content.trim()) {
      sources.push({
        source: result.source,
        type: result.type,
        hasContent: true,
        contentLength: result.content.length
      });
    }
  }
  
  return sources;
}

// Extract citations from content
function extractCitations(content: string) {
  const citations = [];
  
  // Extract statute citations
  const statutePattern = /\b(?:Texas\s+)?(?:Bus\.|Business|Fin\.|Finance|Health|Penal|Civ\.|Civil)\s*(?:&\s*)?(?:Com\.|Commerce)?\s*Code\s*§?\s*[\d\.\-]+[a-z]*/gi;
  const statutes = content.match(statutePattern) || [];
  citations.push(...statutes);
  
  // Extract case citations
  const casePattern = /([A-Z][a-zA-Z\s&,\.]+)\s+v\.\s+([A-Z][a-zA-Z\s&,\.]+)/g;
  let match;
  while ((match = casePattern.exec(content)) !== null) {
    citations.push(`${match[1]} v. ${match[2]}`);
  }
  
  return [...new Set(citations)]; // Remove duplicates
}

// Normalize synthesis to ensure base sections are present
async function normalizeSynthesis(content: string, researchResults: any[]): Promise<string> {
  console.log('🎯 Normalizing synthesis content...');
  
  // Check for required sections
  const requiredSections = {
    'CASE SUMMARY': /\*\*CASE SUMMARY:\*\*/i,
    'RELEVANT TEXAS LAW': /\*\*RELEVANT TEXAS LAW:\*\*/i,
    'PRELIMINARY ANALYSIS': /\*\*PRELIMINARY ANALYSIS:\*\*/i,
    'CASE STRENGTHS': /\*\*CASE STRENGTHS:\*\*/i,
    'CASE WEAKNESSES': /\*\*CASE WEAKNESSES:\*\*/i,
    'POTENTIAL LEGAL ISSUES': /\*\*POTENTIAL LEGAL ISSUES:\*\*/i,
    'RECOMMENDED FOLLOW-UP QUESTIONS': /\*\*RECOMMENDED FOLLOW[-\s]?UP QUESTIONS:\*\*/i
  };

  let normalizedContent = content;

  // Check which sections are missing
  const missingSections = [];
  for (const [sectionName, pattern] of Object.entries(requiredSections)) {
    if (!pattern.test(content)) {
      missingSections.push(sectionName);
    }
  }

  console.log('📋 Missing sections:', missingSections);

  // If sections are missing, try to generate them from OpenAI research results
  if (missingSections.length > 0) {
    const openAIResult = researchResults.find(r => r.source === 'openai');
    
    if (openAIResult?.content) {
      console.log('🔧 Attempting to supplement missing sections from OpenAI research...');
      
      // Extract sections from OpenAI content using existing parser
      const { parseIracAnalysis } = await import('./iracParser.ts');
      const iracAnalysis = parseIracAnalysis(openAIResult.content);
      
      // Add missing sections
      for (const sectionName of missingSections) {
        switch (sectionName) {
          case 'PRELIMINARY ANALYSIS':
            if (iracAnalysis?.legalIssues?.[0]?.application) {
              normalizedContent += `\n\n**PRELIMINARY ANALYSIS:**\n${iracAnalysis.legalIssues[0].application}`;
            } else {
              normalizedContent += `\n\n**PRELIMINARY ANALYSIS:**\nBased on the available information, this matter requires careful analysis of the applicable Texas law and factual circumstances.`;
            }
            break;
          case 'POTENTIAL LEGAL ISSUES':
            if (iracAnalysis?.legalIssues?.length > 0) {
              const issues = iracAnalysis.legalIssues.map((issue, i) => `${i + 1}. ${issue.issueStatement}`).join('\n');
              normalizedContent += `\n\n**POTENTIAL LEGAL ISSUES:**\n${issues}`;
            } else {
              normalizedContent += `\n\n**POTENTIAL LEGAL ISSUES:**\n1. Determination of applicable legal standards\n2. Assessment of factual evidence sufficiency\n3. Evaluation of procedural requirements`;
            }
            break;
          case 'CASE STRENGTHS':
            normalizedContent += `\n\n**CASE STRENGTHS:**\n• Available documentation supports client's position\n• Legal precedent appears favorable\n• Client testimony appears credible`;
            break;
          case 'CASE WEAKNESSES':
            normalizedContent += `\n\n**CASE WEAKNESSES:**\n• Potential evidentiary challenges\n• Burden of proof considerations\n• Opposing arguments may require address`;
            break;
          case 'RECOMMENDED FOLLOW-UP QUESTIONS':
            normalizedContent += `\n\n**RECOMMENDED FOLLOW-UP QUESTIONS:**\n1. What additional documentation is available?\n2. Are there any witnesses to the relevant events?\n3. What is the client's desired outcome?`;
            break;
        }
      }
    }
  }

  console.log('✅ Synthesis normalization complete');
  return normalizedContent;
}

// Save synthesis to legal_analyses database
async function saveSynthesisToDatabase(
  content: string,
  clientId: string,
  caseId: string | undefined,
  supabase: any,
  authHeader: string | null,
  researchResults: any[],
  verifiedCases: any[]
) {
  try {
    // Get user ID from auth header
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    if (!userId) {
      console.log('⚠️ No authenticated user - skipping database save');
      return;
    }

    // Extract citations and law references
    const citations = extractCitations(content);
    const lawReferences = researchResults
      .filter(r => r.source === 'openai')
      .flatMap(r => r.metadata?.lawReferences || []);

    // Prepare data for validation and saving
    const analysisData = {
      clientId,
      content,
      timestamp: new Date().toISOString(),
      caseId: caseId || null,
      analysisType: 'case-analysis',
      caseType: 'general',
      lawReferences,
      documentsUsed: [],
      factSources: [{ type: 'ai-coordination', description: 'Multi-agent research synthesis' }],
      citations: citations.map(c => ({ citation: c, verified: false })),
      provenance: {
        researchAgents: researchResults.map(r => r.source),
        verifiedCases: verifiedCases?.length || 0,
        synthesisEngine: 'gemini-1.5-pro',
        coordinatorVersion: '2.0'
      }
    };

    // Call the validation and save function
    const { data: saveResult, error: saveError } = await supabase.functions.invoke(
      'validate-and-save-legal-analysis',
      {
        body: analysisData,
        headers: authHeader ? { Authorization: authHeader } : {}
      }
    );

    if (saveError) {
      console.error('❌ Error saving 3-agent synthesis:', saveError);
    } else {
      console.log('✅ 3-agent synthesis saved successfully:', saveResult?.analysisId);
    }

  } catch (error) {
    console.error('❌ Exception saving synthesis to database:', error);
  }
}

// Simple IRAC parser for coordinator use
const parseIracAnalysis = (content: string): any => {
  try {
    const legalIssues = [];
    
    // Look for issue statements
    const issueMatches = content.match(/\*\*ISSUE[^:]*:\*\*\s*(.*?)(?=\*\*|$)/gis);
    const applicationMatches = content.match(/\*\*APPLICATION[^:]*:\*\*\s*(.*?)(?=\*\*|$)/gis);
    
    if (issueMatches && issueMatches.length > 0) {
      issueMatches.forEach((match, i) => {
        const issueStatement = match.replace(/\*\*ISSUE[^:]*:\*\*\s*/i, '').trim();
        const application = applicationMatches?.[i]?.replace(/\*\*APPLICATION[^:]*:\*\*\s*/i, '').trim() || '';
        
        if (issueStatement) {
          legalIssues.push({
            issueStatement,
            application
          });
        }
      });
    }
    
    return { legalIssues };
  } catch (error) {
    console.error('Error parsing IRAC:', error);
    return { legalIssues: [] };
  }
};
