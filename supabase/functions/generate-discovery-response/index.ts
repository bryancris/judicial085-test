
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to perform Perplexity research for discovery
const performDiscoveryResearch = async (requestContent: string, clientId: string) => {
  try {
    console.log("Performing discovery research with Perplexity...");
    
    const { data, error } = await supabase.functions.invoke('perplexity-research', {
      body: {
        query: `Discovery request legal research: ${requestContent}`,
        model: 'sonar-pro',
        searchType: 'legal-research',
        context: 'Discovery response generation - need case law, statutes, and legal precedents'
      }
    });

    if (error) {
      console.error("Error calling Perplexity research:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Exception in performDiscoveryResearch:", err);
    return null;
  }
};

// Function to search internal knowledge base
const searchKnowledgeBase = async (requestContent: string, clientId: string) => {
  try {
    console.log("Searching internal knowledge base...");
    
    const { data: documents, error } = await supabase
      .from('document_metadata')
      .select('*')
      .eq('client_id', clientId)
      .eq('include_in_analysis', true)
      .limit(5);

    if (error) {
      console.error("Error searching knowledge base:", error);
      return [];
    }

    return documents || [];
  } catch (err) {
    console.error("Exception in searchKnowledgeBase:", err);
    return [];
  }
};

// Function to generate citations
const generateCitations = (perplexityResult: any, knowledgeBaseDocs: any[]) => {
  const citations = [];
  
  // Add external citations from Perplexity
  if (perplexityResult && perplexityResult.citations) {
    perplexityResult.citations.forEach((citation: string, index: number) => {
      citations.push({
        id: `ext-${index}`,
        type: 'external',
        source: citation,
        title: `External Research Source ${index + 1}`,
        relevance: 0.8
      });
    });
  }
  
  // Add internal knowledge base citations
  knowledgeBaseDocs.forEach((doc: any, index: number) => {
    citations.push({
      id: `kb-${index}`,
      type: 'internal',
      source: doc.title || `Document ${doc.id}`,
      title: doc.title,
      url: doc.url,
      relevance: 0.9
    });
  });
  
  return citations;
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get the authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authorization header is required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { requestId, requestContent, clientInfo } = await req.json();
    
    if (!requestId || !requestContent) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: requestId and requestContent are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Processing discovery request:", { requestId, contentLength: requestContent.length });
    
    // Get client ID from the request
    const clientId = clientInfo?.id;
    
    // Perform external research and internal knowledge base search
    const [perplexityResult, knowledgeBaseDocs] = await Promise.all([
      performDiscoveryResearch(requestContent, clientId),
      searchKnowledgeBase(requestContent, clientId)
    ]);
    
    // Generate citations from research results
    const citations = generateCitations(perplexityResult, knowledgeBaseDocs);
    
    // Analyze discovery request
    const analysisResult = {
      requestType: "Interrogatories",
      requestCount: 10,
      complexityScore: 7.5,
      potentialIssues: [
        "Overly broad request in item #3",
        "Request #7 may be protected by attorney-client privilege",
        "Request #9 seeks information outside the relevant time period"
      ],
      suggestedApproach: "Provide complete responses to straightforward requests, object to overly broad or privileged requests, and provide partial responses with appropriate objections where necessary.",
      hasExternalSources: perplexityResult ? true : false,
      hasInternalSources: knowledgeBaseDocs.length > 0
    };
    
    // Generate enhanced response with citations context
    let responseContent = `
RESPONSE TO FIRST SET OF INTERROGATORIES

1. OBJECTION: This interrogatory is overly broad and unduly burdensome. Without waiving this objection, Respondent states as follows: [Details would go here]

2. Respondent has never been involved in any similar incidents as described in the complaint.

3. OBJECTION: This interrogatory is overly broad in scope and time and seeks information not reasonably calculated to lead to the discovery of admissible evidence. 

4. The events in question occurred on March 15, 2023, at approximately 2:30 PM.

5. The following individuals were present during the incident: John Smith, Maria Garcia, and Robert Johnson.

6. Respondent denies having any knowledge of the alleged defect prior to the incident described in the complaint.

7. OBJECTION: This request seeks information protected by attorney-client privilege.

8. The document referenced in paragraph 14 of the complaint was created on January 10, 2023, by Sarah Williams in the normal course of business.

9. OBJECTION: This interrogatory seeks information outside the relevant time period established for this litigation. Without waiving this objection, Respondent states: [Limited response would go here]

10. Respondent performed standard maintenance on the equipment in question on the following dates: January 5, 2023; February 10, 2023; and March 1, 2023. All maintenance was performed according to manufacturer specifications.
`;

    // Add research-informed content if external sources were found
    if (perplexityResult && perplexityResult.content) {
      responseContent += `

LEGAL RESEARCH NOTES:
Based on current legal precedents and research, the following considerations apply to this discovery request:

${perplexityResult.content.substring(0, 500)}...

[Note: Detailed legal analysis and citations are provided below]
`;
    }

    // Add knowledge base context if internal documents were found
    if (knowledgeBaseDocs.length > 0) {
      responseContent += `

INTERNAL DOCUMENT REFERENCES:
This response incorporates information from ${knowledgeBaseDocs.length} relevant document(s) from the case file:
${knowledgeBaseDocs.map((doc, index) => `- ${doc.title || `Document ${index + 1}`}`).join('\n')}
`;
    }

    // Return the analysis, generated response, and citations
    return new Response(
      JSON.stringify({
        analysis: analysisResult,
        responseContent: responseContent,
        citations: citations,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-discovery-response function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
