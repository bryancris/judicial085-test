
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to search for relevant legal documents with improved error handling
async function searchRelevantLaw(searchTerms) {
  console.log(`Searching for legal references with terms: ${searchTerms}`);
  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return [];
    }

    // First try searching document metadata
    try {
      const metadataResponse = await fetch(
        `${supabaseUrl}/rest/v1/document_metadata?select=id,title,url&title=ilike.*${encodeURIComponent(searchTerms)}*`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          }
        }
      );
      
      if (metadataResponse.ok) {
        const metadataResults = await metadataResponse.json();
        if (metadataResults && metadataResults.length > 0) {
          console.log(`Found ${metadataResults.length} direct metadata results`);
          return metadataResults.map(doc => ({
            id: doc.id,
            title: doc.title || "Texas Law Document",
            url: doc.url || null,
            content: null // We'll fetch content separately if needed
          }));
        }
      } else {
        console.warn(`Metadata search failed with status: ${metadataResponse.status}`);
        // Continue to fall back to documents table search
      }
    } catch (metadataError) {
      console.error("Error in metadata search, falling back to documents table:", metadataError);
      // Continue to documents table search
    }
    
    // Fallback to searching in the documents table
    try {
      const documentsResponse = await fetch(
        `${supabaseUrl}/rest/v1/documents?select=id,content,metadata&limit=5`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          }
        }
      );
      
      if (!documentsResponse.ok) {
        console.warn(`Documents search failed with status: ${documentsResponse.status}`);
        return [];
      }
      
      const documents = await documentsResponse.json();
      console.log(`Found ${documents?.length || 0} documents in fallback search`);
      
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
    } catch (documentsError) {
      console.error("Error in documents search:", documentsError);
      return [];
    }
  } catch (error) {
    console.error("Exception in searchRelevantLaw:", error);
    return [];
  }
}

// Enhanced function to extract key legal topics from conversation with improved consumer protection coverage
function extractLegalTopics(conversation) {
  const combinedText = conversation.map(msg => msg.content).join(" ");
  
  // Enhanced list of potential legal topics with specific focus on consumer protection
  const legalTopics = [
    // General legal topics
    "personal injury", "premises liability", "negligence", "tort", 
    "civil practice", "CPRC", "family law", "divorce", "custody", 
    "property division", "criminal", "DUI", "DWI", "theft", 
    "assault", "battery", "contract", "breach", "damages", 
    "real estate", "landlord tenant", "eviction", "workers compensation",
    "employment", "discrimination", "estate planning", "probate", "will", 
    "trust", "guardianship", "business formation", "LLC", "corporation",
    "insurance", "malpractice", "wrongful death", "product liability",
    
    // Enhanced consumer protection topics
    "deceptive trade practices", "DTPA", "consumer protection", 
    "false advertising", "warranty", "misleading", "door-to-door", 
    "home solicitation", "cooling off period", "right to cancel",
    "debt collection", "usury", "predatory lending", "loan", "finance charge",
    "consumer fraud", "bait and switch", "unfair practices", "misrepresentation"
  ];
  
  // Find which topics are mentioned in the conversation
  const mentionedTopics = legalTopics.filter(topic => 
    combinedText.toLowerCase().includes(topic.toLowerCase())
  );
  
  // Extract consumer protection statute references like "Section 17.46" (DTPA)
  const dtpaStatutePattern = /\b(section|§)\s*(17\.\d+)\b|\bDTPA\b|Bus\.\s*(&|and)\s*Com\.\s*Code/gi;
  const dtpaStatutes = (combinedText.match(dtpaStatutePattern) || []).map(s => 
    s.replace(/^(section|§)\s*/i, '')
  );
  
  // Extract general statute references like "Section 101.021"
  const statutePattern = /\b(section|§)\s*\d+(\.\d+)*\b/gi;
  const potentialStatutes = combinedText.match(statutePattern) || [];
  
  // Extract case names like "Roe v. Wade"
  const casePattern = /\b[A-Z][a-z]+\s+v\.?\s+[A-Z][a-z]+\b/g;
  const potentialCases = combinedText.match(casePattern) || [];
  
  return {
    topics: mentionedTopics,
    statutes: [...new Set([...dtpaStatutes, ...potentialStatutes.map(s => s.replace(/^(section|§)\s*/i, ''))])],
    cases: potentialCases
  };
}

