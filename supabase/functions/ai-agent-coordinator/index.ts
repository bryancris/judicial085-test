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
}

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
    
    const synthesisPrompt = `You are a senior legal AI assistant synthesizing research from multiple sources for an attorney. Your task is to create a comprehensive, organized, and actionable legal analysis.

ATTORNEY QUERY: ${query}

RESEARCH SOURCES ANALYZED:
${researchResults.map((result, index) => `
--- ${result.source.toUpperCase()} RESEARCH (${result.type}) ---
${result.content}

CITATIONS: ${result.citations?.join(', ') || 'None'}
${result.metadata ? `METADATA: ${JSON.stringify(result.metadata)}` : ''}
`).join('\n')}

SYNTHESIS INSTRUCTIONS:
1. Provide a comprehensive legal analysis that combines insights from all research sources
2. Organize the response with clear sections: Summary, Key Legal Issues, Analysis, Recommendations
3. Maintain all citations and source attributions
4. Highlight any conflicts or agreements between sources
5. Provide actionable next steps for the attorney
6. Use professional legal language appropriate for attorney consultation

Please synthesize this research into a cohesive, well-organized response that maximizes the value of all research sources.`;

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

    // Combine all citations from research sources
    const allCitations = researchResults.flatMap(result => result.citations || []);
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
          content: synthesizedContent,
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
      synthesizedContent,
      citations: uniqueCitations,
      researchSources: researchResults.map(r => ({
        source: r.source,
        type: r.type,
        available: r.content !== `${r.source.charAt(0).toUpperCase() + r.source.slice(1)} research temporarily unavailable`
      })),
      metadata: {
        totalResearchAgents: researchResults.length,
        synthesisEngine: 'gemini-1.5-pro',
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