
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { searchRelevantLaw } from "./services/lawSearchService.ts";
import { fetchClientDocuments } from "./services/clientDocumentsService.ts";
import { extractLegalTopics, detectCaseType } from "./utils/legalTopicsExtractor.ts";
import { buildSystemPrompt } from "./prompts/systemPromptBuilder.ts";
import { extractLegalCitations } from "./services/citationExtractionService.ts";
import { mapCitationsToKnowledgeBase } from "./services/knowledgeBaseMappingService.ts";
import { generateStrengthsWeaknesses } from "./services/strengthsWeaknessesGenerator.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Check if we have a conversation provided
    const hasProvidedConversation = conversation && conversation.length > 0;
    console.log(`Has provided conversation: ${hasProvidedConversation}`);

    // Initialize conversation data
    let conversationMessages = conversation || [];

    // If no conversation provided or empty, try to fetch client messages
    if (!hasProvidedConversation) {
      console.log("No conversation provided, fetching client messages from database");
      try {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.0");
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // First try to get case-specific messages if caseId is provided
        let messageQuery = supabase
          .from("client_messages")
          .select("*")
          .eq("client_id", clientId);

        if (caseId) {
          console.log(`Trying to fetch case-specific messages for case: ${caseId}`);
          messageQuery = messageQuery.eq("case_id", caseId);
        } else {
          console.log(`Fetching client-level messages (case_id IS NULL)`);
          messageQuery = messageQuery.is("case_id", null);
        }

        const { data: dbMessages, error: messageError } = await messageQuery
          .order("created_at", { ascending: true });

        if (messageError) {
          console.error("Error fetching messages:", messageError);
        } else if (dbMessages && dbMessages.length > 0) {
          console.log(`Found ${dbMessages.length} messages in database`);
          conversationMessages = dbMessages.map(msg => ({
            content: msg.content,
            timestamp: msg.timestamp,
            role: msg.role
          }));
        } else if (caseId) {
          // If no case-specific messages found, fallback to client-level messages
          console.log("No case-specific messages found, falling back to client-level messages");
          const { data: clientMessages, error: clientError } = await supabase
            .from("client_messages")
            .select("*")
            .eq("client_id", clientId)
            .is("case_id", null)
            .order("created_at", { ascending: true });

          if (clientError) {
            console.error("Error fetching client messages:", clientError);
          } else if (clientMessages && clientMessages.length > 0) {
            console.log(`Found ${clientMessages.length} client-level messages for fallback`);
            conversationMessages = clientMessages.map(msg => ({
              content: msg.content,
              timestamp: msg.timestamp,
              role: msg.role
            }));
          }
        }
      } catch (dbError) {
        console.error("Database error when fetching messages:", dbError);
      }
    }

    // Determine if we have a conversation after fetching
    const hasConversation = conversationMessages && conversationMessages.length > 0;
    console.log(`Final conversation status: ${hasConversation}, length: ${conversationMessages?.length || 0}`);

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
      legalContext = extractLegalTopics(conversationMessages);
      analysisSource = caseId && !hasProvidedConversation ? "client conversation (used for case analysis)" : "client conversation";
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
      const formattedConversation = conversationMessages.map(msg => ({
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

    // Save the analysis to the database with proper case association
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.0");
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get the current timestamp
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Save the analysis with the correct case association
      const analysisData = {
        client_id: clientId,
        case_id: caseId || null, // Important: Use the provided case ID or null for client-level
        content: analysis,
        case_type: detectedCaseType,
        law_references: knowledgeBaseLawReferences,
        timestamp: timestamp,
        user_id: clientId // Using clientId as user_id for now
      };

      console.log("Saving analysis to database with data:", {
        client_id: analysisData.client_id,
        case_id: analysisData.case_id,
        case_type: analysisData.case_type,
        has_content: !!analysisData.content,
        content_length: analysisData.content.length
      });

      const { data: savedAnalysis, error: saveError } = await supabase
        .from('legal_analyses')
        .insert([analysisData])
        .select()
        .single();

      if (saveError) {
        console.error('Error saving analysis to database:', saveError);
        // Don't fail the entire request, just log the error
      } else {
        console.log('Analysis saved successfully to database with ID:', savedAnalysis.id);
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // Don't fail the entire request, just log the error
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