// Function to detect consumer protection cases for specialized prompt enhancement
function isConsumerProtectionCase(legalContext) {
  const consumerTopics = [
    "deceptive trade practices", "dtpa", "consumer protection", 
    "false advertising", "warranty", "misleading", "door-to-door", 
    "home solicitation", "cooling off", "right to cancel", "17.46", 
    "consumer fraud", "bait and switch", "unfair practices", "misrepresentation"
  ];
  
  // Convert topics to lowercase for case-insensitive comparison
  const lowerTopics = legalContext.topics.map(t => t.toLowerCase());
  
  // Check if any consumer protection topics are mentioned
  const hasConsumerTopic = consumerTopics.some(topic => 
    lowerTopics.includes(topic.toLowerCase())
  );
  
  // Check if any statutes mention 17.4 (common DTPA sections start with 17.4)
  const hasDTPAStatute = legalContext.statutes.some(statute => 
    statute.startsWith("17.4") || statute.includes("DTPA")
  );
  
  return hasConsumerTopic || hasDTPAStatute;
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
      try {
        relevantLawReferences = await searchRelevantLaw(searchQuery);
        console.log(`Found ${relevantLawReferences.length} relevant law references`);
      } catch (error) {
        console.error("Error searching for relevant law:", error);
        // Continue without law references if search fails
      }
    }

    // Detect if this is a consumer protection case
    const isConsumerCase = isConsumerProtectionCase(legalContext);
    console.log(`Case identified as consumer protection case: ${isConsumerCase}`);
    
    // Create base system prompt
    let systemPrompt = `
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

    // Add enhanced prompt for consumer protection cases
    if (isConsumerCase) {
      const consumerProtectionPrompt = `
IMPORTANT: This appears to be a Consumer Protection/Deceptive Trade Practices case. In your analysis, be sure to address:

1. The Texas Deceptive Trade Practices-Consumer Protection Act (DTPA), Texas Business & Commerce Code § 17.41-17.63:
   - Cite specific violations from § 17.46(b)'s "laundry list" that apply to this case
   - Identify if the case involves a "false, misleading, or deceptive act" under § 17.46(a)
   - Determine if there are failures to disclose information under § 17.46(b)(24)
   - Assess if warranty breaches exist under § 17.50(a)(2)
   - Consider unconscionable actions under § 17.50(a)(3)

2. The Texas Home Solicitation Act (Texas Business & Commerce Code § 601.001 et seq.):
   - Determine if a 3-day right of rescission applies
   - Verify if proper notice of cancellation was provided
   - Check compliance with door-to-door sales requirements

3. The Texas Debt Collection Act (Texas Finance Code § 392.001 et seq.):
   - Identify any prohibited debt collection methods
   - Note any misrepresentations about debt amount or character

4. Available Remedies:
   - Economic damages under DTPA § 17.50(b)(1)
   - Potential for treble damages for knowing violations under § 17.50(b)(1)
   - Mental anguish damages if conduct was committed knowingly
   - Attorney's fees under § 17.50(d)
   - Injunctive relief possibilities
   - Contract rescission options

When analyzing these issues, connect specific facts from the conversation to the exact statutory provisions they violate. Prioritize violations by severity and impact on the consumer's case.
`;
      systemPrompt += consumerProtectionPrompt;
      console.log("Added consumer protection specialized prompt enhancement");
    }

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
        model: 'gpt-4o', // Upgraded from gpt-4o-mini for more accurate legal analysis
        messages,
        temperature: 0.5, // Reduced temperature for more precise legal analysis
        max_tokens: 2000, // Increased token limit for more comprehensive analysis
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
    
    // Add post-processing for consumer protection cases
    if (isConsumerCase && analysis) {
      console.log("Post-processing consumer protection case analysis");
      
      // Ensure DTPA is properly referenced
      if (!analysis.includes('Texas Business & Commerce Code § 17.4') && !analysis.includes('DTPA')) {
        analysis = analysis.replace('**RELEVANT TEXAS LAW:**', 
          '**RELEVANT TEXAS LAW:**\n\nTexas Deceptive Trade Practices-Consumer Protection Act (DTPA), Texas Business & Commerce Code § 17.41 et seq., which protects consumers against false, misleading, and deceptive business practices.\n\n' + 
          analysis.split('**RELEVANT TEXAS LAW:**')[1]
        );
      }
      
      // Ensure remedies are discussed if not already
      if (!analysis.toLowerCase().includes('remedy') && !analysis.toLowerCase().includes('remedies') && 
          !analysis.toLowerCase().includes('damages') && !analysis.includes('treble')) {
        analysis = analysis.replace('**POTENTIAL LEGAL ISSUES:**', 
          '**POTENTIAL LEGAL ISSUES:**\n\nPotential remedies under the DTPA include economic damages, mental anguish damages if violations were committed knowingly, and up to three times (treble) damages for knowing violations. The client may also recover court costs and reasonable attorney\'s fees.\n\n' + 
          analysis.split('**POTENTIAL LEGAL ISSUES:**')[1]
        );
      }
    }

    if (analysis) {
      console.log("Legal analysis generated successfully with enhanced context and post-processing");
    }

    return new Response(
      JSON.stringify({ 
        analysis, 
        lawReferences: relevantLawReferences,
        caseType: isConsumerCase ? "consumer-protection" : "general"
      }),
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
