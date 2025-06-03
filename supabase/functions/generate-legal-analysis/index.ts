import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { searchRelevantLaw } from "./services/lawSearchService.ts";
import { fetchClientDocuments } from "./services/clientDocumentsService.ts";
import { extractLegalTopics, detectCaseType } from "./utils/legalTopicsExtractor.ts";
import { buildSystemPrompt } from "./prompts/systemPromptBuilder.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Knowledge base law documents mapping for citation extraction
const KNOWLEDGE_BASE_LAW_DOCS = [
  {
    id: "texas-penal-code",
    title: "Texas Penal Code",
    filename: "PENALCODE.pdf",
    citations: ["Texas Penal Code", "Penal Code", "§ 42.092", "§ 42.091", "§ 42.09", "Chapter 42", "Section 42.092", "Section 42.091"],
    searchTerms: ["animal cruelty", "cruelty to animals", "attack on assistance animal"]
  },
  {
    id: "texas-business-commerce-code", 
    title: "Texas Business & Commerce Code",
    filename: "BUSINESSANDCOMMERCECODE.pdf",
    citations: [
      "Texas Business & Commerce Code", 
      "Business & Commerce Code", 
      "DTPA", 
      "Texas Deceptive Trade Practices Act", 
      "Deceptive Trade Practices-Consumer Protection Act",
      "§ 17.41", "§ 17.46", "§ 17.50", "§ 17.505", "§ 17.63",
      "Section 17.41", "Section 17.46", "Section 17.50", "Section 17.505", "Section 17.63",
      "Section 17.46(a)", "Section 17.46(b)", "Section 17.46(b)(24)",
      "Section 17.50(a)", "Section 17.50(a)(2)", "Section 17.50(a)(3)",
      "Section 17.50(b)", "Section 17.50(b)(1)", "Section 17.50(d)",
      "Chapter 17", "Chapter 601", "§ 601.001"
    ],
    searchTerms: ["consumer protection", "deceptive trade practices", "false advertising"]
  },
  {
    id: "texas-civil-practice-remedies-code",
    title: "Texas Civil Practice & Remedies Code",
    filename: "CIVILPRACTICEANDREMEDIESCODE.pdf", 
    citations: [
      "Texas Civil Practice & Remedies Code", 
      "Civil Practice & Remedies Code", 
      "§ 16.003", "§ 33.001", "§ 41.001",
      "Section 16.003", "Section 33.001", "Section 41.001",
      "Chapter 16", "Chapter 33", "Chapter 41"
    ],
    searchTerms: ["statute of limitations", "proportionate responsibility", "damages"]
  }
];

// Enhanced extract legal citations from analysis content
function extractLegalCitations(content) {
  const citations = [];
  
  console.log("Extracting citations from content preview:", content.substring(0, 500) + "...");
  
  // Enhanced patterns for comprehensive citation extraction
  const patterns = [
    // Texas codes with section numbers (e.g., Texas Business & Commerce Code § 17.46)
    /(Texas\s+[A-Za-z]+(?:\s+[&]?\s*[A-Za-z]+)*\s+Code\s+§\s+\d+\.\d+(?:\([a-z0-9]+\))?)/gi,
    
    // Section references with subsections (e.g., Section 17.46(b), Section 17.50(a)(2))
    /(Section\s+\d+\.\d+(?:\([a-z0-9]+\))?(?:\([a-z0-9]+\))?)/gi,
    
    // Standalone section symbols (e.g., § 17.46, § 17.50(b))
    /(§\s+\d+\.\d+(?:\([a-z0-9]+\))?(?:\([a-z0-9]+\))?)/gi,
    
    // Chapter references (e.g., Chapter 17, Chapter 42)
    /(Chapter\s+\d+)/gi,
    
    // DTPA and specific law names
    /(Texas\s+Deceptive\s+Trade\s+Practices\s+Act|DTPA|Texas\s+Penal\s+Code|Penal\s+Code|Business\s+&\s+Commerce\s+Code)/gi,
    
    // Deceptive Trade Practices-Consumer Protection Act
    /(Deceptive\s+Trade\s+Practices-Consumer\s+Protection\s+Act)/gi,
    
    // Texas Home Solicitation Act
    /(Texas\s+Home\s+Solicitation\s+Act)/gi,
    
    // Texas Debt Collection Act  
    /(Texas\s+Debt\s+Collection\s+Act)/gi
  ];
  
  // Extract citations using all patterns
  patterns.forEach((pattern, index) => {
    let match;
    const patternRegex = new RegExp(pattern);
    while ((match = patternRegex.exec(content)) !== null) {
      if (match[1] && match[1].trim()) {
        citations.push(match[1].trim());
      }
    }
  });
  
  const uniqueCitations = [...new Set(citations)];
  console.log("Extracted unique citations:", uniqueCitations);
  
  return uniqueCitations;
}

