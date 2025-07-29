import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generate embedding for text using OpenAI
 */
const generateEmbedding = async (text: string): Promise<number[]> => {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
};

/**
 * Search knowledge base using embeddings
 */
const searchKnowledgeBase = async (query: string, clientId?: string, userId?: string): Promise<any[]> => {
  try {
    console.log(`Searching knowledge base for: ${query.substring(0, 50)}...`);
    
    // Generate embedding for the query
    const embedding = await generateEmbedding(query);
    console.log(`Generated embedding with ${embedding.length} dimensions`);

    const searchResults: any[] = [];

    // Search client-specific documents if clientId is provided
    if (clientId) {
      console.log(`Searching client documents for client: ${clientId}`);
      try {
        const { data: clientDocs, error: clientError } = await supabase.rpc('search_client_documents', {
          query_embedding: embedding,
          match_threshold: 0.78,
          match_count: 3,
          target_client_id: clientId
        });

        if (clientError) {
          console.log('Client documents search error:', clientError);
        } else if (clientDocs) {
          searchResults.push(...clientDocs);
          console.log(`Found ${clientDocs.length} client documents`);
        }
      } catch (error) {
        console.log('Client documents search error:', error);
      }
    }

    // Search firm documents if userId is provided
    if (userId) {
      console.log(`Searching firm documents for user: ${userId}`);
      try {
        const { data: firmDocs, error: firmError } = await supabase.rpc('search_firm_documents', {
          query_embedding: embedding,
          match_threshold: 0.78,
          match_count: 3,
          target_user_id: userId
        });

        if (firmError) {
          console.log('Firm documents search error:', firmError);
        } else if (firmDocs) {
          searchResults.push(...firmDocs);
          console.log(`Found ${firmDocs.length} firm documents`);
        }
      } catch (error) {
        console.log('Firm documents search error:', error);
      }
    }

    // Search public knowledge base documents
    console.log('Searching public knowledge base documents...');
    try {
      const { data: publicDocs, error: publicError } = await supabase.rpc('search_knowledge_base', {
        query_embedding: embedding,
        match_threshold: 0.78,
        match_count: 5
      });

      if (publicError) {
        console.log('Public documents search error:', publicError);
      } else if (publicDocs) {
        searchResults.push(...publicDocs);
        console.log(`Found ${publicDocs.length} public documents`);
      }
    } catch (error) {
      console.log('Public documents search error:', error);
    }

    console.log(`Final search results: ${searchResults.length} documents`);
    return searchResults;

  } catch (error) {
    console.error('Error in searchKnowledgeBase:', error);
    return [];
  }
};

/**
 * Generate citations from search results
 */
const generateCitations = (searchResults: any[]): any[] => {
  return searchResults.map((result, index) => ({
    id: result.document_id || `doc-${index}`,
    type: result.metadata?.document_type || 'document',
    source: result.metadata?.source || 'Knowledge Base',
    title: result.metadata?.file_title || `Document ${index + 1}`,
    relevance: Math.round((result.similarity || 0.8) * 100),
    content_preview: result.content?.substring(0, 200) + (result.content?.length > 200 ? '...' : ''),
  }));
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

2. REQUIRED RESPONSE STRUCTURE:
   - Start with a **RELEVANT TEXAS LAW** section providing legal background
   - Follow with a **CASES** section using numbered list format
   - Use proper paragraph breaks for readability
   - Maintain professional legal writing structure

3. CASE FORMATTING REQUIREMENTS:
   - Create a numbered list for cases (1., 2., 3., etc.)
   - Format each case entry as:
     **Case Name**
     Court • Date • Docket No. [number] • Citation
     Brief summary paragraph explaining relevance
   - Include docket numbers when available
   - Use bullet points (•) to separate court, date, docket, and citation info
   - Bold case names for clarity

4. CITATION INTEGRATION:
   - Knowledge base documents: [Document 1], [Document 2], etc.
   - Texas statutes: Tex. Prop. Code § 101.021, Tex. Bus. & Com. Code § 17.46
   - Cases: Include full citation with docket number when available
   - Format: Case Name, Citation (Court Year), Docket No. [number]

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
- Use the specified numbered list format for cases

Remember: Professional legal writing with proper structure and formatting is required, including numbered case lists with docket numbers.`
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