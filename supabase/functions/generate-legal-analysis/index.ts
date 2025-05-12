
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to search for relevant legal documents in the vector database
async function searchRelevantLaw(supabase, searchTerms) {
  console.log(`Searching for legal references with terms: ${searchTerms}`);
  try {
    // First search for exact document matches in metadata
    const { data: metadataResults, error: metadataError } = await supabase
      .from('document_metadata')
      .select('id, title, url')
      .or(`title.ilike.%${searchTerms}%,schema.ilike.%${searchTerms}%`)
      .limit(5);
    
    if (metadataError) {
      console.error("Error searching document metadata:", metadataError);
    }
    
    if (metadataResults && metadataResults.length > 0) {
      console.log(`Found ${metadataResults.length} direct metadata results`);
      return metadataResults.map(doc => ({
        id: doc.id,
        title: doc.title || "Texas Law Document",
        url: doc.url || null,
        content: null // We'll fetch content separately if needed
      }));
    }
    
    // Fallback to searching in the documents table with vector similarity
    const { data: documents, error: searchError } = await supabase
      .from('documents')
      .select('id, content, metadata')
      .textSearch('content', searchTerms, { type: 'plain' })
      .limit(3);

    if (searchError) {
      console.error("Error in text search:", searchError);
      return [];
    }

    console.log(`Found ${documents?.length || 0} documents in text search`);
    
    // Format and return the results
    return (documents || []).map(doc => {
      const metadata = doc.metadata || {};
      const content = doc.content || "";
      // Extract a snippet if the content is long
      const snippet = content.length > 500 
        ? content.substring(0, 500) + "..." 
        : content;
      
      return {
        id: metadata?.file_id || String(doc.id),
        title: metadata?.title || metadata?.file_title || "Texas Law Document",
        url: metadata?.file_path || null,
        content: snippet
      };
    });
  } catch (error) {
    console.error("Exception in searchRelevantLaw:", error);
    return [];
  }
}

// Function to extract key legal topics from conversation
function extractLegalTopics(conversation) {
  const combinedText = conversation.map(msg => msg.content).join(" ");
  
  // List of potential legal topics to check for in Texas law context
  const legalTopics = [
    "personal injury", "premises liability", "negligence", "tort", 
    "civil practice", "CPRC", "family law", "divorce", "custody", 
    "property division", "criminal", "DUI", "DWI", "theft", 
    "assault", "battery", "contract", "breach", "damages", 
    "real estate", "landlord tenant", "eviction", "workers compensation",
    "employment", "discrimination", "estate planning", "probate", "will", 
    "trust", "guardianship", "business formation", "LLC", "corporation",
    "insurance", "malpractice", "wrongful death", "product liability"
  ];
  
  // Find which topics are mentioned in the conversation
  const mentionedTopics = legalTopics.filter(topic => 
    combinedText.toLowerCase().includes(topic.toLowerCase())
  );
  
  // Extract potential statute references like "Section 101.021"
  const statutePattern = /\b(section|§)\s*\d+(\.\d+)*\b/gi;
  const potentialStatutes = combinedText.match(statutePattern) || [];
  
  // Extract case names like "Roe v. Wade"
  const casePattern = /\b[A-Z][a-z]+\s+v\.?\s+[A-Z][a-z]+\b/g;
  const potentialCases = combinedText.match(casePattern) || [];
  
  return {
    topics: mentionedTopics,
    statutes: potentialStatutes.map(s => s.replace(/^(section|§)\s*/i, '')),
    cases: potentialCases
  };
}

