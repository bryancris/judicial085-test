import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { searchRelevantLaw } from "./services/lawSearchService.ts";
import { fetchClientDocuments } from "./services/clientDocumentsService.ts";
import { extractLegalTopics, detectCaseType } from "./utils/legalTopicsExtractor.ts";
import { buildSystemPrompt } from "./prompts/systemPromptBuilder.ts";
import { extractLegalCitations } from "./services/citationExtractionService.ts";
import { mapCitationsToKnowledgeBase } from "./services/knowledgeBaseMappingService.ts";
import { generateStrengthsWeaknesses } from "./services/strengthsWeaknessesGenerator.ts";
import { generateLegalAnalysis } from "../shared/geminiService.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to extract research updates from existing analysis content
function extractResearchUpdatesFromContent(content: string): any[] {
  const researchUpdates = [];
  const updatePattern = /\*\*RESEARCH UPDATE.*?\*\*(.*?)(?=\*\*[A-Z\s]+:\*\*|$)/gs;
  
  let match;
  while ((match = updatePattern.exec(content)) !== null) {
    const updateContent = match[1].trim();
    
    // Extract statutes and topics if possible
    const statuteMatches = updateContent.match(/(?:Texas [A-Z][a-zA-Z\s&]+ Code §|§)\s*[\d\.\-A-Za-z]+/g) || [];
    const topicMatches = updateContent.match(/\b(?:DTPA|consumer protection|deceptive practices|animal cruelty|premises liability)\b/gi) || [];
    
    researchUpdates.push({
      content: updateContent,
      statutes: statuteMatches,
      topics: topicMatches.map(t => t.toLowerCase()),
      section: 'relevant sections'
    });
  }
  
  return researchUpdates;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Force redeployment to pick up updated environment variables

  try {
    // Safely parse request body
    let payload: any = null;
    try {
      payload = await req.json();
    } catch (e: any) {
      console.error('Invalid JSON payload:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body', details: e?.message || String(e) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { clientId, conversation, caseId, researchUpdates, researchFocus, requestContext, existingAnalysisContext } = payload || {};

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: clientId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log secret availability (booleans only for security)
    const secretStatus = {
      gemini: !!Deno.env.get('GEMINI_API_KEY'),
      openai: !!Deno.env.get('OPENAI_API_KEY'),
      perplexity: !!Deno.env.get('PERPLEXITY_API_KEY')
    };
    console.log('🔐 Secret availability:', secretStatus);
    
    // Extract user ID from the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client to get user info
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.0");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing', { hasUrl: !!supabaseUrl, hasServiceKey: !!supabaseServiceKey });
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: missing Supabase URL or Service Role Key." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Failed to get user from token:', userError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`Authenticated user ID: ${userId}`);

    // 🎯 NEW: Fetch case metadata if caseId is provided for domain locking
    let domainHint = null;
    let caseMetadata = null;
    if (caseId) {
      try {
        const { data: caseData, error: caseError } = await supabase
          .from("cases")
          .select("case_type, case_title, case_description")
          .eq("id", caseId)
          .single();
        
        if (caseError) {
          console.warn(`Could not fetch case metadata for ${caseId}:`, caseError);
        } else if (caseData) {
          caseMetadata = caseData;
          domainHint = caseData.case_type;
          console.log(`🔒 Domain lock engaged for case ${caseId}: ${domainHint}`);
          console.log(`📋 Case metadata:`, { 
            case_type: caseData.case_type, 
            title: caseData.case_title?.substring(0, 50) 
          });
        }
      } catch (error) {
        console.warn(`Error fetching case metadata:`, error);
      }
    }

    // 🎯 NEW: Orchestrate 3-agent pipeline first, with fallback to direct analysis
    const isInternalLegalResearch = researchFocus === 'legal-analysis';
    if (!isInternalLegalResearch) {
      console.log('🎯 Starting 3-agent coordination for client:', clientId);
      
      try {
        // Build research query from conversation with domain context
        let researchQuery = conversation && conversation.length > 0
          ? conversation.slice(-5).map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')
          : 'Analyze client legal situation and provide comprehensive analysis';

        // Add domain reminder if we have case metadata
        if (domainHint) {
          researchQuery += `\n\nIMPORTANT: This is a ${domainHint} case. Focus research and analysis within this domain.`;
        }

        console.log('📋 Calling ai-agent-coordinator with query length:', researchQuery.length);

        // Call the 3-agent coordinator
        const coordinatorResponse = await supabase.functions.invoke('ai-agent-coordinator', {
          body: {
            query: researchQuery,
            clientId,
            caseId,
            researchTypes: ['legal-research', 'current-research', 'similar-cases'],
            requestContext,
            domainHint // Pass domain hint to coordinator
          },
          headers: {
            Authorization: authHeader
          }
        });

        if (coordinatorResponse.data?.success && coordinatorResponse.data?.synthesizedContent) {
          console.log('✅ 3-agent coordination successful, using synthesized content');
          
          // Save the 3-agent analysis to database
          const analysisToSave = coordinatorResponse.data.synthesizedContent;
          const { error: saveError } = await supabase
            .from('legal_analyses')
            .insert({
              client_id: clientId,
              case_id: caseId || null,
              content: analysisToSave,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              analysis_type: '3-agent-coordination',
              case_type: domainHint || 'general',
              user_id: userId,
              research_updates: researchUpdates || []
            });

          if (saveError) {
            console.error('Error saving 3-agent analysis:', saveError);
          }

          return new Response(
            JSON.stringify({
              analysis: analysisToSave,
              lawReferences: coordinatorResponse.data.researchSources || [],
              documentsUsed: [],
              metadata: {
                provider: '3-agent-coordinator',
                sources: coordinatorResponse.data.researchSources?.length || 0,
                citations: coordinatorResponse.data.citations?.length || 0,
                domainLocked: !!domainHint
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.warn('⚠️ 3-agent coordination failed or returned no content, falling back to direct analysis');
          console.warn('Coordinator error:', coordinatorResponse.error);
        }
      } catch (coordinatorError: any) {
        console.warn('⚠️ 3-agent coordinator failed, falling back to direct analysis:', coordinatorError.message);
      }
    } else {
      console.log('↪️ Skipping 3-agent coordination (internal legal-research request from coordinator).');
    }

    // 🔄 FALLBACK: Direct Gemini analysis (existing logic)
    console.log('🔄 Falling back to direct Gemini analysis');
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Gemini API key is not configured for fallback');
      return new Response(
        JSON.stringify({ error: 'Both 3-agent coordination and fallback analysis failed: Gemini API key missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the request details for debugging and validate content
    const factPatternPreview = conversation && conversation.length > 0 
      ? conversation.map(msg => msg.content).join(' ').substring(0, 200)
      : "No conversation provided";
    
    console.log(`Generating legal analysis for client: ${clientId}${caseId ? `, case: ${caseId}` : ''}`);
    console.log(`Conversation length: ${conversation?.length || 0}`);
    console.log("📝 Fact pattern preview:", factPatternPreview);
    console.log(`Research updates to integrate: ${researchUpdates?.length || 0}`);
    if (domainHint) {
      console.log(`🔒 Domain locked to: ${domainHint}`);
    }

    // Skip fetching old research updates to prevent contamination from previous cases
    let existingResearchUpdates = [];
    console.log('Skipping old research updates to prevent case contamination');

    // Check if we have a conversation provided
    const hasProvidedConversation = conversation && conversation.length > 0;
    console.log(`Has provided conversation: ${hasProvidedConversation}`);

    // Initialize conversation data
    let conversationMessages = conversation || [];

    // If no conversation provided or empty, try to fetch client messages
    if (!hasProvidedConversation) {
      console.log("No conversation provided, fetching client messages from database");
      try {
        // First try to get case-specific messages if caseId is provided
        let messageQuery = supabase
          .from("client_messages")
          .select("*")
          .eq("client_id", clientId);

        if (caseId) {
          console.log(`Trying to fetch case-specific messages for case: ${caseId}`);
          messageQuery = messageQuery.eq("case_id", caseId);
          // 🎯 NEW: For case-specific runs, do NOT apply time limit to avoid drift
          console.log("📅 Case-specific run: fetching ALL messages (no 24h limit)");
        } else {
          console.log(`Fetching client-level messages (case_id IS NULL)`);
          messageQuery = messageQuery.is("case_id", null);
          // Keep time filter only for client-level runs
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          messageQuery = messageQuery.gte('created_at', oneDayAgo);
          console.log("📅 Client-level run: applying 24h message filter");
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
          // If no case-specific messages found, fallback to client-level messages (but still recent)
          console.log("No case-specific messages found, falling back to recent client-level messages");
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: clientMessages, error: clientError } = await supabase
            .from("client_messages")
            .select("*")
            .eq("client_id", clientId)
            .is("case_id", null)
            .gte('created_at', oneDayAgo)
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
    
    // 🎯 NEW: Override detected case type with domain hint if available
    let detectedCaseType = detectCaseType(legalContext);
    if (domainHint) {
      console.log(`🔄 Overriding detected case type '${detectedCaseType}' with domain hint '${domainHint}'`);
      detectedCaseType = domainHint;
    }
    console.log(`Final case type: ${detectedCaseType}`);
    
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

    // Detect if this is a consumer protection case
    const isConsumerCase = detectedCaseType === "consumer-protection";
    console.log(`Case identified as consumer protection case: ${isConsumerCase}`);
    
    // Create system prompt with research updates integration and domain hint
    const systemPrompt = buildSystemPrompt(
      analysisSource,
      relevantLawReferences,
      hasConversation,
      clientDocuments,
      detectedCaseType,
      researchUpdates,
      domainHint // Pass domain hint to system prompt
    );

    // Format the content for Gemini's 2M context window - include ALL available information
    let userContent = "";
    
    // Add existing analysis context if available
    if (existingAnalysisContext) {
      userContent += existingAnalysisContext + "\n\n";
    }
    
    if (hasConversation) {
      // 🎯 NEW: When domain locked to consumer-protection, filter out clearly unrelated content
      let filteredMessages = conversationMessages;
      if (domainHint === 'consumer-protection') {
        const irrelevantKeywords = ['dog', 'bite', 'animal', 'pet', 'german shepherd', 'mail carrier', 'premises liability', 'property code', 'trespass to try title'];
        filteredMessages = conversationMessages.filter(msg => {
          const content = (msg.content || '').toLowerCase();
          const hasIrrelevant = irrelevantKeywords.some(k => content.includes(k));
          if (hasIrrelevant) {
            console.log(`🚫 Filtering out message with irrelevant content for consumer case: ${content.substring(0, 50)}...`);
          }
          return !hasIrrelevant;
        });
        console.log(`🔍 Consumer domain filter: ${conversationMessages.length} → ${filteredMessages.length} messages`);
      }
      
      const formattedConversation = filteredMessages.map(msg => ({
        role: "user", 
        content: `${msg.role.toUpperCase()}: ${msg.content}`
      }));
      userContent = "ATTORNEY-CLIENT CONVERSATION FOR ANALYSIS:\n\n" + formattedConversation.map(msg => msg.content).join("\n\n");
      
      // If we have both conversation AND documents, include both (leveraging 2M context)
      if (clientDocuments.length > 0) {
        userContent += "\n\nRELATED CLIENT DOCUMENTS:\n\n";
        userContent += clientDocuments.map((doc, index) => 
          `DOCUMENT ${index + 1}: ${doc.title}\n${doc.content}`
        ).join('\n\n');
      }
    } else {
      userContent = `CLIENT DOCUMENTS FOR COMPREHENSIVE ANALYSIS:\n\n${clientDocuments.map((doc, index) => 
        `DOCUMENT ${index + 1}: ${doc.title}\nFull Content:\n${doc.content}`
      ).join('\n\n')}`;
    }

    // Filter research updates to only include relevant ones for this case
    const relevantResearchUpdates = (researchUpdates || []).filter(update => {
      const content = (update.content || '').toLowerCase();
      const statutes = ((update.statutes || []).join(' ')).toLowerCase();
      const topics = ((update.topics || []).join(' ')).toLowerCase();
      const combined = `${content} ${statutes} ${topics}`;
      
      // 🎯 NEW: Stronger filtering when domain locked to consumer-protection
      if (domainHint === 'consumer-protection') {
        const irrelevantKeywords = ['animal', 'dog', 'bite', 'health and safety code § 822', 'dangerous animal', 'premises liability', 'property code', 'trespass to try title', 'adverse possession', 'encroachment'];
        const hasIrrelevant = irrelevantKeywords.some(keyword => combined.includes(keyword));
        if (hasIrrelevant) {
          console.log(`🚫 Filtering out research update with irrelevant content for consumer case`);
        }
        return !hasIrrelevant;
      }
      
      // Original filtering for other cases
      const irrelevantKeywords = ['animal', 'dog', 'bite', 'health and safety code § 822', 'dangerous animal'];
      const hasIrrelevantContent = irrelevantKeywords.some(keyword => combined.includes(keyword));
      return !hasIrrelevantContent;
    });
    
    console.log(`Filtered research updates: ${researchUpdates?.length || 0} → ${relevantResearchUpdates.length} relevant updates`);
    
    // Add research updates context if available
    if (relevantResearchUpdates.length > 0) {
      userContent += "\n\nIMPORTANT: The following research updates should be integrated into the appropriate sections of your analysis:\n\n";
      relevantResearchUpdates.forEach((update, index) => {
        userContent += `RESEARCH UPDATE ${index + 1} (Target: ${update.section || 'relevant sections'}):\n`;
        userContent += `Statutes: ${update.statutes ? update.statutes.join(', ') : 'N/A'}\n`;
        userContent += `Topics: ${update.topics ? update.topics.join(', ') : 'N/A'}\n`;
        userContent += `Content: ${update.content}\n\n`;
      });
      userContent += "Please integrate the specific statute details and legal information from these research updates into the relevant sections of your analysis instead of keeping them as separate updates.";
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ];

    console.log(`🚀 Sending request to Gemini with ${analysisSource} context and ${relevantResearchUpdates.length} relevant research updates`);
    console.log(`📊 Context size: ${userContent.length} characters, System prompt: ${systemPrompt.length} characters`);

    // Initialize analysis variable outside try block
    let analysis = '';

    try {
      // Use Gemini's 2M token context to process entire case files without chunking
      const geminiResponse = await generateLegalAnalysis(
        userContent,
        systemPrompt,
        geminiApiKey,
        {
          temperature: 0.3, // Lower temperature for consistent legal analysis
          maxTokens: 8192   // Increased for comprehensive analysis
        }
      );

      // Extract the analysis from Gemini response
      analysis = geminiResponse.text || '';
      
      // Log token usage for cost tracking
      if (geminiResponse.usage) {
        console.log('📈 Gemini Usage:', geminiResponse.usage);
        console.log('💰 Estimated cost:', 
          `$${((geminiResponse.usage.totalTokens / 1000000) * 1.25).toFixed(4)}`);
      }

      console.log('✅ Successfully generated analysis from Gemini');
      console.log('💰 Estimated cost: $' + (geminiResponse.usage?.totalTokens * 0.00000125 || 0).toFixed(4));
      
      // Validate generated content matches input context
      const generatedPreview = analysis.substring(0, 200);
      console.log("🔍 Generated content preview:", generatedPreview);
      
      // 🎯 NEW: Enhanced domain guardrail for consumer protection cases
      if (domainHint === 'consumer-protection' || isConsumerCase) {
        const propertyIndicators = ['texas property code', 'trespass to try title', 'adverse possession', 'encroach', 'easement', 'deed', 'fixture', 'premises liability'];
        const consumerIndicators = ['debt', 'collection', 'fdcpa', 'dtpa', 'finance code', 'harass', 'garnishment', 'validation', 'deceptive trade practices'];
        const containsProperty = propertyIndicators.some(k => analysis.toLowerCase().includes(k));
        const containsConsumer = consumerIndicators.some(k => analysis.toLowerCase().includes(k));
        
        if (containsProperty && !containsConsumer) {
          console.warn('⚠️ DOMAIN VIOLATION: Generated property/premises content for consumer-protection case. Retrying with hard constraint...');
          const strongConstraint = `\n\nCRITICAL DOMAIN CONSTRAINT: This is a consumer protection/debt collection matter (DTPA/FDCPA). You MUST NOT include real estate/property law content (e.g., Texas Property Code, trespass to try title, encroachment, adverse possession, easements, premises liability) under any circumstances. Focus EXCLUSIVELY on DTPA (Bus. & Com. Code § 17.41 et seq.), Texas Finance Code Ch. 392 (TDCA), and FDCPA. If the facts mention property or premises, ignore those aspects and focus only on consumer protection violations.`;
          const retryResponse = await generateLegalAnalysis(
            userContent,
            systemPrompt + strongConstraint,
            geminiApiKey,
            { temperature: 0.2, maxTokens: 8192 }
          );
          if (retryResponse?.text) {
            analysis = retryResponse.text;
            console.log('✅ Domain constraint retry successful. Replaced with consumer-focused content.');
          }
        } else {
          console.log('✅ Domain validation passed - content appropriate for consumer protection case');
        }
      }

    } catch (error: any) {
      console.error('❌ Gemini API error:', error);
      const status = error?.statusCode || 500;
      const rawDetails = typeof error?.response === 'string' 
        ? error.response 
        : JSON.stringify(error?.response || error?.message || '');
      const details = rawDetails?.slice ? rawDetails.slice(0, 500) : rawDetails;

      // Handle specific error types with user-friendly messages
      let errorMessage = 'Failed to generate legal analysis';
      const msg = (error?.message || '').toString();
      if (msg.includes('429')) {
        errorMessage = 'API rate limit exceeded. Please wait a few minutes and try again.';
      } else if (msg.includes('401')) {
        errorMessage = 'API authentication failed. Please check your Gemini API key configuration.';
      } else if (msg.toLowerCase().includes('quota')) {
        errorMessage = 'API quota exceeded. Please check your Gemini API usage limits.';
      }

      return new Response(
        JSON.stringify({ error: errorMessage, status, details }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure we have analysis content before proceeding
    if (!analysis || analysis.trim().length === 0) {
      console.error('❌ No analysis content generated');
      return new Response(
        JSON.stringify({ error: 'No analysis content was generated. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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
      const domainNote = domainHint ? ` (domain-locked to ${domainHint})` : '';
      const sourceNote = `*Analysis generated from ${analysisSource}${domainNote}${clientDocuments.length > 0 ? ` (${clientDocuments.length} document${clientDocuments.length > 1 ? 's' : ''}: ${clientDocuments.map(doc => doc.title).join(', ')})` : ''}${relevantResearchUpdates.length > 0 ? ` with ${relevantResearchUpdates.length} research update(s) integrated` : ''}*\n\n`;
      analysis = sourceNote + analysis;
      console.log(`Legal analysis generated successfully from ${analysisSource} with domain lock: ${domainHint}`);
    }

    // Save the analysis to the database with proper user association and domain hint
    try {
      // Get the current timestamp
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Save the analysis with the correct user ID from authentication
      const analysisData = {
        client_id: clientId,
        case_id: caseId || null, // Important: Use the provided case ID or null for client-level
        content: analysis,
        case_type: domainHint || detectedCaseType, // Prefer domain hint over detection
        law_references: knowledgeBaseLawReferences,
        timestamp: timestamp,
        user_id: userId // Use the authenticated user's ID instead of clientId
      };

      console.log("Saving analysis to database with data:", {
        client_id: analysisData.client_id,
        case_id: analysisData.case_id,
        case_type: analysisData.case_type,
        has_content: !!analysisData.content,
        content_length: analysisData.content.length,
        user_id: analysisData.user_id,
        domain_locked: !!domainHint
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
        caseType: domainHint || detectedCaseType, // Prefer domain hint over detection
        analysisSource,
        metadata: {
          domainLocked: !!domainHint,
          domainHint: domainHint,
          provider: 'gemini-direct'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in generate-legal-analysis function:', error);
    const status = error?.status || 500;
    const details = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
    return new Response(
      JSON.stringify({ error: 'Internal server error while generating analysis', status, details }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
