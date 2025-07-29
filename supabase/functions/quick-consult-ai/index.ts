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
const searchKnowledgeBase = async (query: string, clientId?: string, userId?: string): Promise<any[]> => {
  try {
    console.log('Searching knowledge base for:', query.substring(0, 100) + '...');
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    console.log('Generated embedding with', queryEmbedding.length, 'dimensions');
    
    // Search public documents (knowledge base), client-specific documents, and firm documents
    let searchResults = [];
    
    if (clientId) {
      console.log('Searching client-specific documents for client:', clientId);
      // Search client-specific documents
      const { data: clientDocs, error: clientError } = await supabase.rpc(
        'search_document_chunks_by_similarity',
        {
          query_embedding: queryEmbedding,
          client_id_param: clientId,
          match_threshold: 0.4, // Further lowered threshold for better recall
          match_count: 10 // Increased from 5 to 10
        }
      );
      
      if (clientError) {
        console.error('Client documents search error:', clientError);
      } else if (clientDocs) {
        console.log('Found', clientDocs.length, 'client-specific documents');
        searchResults = [...searchResults, ...clientDocs];
      }
    }
    
    // Search firm documents if userId is provided
    if (userId) {
      console.log('Searching firm documents for user:', userId);
      
      // Get user's firm ID
      const { data: firmData } = await supabase
        .from('firm_users')
        .select('firm_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      if (firmData?.firm_id) {
        // Search firm documents using document metadata
        const { data: firmDocIds } = await supabase
          .from('document_metadata')
          .select('id')
          .eq('firm_id', firmData.firm_id)
          .is('client_id', null);
        
        if (firmDocIds && firmDocIds.length > 0) {
          const docIds = firmDocIds.map(doc => doc.id);
          
          const { data: firmDocs, error: firmError } = await supabase
            .from('document_chunks')
            .select(`
              id,
              document_id,
              content,
              metadata,
              1 - (embedding <=> '[${queryEmbedding.join(',')}]') as similarity
            `)
            .in('document_id', docIds)
            .gt('1 - (embedding <=> \'[' + queryEmbedding.join(',') + ']\')', 0.4)
            .order('embedding <=> \'[' + queryEmbedding.join(',') + ']\'')
            .limit(10); // Increased from 5 to 10
          
          if (firmError) {
            console.error('Firm documents search error:', firmError);
          } else if (firmDocs) {
            console.log('Found', firmDocs.length, 'firm documents');
            searchResults = [...searchResults, ...firmDocs];
          }
        }
      }
    }
    
    // Search public knowledge base documents using match_documents function
    console.log('Searching public knowledge base documents...');
    
    // Use the match_documents RPC function to search the documents table with increased limits
    const { data: publicDocs, error: publicError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: 20, // Increased from 10 to 20 for more cases
      filter: {}
    });
    
    if (publicError) {
      console.error('Public documents search error:', publicError);
    } else {
      console.log('Found', publicDocs?.length || 0, 'public knowledge base documents');
      // Log some details about found documents
      if (publicDocs && publicDocs.length > 0) {
        publicDocs.forEach((doc, index) => {
          console.log(`Knowledge base doc ${index + 1}: similarity ${doc.similarity}, metadata:`, doc.metadata);
        });
      }
    }
    
    if (!publicError && publicDocs) {
      searchResults = [...searchResults, ...publicDocs];
    }
    
    // Sort by similarity and limit results - increased for more comprehensive responses
    searchResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    const finalResults = searchResults.slice(0, 15); // Increased from 5 to 15 for more cases
    
    console.log('Final search results:', finalResults.length, 'documents');
    finalResults.forEach((result, index) => {
      console.log(`Document ${index + 1}: ${result.metadata?.file_title || result.document_id} (similarity: ${result.similarity})`);
    });
    
    return finalResults;
    
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

// Function to surgically remove duplicate case citations while preserving formatting
const removeDuplicateCitations = (text: string): string => {
  // Track case names we've seen (normalize for comparison)
  const seenCases = new Set<string>();
  const lines = text.split('\n');
  const processedLines: string[] = [];
  
  for (const line of lines) {
    let processedLine = line;
    
    // Find case citations in this line
    const casePattern = /\b([A-Z][a-zA-Z\s&.,-]+\s+v\.\s+[A-Z][a-zA-Z\s&.,-]+)(?:,?\s+\d+[\w\s.]+\d+)?/g;
    let match;
    let shouldSkipLine = false;
    
    // Check if this line is just a bulleted/numbered case list
    const trimmedLine = line.trim();
    if (/^[•\-*]\s*[A-Z][a-zA-Z\s&.,-]+\s+v\.\s+[A-Z][a-zA-Z\s&.,-]+/.test(trimmedLine) ||
        /^\d+\.\s*[A-Z][a-zA-Z\s&.,-]+\s+v\.\s+[A-Z][a-zA-Z\s&.,-]+/.test(trimmedLine)) {
      shouldSkipLine = true;
    }
    
    // Process individual case mentions in the line
    while ((match = casePattern.exec(line)) !== null) {
      const fullMatch = match[0];
      const caseName = match[1];
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
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not set');
      throw new Error('OpenAI API key is not configured');
    }

    const { messages, clientId, userId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    console.log('Processing quick consult request with', messages.length, 'messages');
    console.log('Client ID provided:', clientId || 'None');
    console.log('User ID provided:', userId || 'None');

    // Get the latest user message for knowledge base search
    const latestUserMessage = messages.filter(msg => msg.role === 'user').pop();
    const userQuery = latestUserMessage?.content || '';

    // Search knowledge base for relevant documents (including firm documents)
    const searchResults = await searchKnowledgeBase(userQuery, clientId, userId);
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
      content: `You are a professional AI legal assistant specifically designed to help Texas attorneys with quick consultations, research, and drafting assistance focused on Texas law.

TEXAS LEGAL FOCUS:
- You specialize in Texas statutes, regulations, and case law
- Prioritize Texas Property Code, Business & Commerce Code, Civil Practice & Remedies Code, Penal Code, and other Texas statutes
- Reference Texas court decisions and precedents when applicable
- Consider Texas-specific legal procedures and requirements

IMPORTANT DISCLAIMERS:
- You do not provide legal advice to clients
- You assist attorneys with research, analysis, and document drafting
- Always remind users that your responses are for informational purposes only
- Encourage attorneys to verify information and apply their professional judgment
- All analysis should be verified against current Texas statutes and case law

Your capabilities include:
- Texas legal research and case analysis
- Document drafting assistance for Texas practice
- Texas statutory and regulatory interpretation
- Texas court procedural guidance
- Legal writing support with Texas citations
- Texas-specific citation formatting

${knowledgeContext}

MANDATORY RESPONSE STRUCTURE AND RULES:

1. ANTI-DUPLICATION RULES (CRITICAL):
   - NEVER mention the same case more than once in your entire response
   - If you cite "Smith v. Jones" once, NEVER reference it again
   - Track every case name you mention and avoid repeating them
   - Each case gets exactly ONE mention in the entire response

2. PROFESSIONAL FORMATTING (REQUIRED):
   - Use proper paragraph breaks for readability
   - Allow section headers like "Key Considerations" or "Analysis" when appropriate
   - Use professional legal writing structure with clear organization
   - Maintain proper spacing between paragraphs for clarity
   
3. FORBIDDEN FORMATTING:
   - DO NOT use asterisks (**) or bold formatting around case names
   - DO NOT create numbered or bulleted lists of cases
   - DO NOT create "References," "Citations," "Summary," or "Additional Cases" sections
   - DO NOT create any sections that list cases separately

4. CITATION INTEGRATION:
   - Knowledge base documents: [Document 1], [Document 2], etc.
   - Texas statutes: Tex. Prop. Code § 101.021, Tex. Bus. & Com. Code § 17.46
   - Cases: Smith v. Jones, 123 S.W.3d 456 (Tex. 2009) - integrate naturally
   - Weave citations smoothly into the narrative flow

5. COMPREHENSIVE COVERAGE:
   - Provide thorough analysis covering multiple relevant cases and statutes
   - Address different aspects and implications of the legal question
   - Include practical considerations and procedural guidance where relevant
   - Offer substantive legal research value

RESPONSE QUALITY REQUIREMENTS:
- Write in a professional, authoritative legal tone
- Provide comprehensive coverage of the topic
- Include multiple relevant authorities when available
- Organize information logically with clear structure
- Ensure each case citation adds unique value

Remember: Professional legal writing with proper structure and formatting is required, but absolute elimination of case duplication is critical.`
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14', // Switched to flagship model for better performance
        messages: [systemPrompt, ...messages],
        temperature: 0.2, // Lowered for more consistent instruction following
        max_tokens: 2000, // Increased for comprehensive responses
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    // Post-process to remove duplicate citations
    aiResponse = removeDuplicateCitations(aiResponse);
    
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