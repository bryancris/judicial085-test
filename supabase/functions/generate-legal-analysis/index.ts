import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { searchRelevantLaw } from "./services/lawSearchService.ts";
import { fetchClientDocuments } from "./services/clientDocumentsService.ts";
import { extractLegalTopics, detectCaseType } from "./utils/legalTopicsExtractor.ts";
import { buildSystemPrompt } from "./prompts/systemPromptBuilder.ts";
import { extractLegalCitations } from "./services/citationExtractionService.ts";
import { mapCitationsToKnowledgeBase } from "./services/knowledgeBaseMappingService.ts";
import { generateStrengthsWeaknesses } from "./services/strengthsWeaknessesGenerator.ts";
import { generateLegalAnalysis } from "../shared/openAiService.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const { clientId, conversation, caseId, researchUpdates, researchFocus, requestContext, existingAnalysisContext, stepType } = payload || {};

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
    
    // Extract user ID from the authorization header (optional)
    const authHeader = req.headers.get('authorization');

    // Create Supabase client (service role) for DB operations and optional auth parsing
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

    // Get user from JWT token if provided, but don't hard-fail if missing/invalid
    let userId: string | null = null;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) {
          console.warn('Proceeding without authenticated user (invalid token).');
        } else {
          userId = user.id;
        }
      } catch (e) {
        console.warn('Auth parsing failed, proceeding anonymously:', e);
      }
    } else {
      console.warn('No authorization header found. Proceeding without user context.');
    }

    if (userId) {
      console.log(`Authenticated user ID: ${userId}`);
    } else {
      console.log('Running analysis without authenticated user context.');
    }

// Remove domain locking - let analysis be fact-based
console.log('📋 Analyzing facts without domain constraints');

// Prepare conversation messages early (use provided or fetch from DB)
const hasProvidedConversation = Array.isArray(conversation) && conversation.length > 0;
let conversationMessages = hasProvidedConversation ? conversation : [];
let hasConversation = conversationMessages.length > 0;
if (!hasConversation) {
  console.log("No conversation provided, fetching client messages from database");
  try {
    let messageQuery = supabase.from("client_messages").select("*").eq("client_id", clientId);
    if (caseId) {
      console.log(`Trying to fetch case-specific messages for case: ${caseId}`);
      messageQuery = messageQuery.eq("case_id", caseId);
      console.log("📅 Case-specific run: fetching ALL messages (no 24h limit)");
    } else {
      console.log(`Fetching client-level messages (case_id IS NULL)`);
      messageQuery = messageQuery.is("case_id", null);
      console.log("📅 Client-level run: fetching ALL messages (no time filter)");
    }
    const { data: dbMessages, error: messageError } = await messageQuery.order("created_at", { ascending: true });
    if (messageError) {
      console.error("Error fetching messages:", messageError);
    } else if (dbMessages && dbMessages.length > 0) {
      console.log(`Found ${dbMessages.length} messages in database`);
      conversationMessages = dbMessages.map(msg => ({ content: msg.content, timestamp: msg.timestamp, role: msg.role }));
      hasConversation = conversationMessages.length > 0;
    } else if (caseId) {
      // Fallback: use client-level conversation if no case-specific messages found
      console.log("No case-specific messages found. Falling back to client-level messages (case_id IS NULL)");
      const { data: clientLevelMsgs, error: clientLevelError } = await supabase
        .from("client_messages").select("*")
        .eq("client_id", clientId)
        .is("case_id", null)
        .order("created_at", { ascending: true });
      if (clientLevelError) {
        console.error("Error fetching client-level messages:", clientLevelError);
      } else if (clientLevelMsgs && clientLevelMsgs.length > 0) {
        console.log(`Found ${clientLevelMsgs.length} client-level messages`);
        conversationMessages = clientLevelMsgs.map(msg => ({ content: msg.content, timestamp: msg.timestamp, role: msg.role }));
        hasConversation = conversationMessages.length > 0;
      }
    }
  } catch (dbError) {
    console.error("Database error when fetching messages:", dbError);
  }
}
console.log(`Final conversation status: ${hasConversation}, length: ${conversationMessages?.length || 0}`);

