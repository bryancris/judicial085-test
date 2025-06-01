import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced function to search for relevant legal documents with improved search logic
async function searchRelevantLaw(searchTerms, caseType = "general") {
  console.log(`Searching for legal references with terms: ${searchTerms}, case type: ${caseType}`);
  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return [];
    }

    // Define case-type specific law mappings for better relevance
    const lawMappings = {
      "consumer-protection": [
        "Texas Deceptive Trade Practices", "DTPA", "Business Commerce Code 17",
        "Consumer Protection", "Deceptive Trade Practices", "17.41", "17.46", "17.50"
      ],
      "animal-protection": [
        "Texas Penal Code 42.092", "Animal Cruelty", "Penal Code Chapter 42",
        "Animal Protection", "Cruelty to Animals", "42.09", "42.092"
      ],
      "personal-injury": [
        "Civil Practice Remedies Code", "CPRC", "Negligence", "Tort", "Personal Injury"
      ],
      "contract": [
        "Contract Law", "Breach of Contract", "Business Commerce Code", "Agreement"
      ]
    };

    // Determine relevant search terms based on case content and type
    let relevantTerms = searchTerms.toLowerCase();
    let additionalTerms = [];

    // Add case-type specific terms
    if (caseType === "consumer-protection" || relevantTerms.includes("dtpa") || 
        relevantTerms.includes("deceptive") || relevantTerms.includes("consumer")) {
      additionalTerms = lawMappings["consumer-protection"];
    }
    
    if (relevantTerms.includes("animal") || relevantTerms.includes("pet") || 
        relevantTerms.includes("dog") || relevantTerms.includes("boarding")) {
      additionalTerms = [...additionalTerms, ...lawMappings["animal-protection"]];
    }

    // Create a comprehensive search query
    const allSearchTerms = [searchTerms, ...additionalTerms].join(" ");
    console.log(`Enhanced search terms: ${allSearchTerms}`);

    // First try searching document metadata with improved terms
    try {
      const metadataResponse = await fetch(
        `${supabaseUrl}/rest/v1/document_metadata?select=id,title,url&or=title.ilike.*${encodeURIComponent("Texas Business Commerce Code")}*,title.ilike.*${encodeURIComponent("DTPA")}*,title.ilike.*${encodeURIComponent("Penal Code")}*,title.ilike.*${encodeURIComponent("Animal Cruelty")}*&limit=5`,
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
          console.log(`Found ${metadataResults.length} relevant statute metadata results`);
          return metadataResults.map(doc => ({
            id: doc.id,
            title: doc.title || "Texas Law Document",
            url: doc.url || null,
            content: null
          }));
        }
      } else {
        console.warn(`Metadata search failed with status: ${metadataResponse.status}`);
      }
    } catch (metadataError) {
      console.error("Error in metadata search:", metadataError);
    }
    
    // Enhanced fallback: Try specific statute searches
    const statuteSearches = [
      "Texas Business Commerce Code",
      "Texas Penal Code", 
      "DTPA",
      "Deceptive Trade Practices",
      "Animal Cruelty"
    ];

    for (const statute of statuteSearches) {
      try {
        const documentsResponse = await fetch(
          `${supabaseUrl}/rest/v1/documents?select=id,content,metadata&content=ilike.*${encodeURIComponent(statute)}*&limit=3`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            }
          }
        );
        
        if (documentsResponse.ok) {
          const documents = await documentsResponse.json();
          if (documents && documents.length > 0) {
            console.log(`Found ${documents.length} documents for statute: ${statute}`);
            
            // Filter out irrelevant documents (like Parks and Wildlife Code)
            const relevantDocs = documents.filter(doc => {
              const content = (doc.content || "").toLowerCase();
              const metadata = doc.metadata || {};
              const title = (metadata?.title || metadata?.file_title || "").toLowerCase();
              
              // Exclude Parks and Wildlife Code and other irrelevant codes
              const irrelevantTerms = ["parks and wildlife", "water code", "agriculture code"];
              const hasIrrelevantContent = irrelevantTerms.some(term => 
                content.includes(term) || title.includes(term)
              );
              
              if (hasIrrelevantContent) {
                console.log(`Filtering out irrelevant document: ${title}`);
                return false;
              }
              
              return true;
            });
            
            if (relevantDocs.length > 0) {
              return relevantDocs.map(doc => {
                const metadata = doc.metadata || {};
                const content = doc.content || "";
                const snippet = content.length > 500 
                  ? content.substring(0, 500) + "..." 
                  : content;
                
                return {
                  id: metadata?.file_id || String(doc.id),
                  title: metadata?.title || metadata?.file_title || `Texas ${statute}`,
                  url: metadata?.file_path || null,
                  content: snippet
                };
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error searching for statute ${statute}:`, error);
      }
    }
    
    // If no relevant laws found, return empty array instead of irrelevant documents
    console.log("No relevant Texas statutes found in database");
    return [];
    
  } catch (error) {
    console.error("Exception in searchRelevantLaw:", error);
    return [];
  }
}

// Enhanced function to fetch client-specific documents with case filtering
async function fetchClientDocuments(clientId, caseId = null) {
  console.log(`Fetching client-specific documents for client: ${clientId}${caseId ? `, case: ${caseId}` : ''}`);
  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return [];
    }

    // Build query URL with filters
    let queryUrl = `${supabaseUrl}/rest/v1/document_chunks?select=document_id,content,metadata,chunk_index&client_id=eq.${clientId}&order=document_id.asc,chunk_index.asc`;
    
    // Add case filter if provided
    if (caseId) {
      queryUrl += `&case_id=eq.${caseId}`;
    }

    // Fetch document chunks for this client/case
    const response = await fetch(queryUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    });
    
    if (!response.ok) {
      console.warn(`Client documents fetch failed with status: ${response.status}`);
      return [];
    }
    
    const chunks = await response.json();
    console.log(`Found ${chunks?.length || 0} document chunks for client ${clientId}${caseId ? ` and case: ${caseId}` : ''}`);
    
    if (!chunks || chunks.length === 0) {
      return [];
    }
    
    // Group chunks by document_id and combine their content
    const documentMap = new Map();
    
    chunks.forEach(chunk => {
      if (!documentMap.has(chunk.document_id)) {
        documentMap.set(chunk.document_id, {
          id: chunk.document_id,
          content: chunk.content || "",
          metadata: chunk.metadata || {},
          chunks: [chunk]
        });
      } else {
        const doc = documentMap.get(chunk.document_id);
        // Append content with a space to avoid merging words
        doc.content += " " + (chunk.content || "");
        doc.chunks.push(chunk);
      }
    });
    
    // Format documents for context inclusion
    return Array.from(documentMap.values()).map(doc => {
      // Get a descriptive title from metadata
      const title = doc.metadata?.title || 
                   doc.metadata?.fileName || 
                   (doc.metadata?.isPdfDocument ? "PDF Document" : "Document");
      
      // Limit content to a reasonable size for context
      const snippet = doc.content.length > 2000 
        ? doc.content.substring(0, 2000) + "..." 
        : doc.content;
      
      return {
        id: doc.id,
        title: title,
        content: snippet,
        isPdfDocument: !!doc.metadata?.isPdfDocument,
        fileName: doc.metadata?.fileName,
        uploadedAt: doc.metadata?.uploadedAt
      };
    });
  } catch (error) {
    console.error("Error fetching client documents:", error);
    return [];
  }
}

// Enhanced function to extract key legal topics from conversation with improved consumer protection coverage
function extractLegalTopics(conversation) {
  const combinedText = conversation.map(msg => msg.content).join(" ");
  
  // Enhanced list of potential legal topics with specific focus on consumer protection and animal law
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
    "consumer fraud", "bait and switch", "unfair practices", "misrepresentation",
    
    // Animal protection topics
    "animal cruelty", "animal abuse", "pet", "dog", "cat", "boarding",
    "veterinary malpractice", "animal neglect", "animal care", "pet boarding"
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
  
  // Extract animal cruelty statute references like "42.092"
  const animalStatutePattern = /\b(section|§)\s*(42\.09\d*)\b|penal\s*code\s*(42\.09\d*)/gi;
  const animalStatutes = (combinedText.match(animalStatutePattern) || []).map(s => 
    s.replace(/^(section|§)\s*/i, '').replace(/penal\s*code\s*/i, '')
  );
  
  // Extract general statute references like "Section 101.021"
  const statutePattern = /\b(section|§)\s*\d+(\.\d+)*\b/gi;
  const potentialStatutes = combinedText.match(statutePattern) || [];
  
  // Extract case names like "Roe v. Wade"
  const casePattern = /\b[A-Z][a-z]+\s+v\.?\s+[A-Z][a-z]+\b/g;
  const potentialCases = combinedText.match(casePattern) || [];
  
  return {
    topics: mentionedTopics,
    statutes: [...new Set([...dtpaStatutes, ...animalStatutes, ...potentialStatutes.map(s => s.replace(/^(section|§)\s*/i, ''))])],
    cases: potentialCases
  };
}

// Enhanced function to detect case type for specialized prompt enhancement
function detectCaseType(legalContext) {
  const consumerTopics = [
    "deceptive trade practices", "dtpa", "consumer protection", 
    "false advertising", "warranty", "misleading", "door-to-door", 
    "home solicitation", "cooling off", "right to cancel", "17.46", 
    "consumer fraud", "bait and switch", "unfair practices", "misrepresentation"
  ];
  
  const animalTopics = [
    "animal cruelty", "animal abuse", "pet", "dog", "cat", "boarding",
    "veterinary malpractice", "animal neglect", "42.092", "dogtopia"
  ];
  
  // Convert topics to lowercase for case-insensitive comparison
  const lowerTopics = legalContext.topics.map(t => t.toLowerCase());
  const combinedText = legalContext.topics.join(" ").toLowerCase();
  
  // Check if any consumer protection topics are mentioned
  const hasConsumerTopic = consumerTopics.some(topic => 
    lowerTopics.includes(topic.toLowerCase()) || combinedText.includes(topic)
  );
  
  // Check if any animal protection topics are mentioned
  const hasAnimalTopic = animalTopics.some(topic => 
    lowerTopics.includes(topic.toLowerCase()) || combinedText.includes(topic)
  );
  
  // Check if any statutes mention relevant sections
  const hasDTPAStatute = legalContext.statutes.some(statute => 
    statute.startsWith("17.4") || statute.includes("DTPA")
  );
  
  const hasAnimalStatute = legalContext.statutes.some(statute => 
    statute.startsWith("42.09")
  );
  
  if (hasConsumerTopic || hasDTPAStatute) {
    return "consumer-protection";
  }
  
  if (hasAnimalTopic || hasAnimalStatute) {
    return "animal-protection";
  }
  
  return "general";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, conversation, caseId } = await req.json();

    if (!openAIApiKey) {
      console.error('OpenAI API key is not configured');
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the request details for debugging
    console.log(`Generating legal analysis for client: ${clientId}${caseId ? `, case: ${caseId}` : ''}`);
    console.log(`Conversation length: ${conversation?.length || 0}`);

    // Determine if we have a conversation or should use documents
    const hasConversation = conversation && conversation.length > 0;
    console.log(`Has conversation: ${hasConversation}`);

    // Fetch client-specific documents (filtered by case if provided)
    let clientDocuments = [];
    try {
      clientDocuments = await fetchClientDocuments(clientId, caseId);
      console.log(`Retrieved ${clientDocuments.length} documents for analysis`);
    } catch (documentError) {
      console.error("Error fetching client documents:", documentError);
    }

    // If no conversation and no documents, return error
    if (!hasConversation && clientDocuments.length === 0) {
      return new Response(
        JSON.stringify({ error: "No conversation or documents available for analysis. Please either start a client conversation or upload documents marked for analysis." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract legal topics from conversation or documents
    let legalContext;
    let analysisSource = "";
    
    if (hasConversation) {
      legalContext = extractLegalTopics(conversation);
      analysisSource = "client conversation";
    } else {
      // Extract legal topics from document content
      const documentText = clientDocuments.map(doc => doc.content).join(" ");
      legalContext = extractLegalTopics([{ content: documentText }]);
      analysisSource = "uploaded documents";
    }
    
    console.log("Extracted legal topics:", legalContext);
    console.log("Analysis source:", analysisSource);
    
    // Detect case type for better law search
    const detectedCaseType = detectCaseType(legalContext);
    console.log(`Detected case type: ${detectedCaseType}`);
    
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
        relevantLawReferences = await searchRelevantLaw(searchQuery, detectedCaseType);
        console.log(`Found ${relevantLawReferences.length} relevant law references`);
      } catch (error) {
        console.error("Error searching for relevant law:", error);
      }
    }

    // Detect if this is a consumer protection case (keeping original logic for backward compatibility)
    const isConsumerCase = detectedCaseType === "consumer-protection";
    console.log(`Case identified as consumer protection case: ${isConsumerCase}`);
    
    // Create system prompt based on analysis source
    let systemPrompt = `
You are a legal expert assistant for attorneys in Texas. Based on the ${analysisSource} provided, 
generate a concise legal analysis with the following sections:

1. **RELEVANT TEXAS LAW:** Identify and briefly explain Texas laws, statutes, or precedents that apply to this case.
   - When citing Texas statutes, use the format: "Texas Civil Practice and Remedies Code § 75.001" or similar standard legal citation format
   - For case law, use italics with the format: *Wal-Mart Stores, Inc. v. Gonzalez*
   - Be specific with statute numbers and section references when possible
   ${relevantLawReferences.length > 0 ? `\nConsider these specific Texas law references that may be relevant to this case:\n${relevantLawReferences.map(ref => `- ${ref.title || 'Texas Law'}: ${ref.content ? ref.content.substring(0, 200) + '...' : 'No preview available'}`).join('\n')}` : ''}

2. **PRELIMINARY ANALYSIS:** Analyze the key facts from the ${analysisSource} and their legal implications under Texas law.

3. **POTENTIAL LEGAL ISSUES:** Identify potential legal challenges, considerations, or defenses that may arise.

4. **RECOMMENDED FOLLOW-UP QUESTIONS:** Suggest exactly 4 specific questions the attorney should ${hasConversation ? 'ask the client next' : 'investigate further'} to gather important information for the case.

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

    // Add client documents section to the prompt if available
    if (clientDocuments.length > 0) {
      const clientDocumentsPrompt = `
${hasConversation ? 'IMPORTANT: The client has also provided the following documents related to this case that should be considered in your analysis:' : 'IMPORTANT: The analysis should be based on the following client documents:'}

${clientDocuments.map((doc, index) => 
  `DOCUMENT ${index + 1}: ${doc.title} ${doc.uploadedAt ? `(Uploaded: ${new Date(doc.uploadedAt).toLocaleDateString()})` : ''}
${doc.content}`
).join('\n\n')}

When analyzing this case, SPECIFICALLY reference information from these ${hasConversation ? 'client documents' : 'documents'} where relevant. When you use information from a document, clearly indicate which document you're referencing. ${hasConversation ? 'These client-provided documents should supplement the conversation analysis.' : 'Base your entire analysis on these documents.'}
`;
      systemPrompt += clientDocumentsPrompt;
      console.log("Added client documents to prompt");
    }

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

    // Add enhanced prompt for animal protection cases
    if (detectedCaseType === "animal-protection") {
      const animalProtectionPrompt = `
IMPORTANT: This appears to involve animal protection/cruelty issues. In your analysis, be sure to address:

1. Texas Penal Code § 42.092 - Cruelty to Animals:
   - Identify if there's intentional or knowing torture, serious bodily injury, or killing of animals
   - Determine if there's failure to provide necessary food, water, shelter, or veterinary care
   - Assess if animals were abandoned in circumstances where death, serious bodily injury, or suffering was likely

2. Civil remedies and consumer protection aspects:
   - If involving pet boarding, grooming, or veterinary services, consider DTPA violations for deceptive practices
   - Breach of contract for failure to provide promised care
   - Negligence claims for failure to meet standard of care

3. Available Remedies:
   - Criminal penalties under Penal Code § 42.092
   - Civil damages for veterinary expenses, replacement costs, and emotional distress
   - Injunctive relief to prevent further harm
   - Consumer protection remedies if commercial services were involved

Connect the specific facts to the relevant statutory provisions and identify both criminal and civil liability issues.
`;
      systemPrompt += animalProtectionPrompt;
      console.log("Added animal protection specialized prompt enhancement");
    }

    // Format the content for the API request
    let userContent = "";
    if (hasConversation) {
      const formattedConversation = conversation.map(msg => ({
        role: "user", 
        content: `${msg.role.toUpperCase()}: ${msg.content}`
      }));
      userContent = "Here is the attorney-client conversation for analysis:\n\n" + formattedConversation.map(msg => msg.content).join("\n\n");
    } else {
      userContent = `Here are the client documents for analysis:\n\n${clientDocuments.map((doc, index) => 
        `DOCUMENT ${index + 1}: ${doc.title}\n${doc.content}`
      ).join('\n\n')}`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ];

    console.log(`Sending request to OpenAI with ${analysisSource} context`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.5,
        max_tokens: 2000,
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

    // Add note about source of analysis
    if (analysis) {
      const sourceNote = `*Analysis generated from ${analysisSource}${clientDocuments.length > 0 ? ` (${clientDocuments.length} document${clientDocuments.length > 1 ? 's' : ''}: ${clientDocuments.map(doc => doc.title).join(', ')})` : ''}*\n\n`;
      analysis = sourceNote + analysis;
      console.log(`Legal analysis generated successfully from ${analysisSource}`);
    }

    return new Response(
      JSON.stringify({ 
        analysis, 
        lawReferences: relevantLawReferences,
        documentsUsed: clientDocuments.map(doc => ({
          id: doc.id,
          title: doc.title,
          isPdfDocument: doc.isPdfDocument
        })),
        caseType: detectedCaseType,
        analysisSource
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
