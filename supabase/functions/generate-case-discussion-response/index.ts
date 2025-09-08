
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders, getEnvVars } from "./config.ts";
import { 
  getSupabaseClients, 
  fetchClientData, 
  fetchLegalAnalysis,
  fetchAttorneyNotes,
  fetchClientMessages,
  saveCaseDiscussion 
} from "./clientDataService.ts";
import { fetchClientDocuments } from "./services/clientDocumentsService.ts";
import { buildCompleteContext } from "./contextBuilders/index.ts";
import { generateGeminiCaseDiscussion } from "./geminiService.ts";
import { detectResearchNeed, formatResearchQuery } from "./researchDetection.ts";
import { performPerplexityResearch } from "./perplexityService.ts";
import { formatEnhancedResearchResponse } from "./responseFormatter.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { clientId, message, previousMessages, userId } = await req.json();

    // Log crucial parameters
    console.log(`Request received with clientId: ${clientId}`);
    console.log(`Message: ${message?.substring(0, 50)}...`);
    console.log(`Previous messages count: ${previousMessages?.length || 0}`);
    console.log(`User ID: ${userId || 'not provided'}`);

    if (!clientId || !message || !userId) {
      console.error('Missing required parameters', { clientId, message: !!message, userId });
      return new Response(
        JSON.stringify({ error: 'Client ID, message, and user ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing case discussion for client: ${clientId}`);

    // Initialize Supabase clients
    const { supabase, supabaseAdmin } = getSupabaseClients();
    
    // Fetch client data using admin client to bypass RLS
    const { clientData, clientError } = await fetchClientData(supabaseAdmin, clientId);
    
    if (clientError || !clientData) {
      console.error('Error fetching client data:', clientError);
      
      // Return a graceful error response 
      return new Response(
        JSON.stringify({ 
          response: "I'm sorry, I couldn't access this client's information. Please check if the client exists or try again later.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          error: clientError ? clientError.message : 'Client data not found'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use admin client for all data fetching to bypass RLS restrictions
    const analysisData = await fetchLegalAnalysis(supabaseAdmin, clientId);
    const notesData = await fetchAttorneyNotes(supabaseAdmin, clientId);
    const messagesData = await fetchClientMessages(supabaseAdmin, clientId);
    
    // Fetch client documents for context
    const documentsData = await fetchClientDocuments(clientId);
    console.log(`Fetched ${documentsData.length} documents for client context`);

    // Build context for AI
    const contextText = buildCompleteContext(
      clientData, 
      clientError, 
      analysisData, 
      notesData, 
      messagesData,
      documentsData
    );
    
    console.log(`Context text length: ${contextText.length} characters`);
    console.log('First 200 characters of context:', contextText.substring(0, 200));

    console.log(`Generating case discussion response with Gemini for client: ${clientId}`);

    // Check if the message needs research
    const researchTrigger = detectResearchNeed(message, previousMessages);
    console.log(`Research detection result:`, researchTrigger);

    let researchResult = null;
    let enhancedResponse = "";
    let savedResearchId = null;

    // Perform research if needed
    if (researchTrigger.needsResearch && researchTrigger.confidence >= 0.6) {
      try {
        console.log(`🔍 Performing ${researchTrigger.researchType} research...`);
        const researchQuery = formatResearchQuery(
          researchTrigger.extractedQuery, 
          researchTrigger.researchType, 
          clientData
        );
        
        researchResult = await performPerplexityResearch(researchQuery, researchTrigger.researchType);
        console.log(`✅ Research completed, content length: ${researchResult.content.length}`);

        // Check for similar existing research to avoid duplicates
        try {
          const { data: similarResearch, error: similarError } = await supabaseAdmin
            .rpc('find_similar_research', {
              client_id_param: clientId,
              search_type_param: researchTrigger.researchType,
              query_param: researchResult.query,
              similarity_threshold: 0.7
            });

          if (!similarError && similarResearch && similarResearch.length > 0) {
            console.log(`📋 Found ${similarResearch.length} similar research entries`);
            // Optionally use existing research or combine with new research
          }
        } catch (similarErr) {
          console.warn('Non-critical error checking similar research:', similarErr);
        }

        // Save research to database (will be linked to message later)
        try {
          const { data: savedResearch, error: saveError } = await supabaseAdmin
            .from('perplexity_research')
            .insert({
              client_id: clientId,
              legal_analysis_id: null, // Will be linked to analysis later if needed
              search_type: researchTrigger.researchType,
              query: researchResult.query,
              content: researchResult.content,
              model: researchResult.model,
              usage_data: researchResult.usage,
              citations: researchResult.rawCitations, // Use raw citations array for database
              metadata: {
                confidence: researchResult.confidence,
                researchMetadata: researchResult.researchMetadata,
                timestamp: new Date().toISOString()
              }
            })
            .select('id')
            .single();

          if (saveError) {
            console.warn('Non-critical error saving research:', saveError);
          } else {
            savedResearchId = savedResearch?.id;
            console.log('✅ Research saved to database with ID:', savedResearchId);
          }
        } catch (saveErr) {
          console.warn('Non-critical error saving research:', saveErr);
        }
      } catch (researchError) {
        console.warn('Research failed, continuing with regular response:', researchError);
      }
    }

    // Generate AI response using Gemini's 2M context window
    const aiResponse = await generateGeminiCaseDiscussion(contextText, previousMessages, message);

    // Enhanced response with research if available
    if (researchResult) {
      enhancedResponse = formatEnhancedResearchResponse(aiResponse, researchResult);
    } else {
      enhancedResponse = aiResponse;
    }

    // Format timestamp for consistency
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Save attorney's message using admin client
    const { data: attorneyMessage, error: saveAttorneyError } = await saveCaseDiscussion(
      supabaseAdmin, 
      clientId, 
      userId, 
      message, 
      'attorney', 
      timestamp
    );

    if (saveAttorneyError) {
      console.warn('Non-critical error saving attorney message:', saveAttorneyError);
    }

    // Save AI's response using admin client
    const { data: aiMessage, error: saveAIError } = await saveCaseDiscussion(
      supabaseAdmin, 
      clientId, 
      userId, 
      enhancedResponse, 
      'ai', 
      timestamp
    );

    if (saveAIError) {
      console.warn('Non-critical error saving AI response:', saveAIError);
    }

    // Link research to the AI message if both were saved successfully
    if (savedResearchId && aiMessage && !saveAIError) {
      try {
        const { error: linkError } = await supabaseAdmin
          .from('perplexity_research')
          .update({
            case_discussion_id: aiMessage.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', savedResearchId);

        if (linkError) {
          console.warn('Non-critical error linking research to message:', linkError);
        } else {
          console.log('✅ Research linked to AI message');
        }
      } catch (linkErr) {
        console.warn('Non-critical error linking research:', linkErr);
      }
    }

    // Return response with research indicators
    return new Response(
      JSON.stringify({ 
        response: enhancedResponse,
        timestamp: timestamp,
        hasResearch: !!researchResult,
        researchType: researchResult ? researchTrigger.researchType : null,
        researchId: savedResearchId,
        confidence: researchResult ? researchResult.confidence : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in generate-case-discussion-response:', error);
    // Return a user-friendly error message
    return new Response(
      JSON.stringify({ 
        response: "I'm sorry, I encountered an unexpected error. Please try again or contact support if the issue persists.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: error.message
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