// 🔥 FACT SUFFICIENCY GATE: Block generation if insufficient facts
const conversationText = conversationMessages.map(m => m.content || '').join(' ');
const hasSubstantialFacts = hasConversation && conversationText.length > 100;
console.log("Fact sufficiency check:", {
  hasConversation,
  conversationLength: conversationText.length,
  hasSubstantialFacts,
  documentCount: 0 // Will be set later after document fetch
});

    // 🛡️ Route preliminary analysis to OpenAI directly
    const forceSkipForPreliminary = (stepType === 'preliminary-analysis');
    const skipCoordinator = forceSkipForPreliminary || payload?.skipCoordinator === true;
    
    // For preliminary analysis, use OpenAI directly instead of Gemini
    if (stepType === 'preliminary-analysis') {
      console.log('🤖 Routing preliminary analysis to OpenAI processor...');
      
      try {
        const openaiResponse = await supabase.functions.invoke('openai-legal-step-processor', {
          body: {
            stepNumber: 2,
            stepType: 'PRELIMINARY_ANALYSIS',
            workflowState: {
              context: { query: conversationText, clientId, caseId },
              stepResults: { step1: { content: conversationText } }
            },
            context: JSON.stringify({ documents: [], analysis: null }),
            authHeader
          },
          headers: authHeader ? { Authorization: authHeader } : {}
        });
        
        if (openaiResponse.data?.success) {
          console.log('✅ OpenAI preliminary analysis successful');
          const result = openaiResponse.data.result;
          
          const factSources = hasConversation
            ? [{ type: 'conversation', source: 'Client intake and conversation' }]
            : [];
          
          const citations = extractLegalCitations(result.content || '');
          
          return new Response(
            JSON.stringify({
              analysis: result.content,
              lawReferences: [],
              documentsUsed: [],
              factSources,
              citations,
              caseType: detectCaseType(result.content || ''),
              analysisSource: 'openai-preliminary',
              metadata: {
                provider: 'openai',
                model: result.model,
                stepType: 'preliminary-analysis',
                factBasedAnalysis: true
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.warn('⚠️ OpenAI preliminary analysis failed, falling back to Gemini');
        }
      } catch (openaiError: any) {
        console.warn('⚠️ OpenAI preliminary analysis error, falling back to Gemini:', openaiError.message);
      }
    }

if (!skipCoordinator) {
      console.log('🎯 Starting 3-agent coordination for client:', clientId);
      
      try {
        // Build research query from actual fact pattern (use last 10 messages for focus)
        const msgsForQuery = (conversationMessages || []).slice(-10);
        const researchQuery = msgsForQuery.length > 0
          ? msgsForQuery.map((m: any) => `${m.role}: ${m.content}`).join('\n')
          : 'No conversation available. Analyze uploaded documents and generate a fact-based legal analysis.';

        console.log('📋 Calling ai-agent-coordinator with query length:', researchQuery.length);

        // Call the 3-agent coordinator
        const coordinatorResponse = await supabase.functions.invoke('ai-agent-coordinator', {
          body: {
            query: researchQuery,
            clientId,
            caseId,
            researchTypes: ['legal-research', 'current-research', 'similar-cases'],
            requestContext
          },
          headers: authHeader ? { Authorization: authHeader } : {}
        });

        if (coordinatorResponse.data?.success && coordinatorResponse.data?.synthesizedContent) {
          console.log('✅ 3-agent coordination successful, using synthesized content');
          const synthesized = coordinatorResponse.data.synthesizedContent || '';

          // Guard: Block IRAC output for preliminary-analysis when coming from coordinator
          if (stepType === 'preliminary-analysis') {
            const iracDetectionPatterns = [
              /\*\*ISSUE\s*\[?\d*\]?\s*:\*\*/i,
              /\*\*ISSUE\s*\[.*?\]\*\*/i,
              /\*\*RULE\s*:\*\*/i,
              /\*\*APPLICATION\s*:\*\*/i,
              /\*\*CONCLUSION\s*:\*\*/i,
              /\*\*IRAC.*ANALYSIS\*\*/i,
              /IRAC LEGAL ANALYSIS/i
            ];
            const iracFound = iracDetectionPatterns.some(p => p.test(synthesized));
            if (iracFound) {
              console.error('🚫 CRITICAL: Coordinator produced IRAC content for Step 2 preliminary analysis!');
              console.error('Content preview:', synthesized.substring(0, 200));
              return new Response(
                JSON.stringify({ 
                  error: "IRAC format detected in Step 2 preliminary analysis. Step 2 must use preliminary format only.",
                  code: "IRAC_NOT_ALLOWED_STEP_2"
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            } else {
              // 🚫 DISABLED: Prevent coordinator from saving unvalidated analyses
              console.log('📋 Skipping coordinator analysis save to prevent data pollution');

              // Build fact sources and citations for validator
              const factSources = hasConversation
                ? [{ type: 'conversation', source: 'Client intake and conversation' }]
                : [];

              // Use coordinator citations if provided, otherwise extract from content
              const coordinatorCitations = Array.isArray(coordinatorResponse.data.citations)
                ? coordinatorResponse.data.citations
                : extractLegalCitations(synthesized || '');

              const citationsForValidation = (coordinatorCitations || []).map((c: any) =>
                typeof c === 'string'
                  ? { citation: c, type: 'statute', jurisdiction: 'Texas' }
                  : c
              );

              console.log(`📋 Coordinator return: ${factSources.length} fact sources, ${citationsForValidation.length} citations`);

              return new Response(
                JSON.stringify({
                  analysis: synthesized,
                  lawReferences: coordinatorResponse.data.researchSources || [],
                  documentsUsed: [],
                  factSources,
                  citations: citationsForValidation,
                  caseType: detectCaseType(synthesized || ''),
                  analysisSource: hasConversation ? 'client conversation' : 'coordinator',
                  metadata: {
                    provider: '3-agent-coordinator',
                    sources: coordinatorResponse.data.researchSources?.length || 0,
                    citations: citationsForValidation.length,
                    factBasedAnalysis: true
                  }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } else {
            // Non-preliminary steps can return coordinator content as-is
            console.log('📋 Skipping coordinator analysis save to prevent data pollution');

            const factSources = hasConversation
              ? [{ type: 'conversation', source: 'Client intake and conversation' }]
              : [];

            const coordinatorCitations = Array.isArray(coordinatorResponse.data.citations)
              ? coordinatorResponse.data.citations
              : extractLegalCitations(synthesized || '');

            const citationsForValidation = (coordinatorCitations || []).map((c: any) =>
              typeof c === 'string'
                ? { citation: c, type: 'statute', jurisdiction: 'Texas' }
                : c
            );

            console.log(`📋 Coordinator return: ${factSources.length} fact sources, ${citationsForValidation.length} citations`);

            return new Response(
              JSON.stringify({
                analysis: synthesized,
                lawReferences: coordinatorResponse.data.researchSources || [],
                documentsUsed: [],
                factSources,
                citations: citationsForValidation,
                caseType: detectCaseType(synthesized || ''),
                analysisSource: hasConversation ? 'client conversation' : 'coordinator',
                metadata: {
                  provider: '3-agent-coordinator',
                  sources: coordinatorResponse.data.researchSources?.length || 0,
                  citations: citationsForValidation.length,
                  factBasedAnalysis: true
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          console.warn('⚠️ 3-agent coordination failed or returned no content, falling back to direct analysis');
          console.warn('Coordinator error:', coordinatorResponse.error);
        }
      } catch (coordinatorError: any) {
        console.warn('⚠️ 3-agent coordinator failed, falling back to direct analysis:', coordinatorError.message);
      }
    } else {
      console.log('🛡️ Skipping coordinator to prevent recursion - direct analysis mode');
    }

    // 🔄 FALLBACK: Direct OpenAI analysis (replacing expensive Gemini)
    console.log('🔄 Falling back to direct OpenAI analysis');
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key is not configured for fallback');
      return new Response(
        JSON.stringify({ error: 'Both 3-agent coordination and fallback analysis failed: OpenAI API key missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

// Log the request details for debugging and validate content
const factPatternPreview = hasConversation 
  ? conversationMessages.map((msg: any) => msg.content).join(' ').substring(0, 200)
  : "No conversation provided";

console.log(`Generating legal analysis for client: ${clientId}${caseId ? `, case: ${caseId}` : ''}`);
console.log(`Conversation length: ${conversationMessages?.length || 0}`);
console.log("📝 Fact pattern preview:", factPatternPreview);
console.log(`Research updates to integrate: ${researchUpdates?.length || 0}`);
console.log('📋 Fact-based analysis mode enabled');
    // Fetch client-specific documents (filtered by case if provided)
    let clientDocuments = [];
    try {
      clientDocuments = await fetchClientDocuments(clientId, caseId);
      console.log(`Retrieved ${clientDocuments.length} documents for analysis`);
    } catch (documentError) {
      console.error("Error fetching client documents:", documentError);
    }

    // Enhanced fact sufficiency gate with documents
    const hasDocuments = clientDocuments && clientDocuments.length > 0;
    // Reuse previously computed conversationText/hasSubstantialFacts
    console.log("Enhanced fact sufficiency check:", {
      hasConversation,
      conversationLength: conversationText.length,
      hasSubstantialFacts,
      hasDocuments,
      documentCount: clientDocuments.length
    });
    
    if (!hasSubstantialFacts && !hasDocuments) {
      console.log("❌ BLOCKING: Insufficient facts for analysis");
      return new Response(
        JSON.stringify({ 
          error: "Insufficient facts for legal analysis. Please provide more details about the case or upload relevant documents.",
          code: "INSUFFICIENT_FACTS"
        }),
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
    
    // Let case type be detected from facts, not forced
    let detectedCaseType = detectCaseType(legalContext);
    console.log(`Detected case type from facts: ${detectedCaseType}`);
    
    // Create a search query from the extracted topics
    const searchQuery = [
      ...legalContext.topics,
      ...legalContext.statutes,
      ...legalContext.cases
    ].join(" ");
    
// 🚨 CRITICAL STEP TYPE DETERMINATION - NO FALLBACKS TO WRONG TYPES
let effectiveStepType: string;

// STRICT step type validation - prevent ANY possibility of IRAC for Step 2
if (stepType === 'preliminary-analysis') {
  effectiveStepType = 'preliminary-analysis';
  console.log('🟢 CONFIRMED: Using preliminary-analysis for Step 2');
} else if (stepType === 'irac-analysis' || stepType === 'step-5') {
  effectiveStepType = 'irac-analysis';
  console.log('🟠 CONFIRMED: Using irac-analysis for Step 5');
} else if (stepType === 'risk-assessment') {
  effectiveStepType = 'risk-assessment';
  console.log('🔵 CONFIRMED: Using risk-assessment for Step 6');
} else if (stepType === 'issues-assessment' || stepType === 'strengths-weaknesses') {
  effectiveStepType = 'irac-analysis'; // These build on IRAC
  console.log('🟣 CONFIRMED: Using irac-analysis for', stepType);
} else {
  // 🚫 NO DEFAULT FALLBACK - FORCE ERROR FOR UNKNOWN STEP TYPES
  console.error(`🚨 INVALID STEP TYPE: '${stepType}' - Rejecting request`);
  return new Response(
    JSON.stringify({ 
      error: `Invalid stepType: '${stepType}'. Must be 'preliminary-analysis', 'irac-analysis', 'risk-assessment', etc.`,
      code: "INVALID_STEP_TYPE",
      allowedTypes: ['preliminary-analysis', 'irac-analysis', 'risk-assessment', 'issues-assessment', 'strengths-weaknesses']
    }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

console.log(`🎯 STEP TYPE ROUTING: stepType='${stepType}' → effectiveStepType='${effectiveStepType}'`);
    
    // Initialize relevant law references - Get ACTUAL law references, not document names
    let relevantLawReferences = [];
    if (effectiveStepType !== 'preliminary-analysis') {
      // Only search law references for detailed analysis steps
      try {
        const factPattern = legalContext.facts || conversation.map(m => m.message).join(" ");
        relevantLawReferences = await searchRelevantLaw(factPattern, legalContext?.topics || []);
        console.log(`📚 Found ${relevantLawReferences.length} relevant Texas law references from comprehensive database`);
        console.log("Law references found:", relevantLawReferences.map(ref => ref.title));
      } catch (error) {
        console.error("❌ Error searching comprehensive Texas law database:", error);
      }
    } else {
      console.log('⏭️ Skipping law reference search for preliminary analysis');
    }

    // Detect if this is a consumer protection case
    const isConsumerCase = detectedCaseType === "consumer-protection";
    console.log(`Case identified as consumer protection case: ${isConsumerCase}`);
    
    // effectiveStepType already determined above for guardrails and prompt selection
    
    // Create step-aware system prompt
    const systemPrompt = buildSystemPrompt(
      analysisSource,
      relevantLawReferences,
      hasConversation,
      clientDocuments,
      detectedCaseType,
      researchUpdates,
      effectiveStepType
    );

    // Format the content for Gemini's 2M context window - include ALL available information
    let userContent = "";
    
    // Add existing analysis context if available
    if (existingAnalysisContext) {
      userContent += existingAnalysisContext + "\n\n";
    }
    
    if (hasConversation) {
      // Use all conversation messages without domain filtering
      const formattedConversation = conversationMessages.map(msg => ({
        role: "user", 
        content: `${msg.role.toUpperCase()}: ${msg.content}`
      }));
      userContent = "ATTORNEY-CLIENT CONVERSATION FOR ANALYSIS:\n\n" + formattedConversation.map(msg => msg.content).join("\n\n");
      
      // If we have both conversation AND documents, include both only for non-preliminary steps
      if (clientDocuments.length > 0 && effectiveStepType !== 'preliminary-analysis') {
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

    // Use all provided research updates (no domain-based filtering)
    const relevantResearchUpdates = (researchUpdates || []);
    
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

    console.log(`🚀 Sending request to OpenAI with ${analysisSource} context and ${relevantResearchUpdates.length} relevant research updates`);
    console.log(`📊 Context size: ${userContent.length} characters, System prompt: ${systemPrompt.length} characters`);

    // Initialize analysis variable outside try block
    let analysis = '';

    try {
      // Use OpenAI's advanced language processing to analyze legal content
      const openaiResponse = await generateLegalAnalysis(
        userContent,
        systemPrompt
      );

      // Extract the analysis from OpenAI response
      analysis = openaiResponse.text || '';
      
      // Log token usage for cost tracking
      if (openaiResponse.usage) {
        console.log('📈 OpenAI Usage:', openaiResponse.usage);
        console.log('💰 Estimated cost:', 
          `$${((openaiResponse.usage.totalTokens / 1000000) * 7.5).toFixed(4)}`);
      }

      console.log('✅ Successfully generated analysis from OpenAI');
      console.log('Starting enhanced citation extraction from analysis...');

      
      // Validate generated content matches input context
      const generatedPreview = analysis.substring(0, 200);
      console.log("🔍 Generated content preview:", generatedPreview);
      
      // 🎯 NEW: Enhanced domain guardrail for consumer protection cases
      if (isConsumerCase) {
        const propertyIndicators = ['texas property code', 'trespass to try title', 'adverse possession', 'encroach', 'easement', 'deed', 'fixture', 'premises liability'];
        const consumerIndicators = ['debt', 'collection', 'fdcpa', 'dtpa', 'finance code', 'harass', 'garnishment', 'validation', 'deceptive trade practices'];
        const containsProperty = propertyIndicators.some(k => analysis.toLowerCase().includes(k));
        const containsConsumer = consumerIndicators.some(k => analysis.toLowerCase().includes(k));
        
        if (containsProperty && !containsConsumer) {
          console.warn('⚠️ DOMAIN VIOLATION: Generated property/premises content for consumer-protection case. Retrying with hard constraint...');
          const strongConstraint = `\n\nCRITICAL DOMAIN CONSTRAINT: This is a consumer protection/debt collection matter (DTPA/FDCPA). You MUST NOT include real estate/property law content (e.g., Texas Property Code, trespass to try title, encroachment, adverse possession, easements, premises liability) under any circumstances. Focus EXCLUSIVELY on DTPA (Bus. & Com. Code § 17.41 et seq.), Texas Finance Code Ch. 392 (TDCA), and FDCPA. If the facts mention property or premises, ignore those aspects and focus only on consumer protection violations.`;
          const retryResponse = await generateLegalAnalysis(
            userContent,
            systemPrompt + strongConstraint
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
      console.error('❌ OpenAI API error:', error);
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
        errorMessage = 'API authentication failed. Please check your OpenAI API key configuration.';
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
      const sourceNote = `*Analysis generated from ${analysisSource}${clientDocuments.length > 0 ? ` (${clientDocuments.length} document${clientDocuments.length > 1 ? 's' : ''}: ${clientDocuments.map(doc => doc.title).join(', ')})` : ''}${relevantResearchUpdates.length > 0 ? ` with ${relevantResearchUpdates.length} research update(s) integrated` : ''}*\n\n`;
      analysis = sourceNote + analysis;
      console.log(`Legal analysis generated successfully from ${analysisSource}`);
    }

    // 🔥 POST-GENERATION HYPOTHETICAL DETECTOR: Block generic content
    if (analysis) {
      const hypotheticalPatterns = [
        'hypothetical', 'illustrative scenario', 'without specific facts',
        'for example, a car accident', 'generic legal analysis', 'theoretical case',
        'sample case', 'typical situation'
      ];
      
      const lowerAnalysis = analysis.toLowerCase();
      const foundHypotheticalPattern = hypotheticalPatterns.find(pattern => 
        lowerAnalysis.includes(pattern)
      );
      
      if (foundHypotheticalPattern) {
        console.log(`❌ BLOCKING: Hypothetical content detected: "${foundHypotheticalPattern}"`);
        return new Response(
          JSON.stringify({ 
            error: "Generated analysis appears to be hypothetical or generic. Please provide more specific case facts.",
            code: "HYPOTHETICAL_CONTENT"
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 🚫 REMOVE ALL DIRECT DATABASE WRITES - Let client route through validation service
    console.log("✅ Analysis generated successfully - returning to client for validation");
    console.log("Generated analysis length:", analysis?.length || 0);
    console.log("Source:", analysisSource, "Case type:", detectedCaseType);

// 🚫 ABSOLUTE ZERO-TOLERANCE IRAC BLOCKING FOR STEP 2
if (effectiveStepType === 'preliminary-analysis') {
  console.log('🔍 Scanning Step 2 content for ANY IRAC violations...');
  
  const iracDetectionPatterns = [
    /\*\*ISSUE\s*\[?\d*\]?\s*:\*\*/i,
    /\*\*ISSUE\s*\[.*?\]\s*:\*\*/i,
    /\*\*RULE\s*:\s*\*\*/i,
    /\*\*APPLICATION\s*:\s*\*\*/i,
    /\*\*CONCLUSION\s*:\s*\*\*/i,
    /IRAC\s+ANALYSIS/i,
    /IRAC\s+LEGAL\s+ANALYSIS/i,
    /##\s*IRAC/i,
    /ISSUE\s*\[\d+\]/i,
    /detailed\s+legal\s+analysis/i,
    /statutory\s+analysis/i,
    /case\s+law\s+analysis/i
  ];
  
  for (const pattern of iracDetectionPatterns) {
    if (pattern.test(analysis || '')) {
      console.error(`🚨 STEP 2 IRAC VIOLATION DETECTED: Pattern '${pattern}' found in preliminary analysis`);
      console.error('Analysis content preview:', analysis?.substring(0, 500));
      
      return new Response(
        JSON.stringify({ 
          error: `CRITICAL ERROR: Step 2 generated IRAC format content. Pattern found: ${pattern}. Step 2 must ONLY use preliminary analysis format with POTENTIAL LEGAL AREAS, PRELIMINARY ISSUES, RESEARCH PRIORITIES, and STRATEGIC NOTES.`,
          code: "STEP_2_IRAC_VIOLATION",
          violatingPattern: pattern.toString(),
          allowedFormat: "preliminary-analysis"
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
  
  console.log('✅ Step 2 content passed IRAC validation check');
}

// 🚫 CRITICAL: Block IRAC content for other non-IRAC steps
if (effectiveStepType !== 'irac-analysis' && effectiveStepType !== 'preliminary-analysis') {
  const iracDetectionPatterns = [
    /\*\*ISSUE\s*\[?\d*\]?\s*:\*\*/i,
    /\*\*RULE\s*:\s*\*\*/i,
    /\*\*APPLICATION\s*:\s*\*\*/i,
    /\*\*CONCLUSION\s*:\s*\*\*/i,
    /IRAC\s+LEGAL\s+ANALYSIS/i
  ];
  
  const foundIracPattern = iracDetectionPatterns.find(pattern => 
    pattern.test(analysis || '')
  );
  
  if (foundIracPattern) {
    console.error(`🚫 IRAC VIOLATION: Step ${effectiveStepType} produced IRAC content!`);
    return new Response(
      JSON.stringify({ 
        error: `IRAC format detected in ${effectiveStepType} step. Found: ${foundIracPattern}`,
        code: "IRAC_NOT_ALLOWED"
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

    // Extract fact sources and citations for validation
    const factSources = analysisSource === 'client conversation' ? 
      [{ type: 'conversation', source: 'Client intake and conversation' }] : 
      clientDocuments.map(doc => ({ type: 'document', source: doc.title || doc.id }));
    
    const citationsForValidation = extractedCitations.map(citation => ({
      citation: citation,
      type: 'statute',
      jurisdiction: 'Texas'
    }));
    
    console.log(`📋 Returning extracted data: ${factSources.length} fact sources, ${citationsForValidation.length} citations`);

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
        factSources: factSources,
        citations: citationsForValidation,
        caseType: detectedCaseType,
        analysisSource,
        metadata: {
          provider: 'gemini-direct'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in generate-legal-analysis function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        analysis: '',
        lawReferences: [],
        documentsUsed: [],
        factSources: [],
        citations: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// 🗑️ REMOVED: transformIracToPreliminary - NO FALLBACK TRANSFORMATIONS
// IRAC is ONLY for Step 5. All other steps must produce their own format.
// This function has been removed to prevent any IRAC fallbacks.
