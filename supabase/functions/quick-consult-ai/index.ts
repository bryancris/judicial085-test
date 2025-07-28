import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to generate embedding using OpenAI
const generateEmbedding = async (text: string): Promise<number[]> => {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI embedding API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data[0].embedding;
};

// Function to search knowledge base documents
const searchKnowledgeBase = async (query: string, clientId?: string): Promise<any[]> => {
  try {
    console.log('Searching knowledge base for:', query.substring(0, 100) + '...');
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search public documents (knowledge base) and client-specific documents
    let searchResults = [];
    
    if (clientId) {
      // Search client-specific documents
      const { data: clientDocs, error: clientError } = await supabase.rpc(
        'search_document_chunks_by_similarity',
        {
          query_embedding: queryEmbedding,
          client_id_param: clientId,
          match_threshold: 0.7,
          match_count: 5
        }
      );
      
      if (!clientError && clientDocs) {
        searchResults = [...searchResults, ...clientDocs];
      }
    }
    
    // Search public knowledge base documents (where client_id and case_id are null)
    const { data: publicDocs, error: publicError } = await supabase
      .from('document_chunks')
      .select(`
        id,
        document_id,
        content,
        metadata,
        1 - (embedding <=> '[${queryEmbedding.join(',')}]') as similarity
      `)
      .is('client_id', null)
      .is('case_id', null)
      .gt('1 - (embedding <=> \'[' + queryEmbedding.join(',') + ']\')', 0.7)
      .order('embedding <=> \'[' + queryEmbedding.join(',') + ']\'')
      .limit(5);
    
    if (!publicError && publicDocs) {
      searchResults = [...searchResults, ...publicDocs];
    }
    
    // Sort by similarity and limit results
    searchResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    return searchResults.slice(0, 5);
    
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return [];
  }
};

// Function to generate citations from search results
const generateCitations = (searchResults: any[]): any[] => {
  return searchResults.map((result, index) => ({
    id: `doc-${index}`,
    type: 'knowledge_base',
    source: result.metadata?.file_title || result.document_id,
    title: result.metadata?.file_title || `Document ${result.document_id}`,
    relevance: result.similarity || 0.8,
    content_preview: result.content?.substring(0, 200) + '...'
  }));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not set');
      throw new Error('OpenAI API key is not configured');
    }

    const { messages, clientId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    console.log('Processing quick consult request with', messages.length, 'messages');
    console.log('Client ID provided:', clientId || 'None (public knowledge base only)');

    // Get the latest user message for knowledge base search
    const latestUserMessage = messages.filter(msg => msg.role === 'user').pop();
    const userQuery = latestUserMessage?.content || '';

    // Search knowledge base for relevant documents
    const searchResults = await searchKnowledgeBase(userQuery, clientId);
    console.log(`Found ${searchResults.length} relevant documents`);

    // Generate citations from search results
    const citations = generateCitations(searchResults);

    // Build context from search results
    let knowledgeContext = '';
    if (searchResults.length > 0) {
      knowledgeContext = `

RELEVANT KNOWLEDGE BASE DOCUMENTS:
${searchResults.map((result, index) => `
Document ${index + 1}: ${result.metadata?.file_title || result.document_id}
Content: ${result.content?.substring(0, 400)}...
Relevance: ${Math.round((result.similarity || 0.8) * 100)}%
`).join('\n')}

Please reference these documents when relevant to the user's question and provide citations when appropriate.
`;
    }

    const systemPrompt = {
      role: 'system',
      content: `You are a professional AI legal assistant designed to help attorneys with quick consultations, research, and drafting assistance. 

IMPORTANT DISCLAIMERS:
- You do not provide legal advice to clients
- You assist attorneys with research, analysis, and document drafting
- Always remind users that your responses are for informational purposes only
- Encourage attorneys to verify information and apply their professional judgment

Your capabilities include:
- Legal research and case analysis
- Document drafting assistance
- Statutory and regulatory interpretation
- Procedural guidance
- Legal writing support
- Citation formatting

${knowledgeContext}

When referencing information from the knowledge base documents, please cite them as [Document 1], [Document 2], etc.

Respond professionally and concisely. Focus on practical assistance for legal professionals.`
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('Quick consult response generated successfully');

    return new Response(JSON.stringify({ 
      text: aiResponse,
      usage: data.usage,
      citations: citations,
      hasKnowledgeBase: searchResults.length > 0,
      documentsFound: searchResults.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in quick-consult-ai function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});