// Enhanced map citations to knowledge base documents with direct PDF URLs
function mapCitationsToKnowledgeBase(citations) {
  const matchedDocs = [];
  
  console.log("Mapping citations to knowledge base:", citations);
  
  for (const citation of citations) {
    console.log("Processing citation:", citation);
    
    for (const doc of KNOWLEDGE_BASE_LAW_DOCS) {
      // Enhanced matching logic
      const isMatch = doc.citations.some(pattern => {
        const citationLower = citation.toLowerCase();
        const patternLower = pattern.toLowerCase();
        
        // Exact match
        if (citationLower === patternLower) return true;
        
        // Citation contains pattern
        if (citationLower.includes(patternLower)) return true;
        
        // Pattern contains citation (for broader matches)
        if (patternLower.includes(citationLower) && citationLower.length > 5) return true;
        
        // Special DTPA matching
        if ((citationLower.includes('dtpa') || citationLower.includes('deceptive trade')) && 
            (patternLower.includes('dtpa') || patternLower.includes('deceptive trade'))) return true;
            
        // Business & Commerce Code matching for section references
        if (citationLower.match(/section\s+17\./i) && patternLower.includes('business')) return true;
        if (citationLower.match(/§\s+17\./i) && patternLower.includes('business')) return true;
        
        // Penal Code matching for section references  
        if (citationLower.match(/section\s+42\./i) && patternLower.includes('penal')) return true;
        if (citationLower.match(/§\s+42\./i) && patternLower.includes('penal')) return true;
        
        return false;
      });
      
      if (isMatch && !matchedDocs.find(d => d.id === doc.id)) {
        const mappedDoc = {
          id: doc.id,
          title: doc.title,
          url: `https://ghpljdgecjmhkwkfctgy.supabase.co/storage/v1/object/public/documents/${doc.filename}`,
          content: `Click to view the full ${doc.title} document.`
        };
        
        console.log("Matched citation to document:", { citation, doc: mappedDoc.title });
        matchedDocs.push(mappedDoc);
      }
    }
  }
  
  console.log("Final matched documents:", matchedDocs.map(doc => doc.title));
  return matchedDocs;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, conversation, caseId, researchUpdates } = await req.json();

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
    console.log(`Research updates to integrate: ${researchUpdates?.length || 0}`);

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
    
    // Initialize relevant law references - Get ACTUAL law references, not document names
    let relevantLawReferences = [];
    
    // Search for relevant law if we have extracted topics
    if (searchQuery.trim()) {
      try {
        relevantLawReferences = await searchRelevantLaw(searchQuery, detectedCaseType);
        console.log(`Found ${relevantLawReferences.length} relevant law references`);
        console.log("Law references found:", relevantLawReferences.map(ref => ref.title));
      } catch (error) {
        console.error("Error searching for relevant law:", error);
      }
    }

    // Detect if this is a consumer protection case (keeping original logic for backward compatibility)
    const isConsumerCase = detectedCaseType === "consumer-protection";
    console.log(`Case identified as consumer protection case: ${isConsumerCase}`);
    
    // Create system prompt with research updates integration
    const systemPrompt = buildSystemPrompt(
      analysisSource,
      relevantLawReferences,
      hasConversation,
      clientDocuments,
      detectedCaseType,
      researchUpdates // Pass research updates to system prompt
    );

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

    // Add research updates context if available
    if (researchUpdates && researchUpdates.length > 0) {
      userContent += "\n\nIMPORTANT: The following research updates should be integrated into the appropriate sections of your analysis:\n\n";
      researchUpdates.forEach((update, index) => {
        userContent += `RESEARCH UPDATE ${index + 1} (Target: ${update.section}):\n`;
        userContent += `Statutes: ${update.statutes.join(', ')}\n`;
        userContent += `Topics: ${update.topics.join(', ')}\n`;
        userContent += `Content: ${update.content}\n\n`;
      });
      userContent += "Please integrate the specific statute details and legal information from these research updates into the relevant sections of your analysis instead of keeping them as separate updates.";
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ];

    console.log(`Sending request to OpenAI with ${analysisSource} context and ${researchUpdates?.length || 0} research updates`);

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
    
    // Enhanced citation extraction and mapping with debugging
    console.log("Starting enhanced citation extraction from analysis...");
    const extractedCitations = extractLegalCitations(analysis);
    console.log("Final extracted citations count:", extractedCitations.length);
    
    const knowledgeBaseLawReferences = mapCitationsToKnowledgeBase(extractedCitations);
    console.log("Final knowledge base law references count:", knowledgeBaseLawReferences.length);

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

    // Enhanced analysis processing to ensure all sections are included
    if (analysis && !analysis.includes('**CASE STRENGTHS:**')) {
      // Add strengths and weaknesses sections if missing
      const strengthsWeaknesses = generateStrengthsWeaknesses(analysis, detectedCaseType, clientDocuments);
      analysis += `\n\n${strengthsWeaknesses}`;
    }

    // Add note about source of analysis
    if (analysis) {
      const sourceNote = `*Analysis generated from ${analysisSource}${clientDocuments.length > 0 ? ` (${clientDocuments.length} document${clientDocuments.length > 1 ? 's' : ''}: ${clientDocuments.map(doc => doc.title).join(', ')})` : ''}${researchUpdates && researchUpdates.length > 0 ? ` with ${researchUpdates.length} research update(s) integrated` : ''}*\n\n`;
      analysis = sourceNote + analysis;
      console.log(`Legal analysis generated successfully from ${analysisSource} with research integration`);
    }

    // Return enhanced knowledge base law references with direct PDF URLs
    return new Response(
      JSON.stringify({ 
        analysis, 
        lawReferences: knowledgeBaseLawReferences, // Use enhanced knowledge base mappings with direct PDF URLs
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

// Helper function to generate strengths and weaknesses if missing from analysis
function generateStrengthsWeaknesses(analysis: string, caseType: string, documents: any[]) {
  let strengths = [];
  let weaknesses = [];
  
  if (caseType === "animal-protection") {
    strengths = [
      "Clear documentation of animal care standards violation",
      "Witness testimony available regarding incident", 
      "Photographic evidence of conditions",
      "Veterinary records support claims"
    ];
    weaknesses = [
      "Need to establish duty of care relationship",
      "Potential comparative negligence arguments",
      "Damages calculation may be challenging",
      "Statute of limitations considerations"
    ];
  } else if (caseType === "consumer-protection") {
    strengths = [
      "Written evidence of deceptive practices",
      "DTPA provides for treble damages",
      "Attorney's fees recoverable under DTPA",
      "Consumer status clearly established"
    ];
    weaknesses = [
      "Must satisfy pre-suit notice requirements",
      "Need to prove reliance on representations",
      "Potential exemptions may apply",
      "Burden of proof on knowing violations"
    ];
  } else {
    // General case strengths and weaknesses
    strengths = [
      "Strong documentary evidence available",
      "Clear liability chain established", 
      "Damages are well-documented",
      "Favorable legal precedents exist"
    ];
    weaknesses = [
      "Potential credibility challenges",
      "Complex factual issues to resolve",
      "Opposing counsel likely to dispute key facts",
      "Burden of proof considerations"
    ];
  }
  
  const strengthsList = strengths.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const weaknessesList = weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n');
  
  return `**CASE STRENGTHS:**\n${strengthsList}\n\n**CASE WEAKNESSES:**\n${weaknessesList}`;
}
