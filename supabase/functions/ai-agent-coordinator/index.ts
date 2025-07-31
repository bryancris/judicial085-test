import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResearchResult {
  source: 'openai' | 'perplexity';
  type: string;
  content: string;
  citations?: string[];
  confidence?: number;
  metadata?: any;
}

interface CoordinatorRequest {
  query: string;
  clientId?: string;
  caseId?: string;
  context?: any;
  researchTypes?: string[];
  userId?: string;
  messages?: Array<{ role: string; content: string; timestamp?: string }>;
}

/**
 * Extract case names from synthesized content
 */
const extractCaseNames = (text: string): string[] => {
  const caseNames: string[] = [];
  
  // Enhanced patterns for case extraction
  const patterns = [
    // Standard numbered case format: "1. Case v. Other"
    /^\s*\d+\.\s*\*?\*?([A-Z][^v\n]*v\.?\s*[A-Z][^,\n\d]*)/gm,
    
    // Bullet point cases: "• Case v. Other" or "- Case v. Other"
    /^[\s•\-*]+\*?\*?([A-Z][^v\n]*v\.?\s*[A-Z][^,\n\d]*)/gm,
    
    // Bold case names: **Case v. Other**
    /\*\*([A-Z][^v*\n]*v\.?\s*[A-Z][^,*\n\d]*)\*\*/g,
    
    // Inline case citations with proper capitalization
    /\b([A-Z][a-zA-Z\s&,.']*v\.?\s*[A-Z][a-zA-Z\s&,.']*?)(?:\s*[,;:]|\s*\(|\s*$)/g,
    
    // Cases mentioned after "In" or "See": "In Case v. Other"
    /(?:In\s+|See\s+)([A-Z][^v\n]*v\.?\s*[A-Z][^,\n\d]*)/gi,
    
    // Texas-specific patterns: "Texas Court of Appeals" cases
    /([A-Z][^v\n]*v\.?\s*[A-Z][^,\n\d]*)\s*,?\s*(?:Tex\.|Texas)/gi
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let caseName = match[1].trim()
        .replace(/\*\*/g, '')
        .replace(/[,:.;"']+$/, '')
        .replace(/\s+/g, ' ');
      
      // Clean up common artifacts
      caseName = caseName
        .replace(/^(In\s+|See\s+)/i, '')
        .replace(/\s+(Tex\.|Texas).*$/i, '')
        .trim();
      
      // Validate case name quality
      if (caseName.length > 8 && 
          caseName.includes('v') && 
          !caseNames.some(existing => existing.toLowerCase() === caseName.toLowerCase()) &&
          !/^\d+/.test(caseName) && // Not starting with numbers
          !/^(The|A|An)\s+v\./i.test(caseName)) { // Not starting with articles + v.
        caseNames.push(caseName);
      }
    }
  });
  
  return caseNames.slice(0, 15); // Limit to prevent overwhelming CourtListener
};

/**
 * Verify cases with CourtListener
 */
const verifyCasesWithCourtListener = async (caseNames: string[], supabaseClient: any): Promise<any[]> => {
  const verifiedCases: any[] = [];
  
  for (const caseName of caseNames) {
    try {
      console.log(`Verifying case: ${caseName}`);
      
      // Call the search-court-listener function
      const { data, error } = await supabaseClient.functions.invoke('search-court-listener', {
        body: { 
          query: caseName,
          citation: caseName 
        }
      });
      
      if (error) {
        console.log(`CourtListener search error for "${caseName}":`, error);
        continue;
      }
      
      if (data?.results && data.results.length > 0) {
        // Find the best match based on case name similarity
        const bestMatch = data.results[0];
        
        verifiedCases.push({
          originalName: caseName,
          verifiedCase: {
            id: bestMatch.id,
            caseName: bestMatch.caseName,
            court: bestMatch.court,
            dateFiled: bestMatch.dateFiled,
            docketNumber: bestMatch.docketNumber,
            url: bestMatch.absolute_url,
            snippet: bestMatch.snippet,
            confidence: calculateMatchConfidence(caseName, bestMatch.caseName)
          }
        });
        
        console.log(`Verified case: ${caseName} -> ${bestMatch.caseName}`);
      } else {
        console.log(`No CourtListener results found for: ${caseName}`);
      }
    } catch (error) {
      console.log(`Error verifying case "${caseName}":`, error);
    }
  }
  
  return verifiedCases;
};

/**
 * Calculate match confidence between original and verified case names
 */
const calculateMatchConfidence = (original: string, verified: string): number => {
  const originalWords = original.toLowerCase().split(/\s+/);
  const verifiedWords = verified.toLowerCase().split(/\s+/);
  
  let matchCount = 0;
  for (const word of originalWords) {
    if (verifiedWords.some(vw => vw.includes(word) || word.includes(vw))) {
      matchCount++;
    }
  }
  
  return Math.min(100, Math.round((matchCount / originalWords.length) * 100));
};

/**
 * Replace AI case mentions with verified CourtListener cases
 */
const replaceWithVerifiedCases = (text: string, verifiedCases: any[]): { text: string, citations: any[] } => {
  let updatedText = text;
  const courtListenerCitations: any[] = [];
  
  for (const { originalName, verifiedCase } of verifiedCases) {
    if (verifiedCase.confidence >= 60) { // Only replace with high confidence matches
      // Create citation object
      courtListenerCitations.push({
        id: `cl-${verifiedCase.id}`,
        type: 'case',
        source: 'CourtListener',
        title: verifiedCase.caseName,
        relevance: verifiedCase.confidence,
        content_preview: verifiedCase.snippet,
        docket_number: verifiedCase.docketNumber,
        court: verifiedCase.court,
        date_filed: verifiedCase.dateFiled,
        url: verifiedCase.url,
        verified: true
      });
      
      // Replace the case name in the text with verified version
      const originalPattern = new RegExp(
        originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
        'gi'
      );
      
      const verifiedText = `${verifiedCase.caseName} [Verified on CourtListener]`;
      updatedText = updatedText.replace(originalPattern, verifiedText);
    }
  }
  
  return { text: updatedText, citations: courtListenerCitations };
};

/**
 * Remove duplicate case citations while preserving formatting
 */
const removeDuplicateCitations = (text: string): string => {
  const lines = text.split('\n');
  const processedLines: string[] = [];
  const seenCases = new Set<string>();
  
  for (let line of lines) {
    let processedLine = line;
    let shouldSkipLine = false;
    
    // Check for numbered case lists (1., 2., 3., etc.)
    const numberedCaseMatch = line.match(/^\s*\d+\.\s*(.+)/);
    if (numberedCaseMatch) {
      // This is a numbered case item, check if we've seen this case before
      const caseContent = numberedCaseMatch[1];
      const caseNameMatch = caseContent.match(/^(.+?v\..+?)(?:\s|,|$)/i);
      if (caseNameMatch) {
        const caseName = caseNameMatch[1].trim();
        const normalizedCase = caseName.toLowerCase().replace(/[,.\s]+/g, ' ').trim();
        
        if (seenCases.has(normalizedCase)) {
          shouldSkipLine = true; // Skip this entire case entry
        } else {
          seenCases.add(normalizedCase);
        }
      }
    }
    
    // Find all case citations in format "Name v. Name"
    const caseMatches = line.match(/\b[A-Z][^v]*v\.[^,\n()]+/g);
    if (caseMatches) {
      for (const fullMatch of caseMatches) {
        const caseName = fullMatch.trim();
        const normalizedCase = caseName.toLowerCase().replace(/[,.\s]+/g, ' ').trim();
        
        if (seenCases.has(normalizedCase)) {
          // Remove this duplicate case mention
          const regex = new RegExp(fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          processedLine = processedLine.replace(regex, '');
          // Also remove any bold formatting around it
          const boldRegex = new RegExp(`\\*\\*${fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*`, 'g');
          processedLine = processedLine.replace(boldRegex, '');
        } else {
          seenCases.add(normalizedCase);
        }
      }
    }
    
    // Clean up formatting but preserve paragraph structure
    processedLine = processedLine.replace(/\*\*([^*]+v\.[^*]+)\*\*/g, '$1'); // Remove bold from case names
    
    // Only add the line if it's not a case list and has content after processing
    if (!shouldSkipLine && processedLine.trim().length > 0) {
      processedLines.push(processedLine);
    }
  }
  
  // Join lines and clean up excessive whitespace while preserving paragraph breaks
  return processedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .replace(/[ \t]+\n/g, '\n') // Remove trailing spaces
    .trim();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { query, clientId, caseId, context, researchTypes = ['legal-research', 'similar-cases'] }: CoordinatorRequest = await req.json();

    console.log('🎯 AI Agent Coordinator received request:', { query, clientId, caseId, researchTypes });

    // Phase 1: Coordinate research agents in parallel
    console.log('🔍 Initiating parallel research with OpenAI and Perplexity agents...');
    
    const researchPromises: Promise<ResearchResult>[] = [];

    // OpenAI Research Agent - Legal analysis and document research
    if (researchTypes.includes('legal-research')) {
      researchPromises.push(
        fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-legal-analysis`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.get('Authorization') || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId,
            caseId,
            conversation: [{ role: 'attorney', content: query }],
            researchFocus: 'legal-analysis'
          })
        }).then(async (res) => {
          const data = await res.json();
          return {
            source: 'openai' as const,
            type: 'legal-analysis',
            content: data.analysis || '',
            citations: data.lawReferences || [],
            metadata: { documentsUsed: data.documentsUsed }
          };
        }).catch(err => {
          console.error('OpenAI research error:', err);
          return {
            source: 'openai' as const,
            type: 'legal-analysis',
            content: 'OpenAI research temporarily unavailable',
            citations: []
          };
        })
      );
    }

    // Perplexity Research Agent - Real-time case discovery and current legal research
    if (researchTypes.includes('similar-cases') || researchTypes.includes('current-research')) {
      researchPromises.push(
        fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/perplexity-research`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.get('Authorization') || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            clientId,
            searchType: 'legal-research',
            context
          })
        }).then(async (res) => {
          const data = await res.json();
          return {
            source: 'perplexity' as const,
            type: 'current-research',
            content: data.content || '',
            citations: data.citations || [],
            confidence: data.confidence,
            metadata: data.metadata
          };
        }).catch(err => {
          console.error('Perplexity research error:', err);
          return {
            source: 'perplexity' as const,
            type: 'current-research',
            content: 'Perplexity research temporarily unavailable',
            citations: []
          };
        })
      );
    }

    // Wait for all research agents to complete
    const researchResults = await Promise.all(researchPromises);
    console.log('✅ Research agents completed. Results:', researchResults.map(r => ({ source: r.source, type: r.type, contentLength: r.content.length })));

    // Phase 2: Use Gemini as synthesis engine with large context window
    console.log('🧠 Initiating Gemini synthesis with 2M context window...');
    
    const synthesisPrompt = `You are a comprehensive legal research assistant providing detailed analysis for an attorney. Create a thorough, well-structured legal research report.

ATTORNEY'S QUESTION: ${query}

RESEARCH SOURCES:
${researchResults.map((result, index) => `
--- ${result.source.toUpperCase()} RESEARCH ---
${result.content}
CITATIONS: ${result.citations?.join(', ') || 'None'}
`).join('\n')}

REQUIRED RESPONSE FORMAT:

**RELEVANT LAW:**
- Provide the FULL TEXT of any statutes mentioned in the question (e.g., if Texas Property Code 202.004 is mentioned, include the complete statute text)
- Include related statutes and their full text
- Explain how these statutes apply to the situation

**LEGAL ANALYSIS:**
- Direct answer to the attorney's question
- Clear explanation of legal principles
- Application of law to the facts presented

**KEY CASES:**
For each relevant case, provide:
1. **Case Name v. Defendant** (make case names bold and clickable-looking)
   - Court: [Specific court name]
   - Citation: [Legal citation] 
   - Date: [Decision date]
   - **Summary:** [2-3 sentence summary of the case and its relevance]
   - **Outcome:** [Court's decision and key holdings]
   - **Relevance:** [Why this case applies to the attorney's question]

Include 5-10 highly relevant cases with complete information for each.

**PRACTICAL GUIDANCE:**
- Specific next steps for the attorney
- Potential remedies or defenses
- Strategic considerations

**CITATIONS:**
- List all statutes, cases, and authorities referenced
- Include links where available

FORMAT REQUIREMENTS:
- Use professional legal language appropriate for attorney consultation
- Make case names bold and visually prominent
- Structure with clear headings and bullet points
- Focus on actionable legal guidance
- Include comprehensive statute text when specific statutes are mentioned in the question`;

    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: synthesisPrompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          candidateCount: 1
        }
      }),
    }).then(res => res.text()).then(text => {
      const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`);
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: synthesisPrompt }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            candidateCount: 1
          }
        }),
      });
    }).then(res => res.json());

    let synthesizedContent = 'Synthesis temporarily unavailable';
    if (geminiResponse.candidates && geminiResponse.candidates[0]?.content?.parts?.[0]?.text) {
      synthesizedContent = geminiResponse.candidates[0].content.parts[0].text;
    }

    console.log('✅ Gemini synthesis completed:', { contentLength: synthesizedContent.length });

    // Phase 3: CourtListener verification for legal accuracy
    console.log('⚖️ Initiating CourtListener verification for case citations...');
    
    const extractedCases = extractCaseNames(synthesizedContent);
    console.log('Extracted cases for verification:', extractedCases);
    
    let verifiedCases: any[] = [];
    let courtListenerCitations: any[] = [];
    let finalContent = synthesizedContent;
    let courtListenerStatus = 'not_attempted';
    
    if (extractedCases.length > 0) {
      try {
        // Check if CourtListener API token is available
        const courtListenerToken = Deno.env.get('COURTLISTENER_API_TOKEN');
        if (!courtListenerToken) {
          console.warn('⚠️ CourtListener API token not found - skipping verification');
          courtListenerStatus = 'token_missing';
        } else {
          verifiedCases = await verifyCasesWithCourtListener(extractedCases, supabaseClient);
          console.log(`✅ CourtListener verification completed: ${verifiedCases.length} cases verified`);
          courtListenerStatus = 'success';
          
          if (verifiedCases.length > 0) {
            const verificationResult = replaceWithVerifiedCases(synthesizedContent, verifiedCases);
            finalContent = removeDuplicateCitations(verificationResult.text);
            courtListenerCitations = verificationResult.citations;
          }
        }
      } catch (error) {
        console.error('❌ CourtListener verification failed:', error);
        courtListenerStatus = 'failed';
        
        // Log detailed error information
        if (error instanceof Error) {
          console.error('CourtListener error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
        
        // Continue without verification - don't fail the entire request
        console.log('🔄 Continuing without CourtListener verification to ensure response delivery');
      }
    }

    // Combine all citations from research sources plus CourtListener
    const allCitations = [
      ...researchResults.flatMap(result => result.citations || []),
      ...courtListenerCitations
    ];
    const uniqueCitations = [...new Set(allCitations)];

    // Store the coordinated research result
    if (clientId) {
      const { error: storeError } = await supabaseClient
        .from('perplexity_research')
        .insert({
          client_id: clientId,
          case_id: caseId,
          search_type: 'ai-agent-coordination',
          query,
          content: finalContent,
          citations: uniqueCitations,
          metadata: {
            researchSources: researchResults.map(r => ({ source: r.source, type: r.type })),
            timestamp: new Date().toISOString(),
            model: 'gemini-synthesis',
            researchAgents: researchResults.length
          }
        });

      if (storeError) {
        console.error('Error storing coordinated research:', storeError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      text: finalContent, // For Quick Consult compatibility
      synthesizedContent: finalContent,
      citations: courtListenerCitations, // CourtListener verified citations for Quick Consult
      hasKnowledgeBase: researchResults.some(r => r.source === 'openai' && r.metadata?.documentsUsed > 0),
      documentsFound: researchResults.find(r => r.source === 'openai')?.metadata?.documentsUsed || 0,
      verifiedCases: verifiedCases.length,
      courtListenerCitations: verifiedCases.length,
      courtListenerStatus: courtListenerStatus,
      researchSources: researchResults.map(r => ({
        source: r.source,
        type: r.type,
        available: r.content !== `${r.source.charAt(0).toUpperCase() + r.source.slice(1)} research temporarily unavailable`
      })),
      metadata: {
        totalResearchAgents: researchResults.length,
        synthesisEngine: 'gemini-1.5-pro',
        verificationEngine: 'courtlistener',
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI agent coordinator:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to coordinate AI agents',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});