// Create a Supabase client specifically for the edge function
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase credentials not configured');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Basic client implementation for the edge function
function createClient(supabaseUrl, supabaseKey) {
  return {
    from: (table) => ({
      select: (columns) => ({
        textSearch: (column, query, options) => ({
          or: (conditions) => ({
            limit: (limit) => ({
              then: async () => {
                const url = `${supabaseUrl}/rest/v1/${table}?select=${columns}`;
                const response = await fetch(url, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey
                  }
                });
                return response.json();
              }
            })
          })
        }),
        or: (conditions) => ({
          limit: (limit) => ({
            then: async () => {
              const url = `${supabaseUrl}/rest/v1/${table}?select=${columns}&${conditions}`;
              try {
                const response = await fetch(url, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey
                  }
                });
                if (!response.ok) {
                  throw new Error(`Server responded with ${response.status}`);
                }
                return await response.json();
              } catch (error) {
                console.error(`Error fetching from ${table}:`, error);
                return { data: [], error };
              }
            }
          })
        })
      })
    })
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, conversation } = await req.json();

    if (!openAIApiKey) {
      console.error('OpenAI API key is not configured');
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the request details for debugging
    console.log(`Generating legal analysis for client: ${clientId}`);
    console.log(`Conversation length: ${conversation.length}`);

    // Extract legal topics from the conversation
    const legalContext = extractLegalTopics(conversation);
    console.log("Extracted legal topics:", legalContext);
    
    // Create a search query from the extracted topics
    const searchQuery = [
      ...legalContext.topics,
      ...legalContext.statutes,
      ...legalContext.cases
    ].join(" ");
    
    // Initialize relevant law references
    let relevantLawReferences = [];
    
    // Search for relevant law if we have extracted topics
    if (searchQuery.trim()) {
      const supabase = createSupabaseClient();
      if (supabase) {
        try {
          relevantLawReferences = await searchRelevantLaw(supabase, searchQuery);
          console.log(`Found ${relevantLawReferences.length} relevant law references`);
        } catch (error) {
          console.error("Error searching for relevant law:", error);
        }
      }
    }

    // Create improved system prompt for legal analysis - explicitly requesting exactly 4 follow-up questions
    // and adding formatting guidance for law citations
    const systemPrompt = `
You are a legal expert assistant for attorneys in Texas. Based on the attorney-client conversation provided, 
generate a concise legal analysis with the following sections:

1. **RELEVANT TEXAS LAW:** Identify and briefly explain Texas laws, statutes, or precedents that apply to this case.
   - When citing Texas statutes, use the format: "Texas Civil Practice and Remedies Code § 75.001" or similar standard legal citation format
   - For case law, use italics with the format: *Wal-Mart Stores, Inc. v. Gonzalez*
   - Be specific with statute numbers and section references when possible
   ${relevantLawReferences.length > 0 ? `\nConsider these specific Texas law references that may be relevant to this case:\n${relevantLawReferences.map(ref => `- ${ref.title || 'Texas Law'}: ${ref.content ? ref.content.substring(0, 200) + '...' : 'No preview available'}`).join('\n')}` : ''}

2. **PRELIMINARY ANALYSIS:** Analyze the key facts from the conversation and their legal implications under Texas law.

3. **POTENTIAL LEGAL ISSUES:** Identify potential legal challenges, considerations, or defenses that may arise.

4. **RECOMMENDED FOLLOW-UP QUESTIONS:** Suggest exactly 4 specific questions the attorney should ask next to gather important information for the case.

Format your response in Markdown with bold section headers. Under the "**RECOMMENDED FOLLOW-UP QUESTIONS**" section, 
format each question as a numbered list with the exact format:

1. First question text
2. Second question text
3. Third question text
4. Fourth question text

Make sure each question:
- Starts with a number followed by a period and a space (e.g. "1. ")
- Is clear and specific
- Is directly relevant to the case
- Is on its own line

After the last follow-up question, don't add any additional content, comments, or new sections. Generate exactly 4 follow-up questions, no more and no less.
`;

    // Format the conversation for the API request
    const formattedConversation = conversation.map(msg => ({
      role: "user", 
      content: `${msg.role.toUpperCase()}: ${msg.content}`
    }));

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Here is the attorney-client conversation for analysis:\n\n" + formattedConversation.map(msg => msg.content).join("\n\n") }
    ];

    console.log("Sending request to OpenAI with enhanced context");

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return new Response(
        JSON.stringify({ error: data.error?.message || 'Failed to generate legal analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract and verify the analysis
    let analysis = data.choices[0]?.message?.content || '';
    
    // Post-process the analysis to ensure exactly 4 follow-up questions if needed
    if (analysis) {
      console.log("Legal analysis generated successfully with vector database references");
    }

    return new Response(
      JSON.stringify({ analysis, lawReferences: relevantLawReferences }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-legal-analysis function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
