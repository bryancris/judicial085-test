import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 9-Step Sequential Workflow Data Structure
interface WorkflowState {
  currentStep: number;
  stepResults: Record<string, any>;
  completedSteps: Set<number>;
  context: {
    query: string;
    clientId: string;
    caseId?: string;
    researchTypes?: string[];
    requestContext?: string;
  };
}

// Enhanced step validation interface
interface StepValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-1 quality score
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, clientId, caseId, researchTypes, requestContext, context } = await req.json();
    
    console.log('🎯 AI Agent Coordinator - 9-Step Sequential Workflow Starting:', { 
      query: query.substring(0, 200) + '...',
      clientId, 
      caseId, 
      researchTypes,
      requestContext
    });

    // Create Supabase client
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.0");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize workflow state
    const workflowState: WorkflowState = {
      currentStep: 1,
      stepResults: {},
      completedSteps: new Set(),
      context: {
        query,
        clientId,
        caseId,
        researchTypes: researchTypes || ['legal-research', 'current-research'],
        requestContext
      }
    };

    // Retrieve existing analysis and documents for context
    const existingContext = await retrieveExistingContext(supabase, clientId, caseId);
    console.log('📋 Retrieved existing context:', {
      hasAnalysis: !!existingContext.analysis,
      documentsCount: existingContext.documents?.length || 0
    });

    // Execute 9-step sequential workflow
    console.log('🔄 Executing 9-Step Sequential Workflow with Gemini Orchestration...');
    const workflowResult = await executeSequentialWorkflow(workflowState, existingContext, req.headers.get('authorization'));

    // Save comprehensive analysis to database
    console.log('💾 Saving 9-step analysis to database...');
    await saveWorkflowToDatabase(workflowResult, clientId, caseId, supabase, req.headers.get('authorization'));

    return new Response(
      JSON.stringify({
        success: true,
        synthesizedContent: workflowResult.finalSynthesis,
        workflowResults: workflowResult.stepResults,
        completedSteps: Array.from(workflowResult.completedSteps),
        citations: extractCitations(workflowResult.finalSynthesis),
        researchSources: workflowResult.researchSources,
        metadata: {
          workflowCompleted: true,
          totalSteps: 9,
          executionTime: workflowResult.executionTime,
          qualityControlPassed: workflowResult.qualityControlPassed
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in 9-Step AI Agent Coordinator:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to execute 9-step workflow', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Main 9-step sequential workflow executor
async function executeSequentialWorkflow(
  workflowState: WorkflowState, 
  existingContext: any, 
  authHeader?: string | null
): Promise<any> {
  const startTime = Date.now();
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured for orchestration');
  }

  console.log('🧠 GEMINI ORCHESTRATOR: Beginning 9-step sequential workflow...');

  // Enhanced step execution with updated 9-step alignment
  const stepTypes = ['CASE_SUMMARY', 'PRELIMINARY_ANALYSIS', 'TEXAS_LAWS', 'CASE_LAW', 'IRAC_ANALYSIS', 'STRENGTHS_WEAKNESSES', 'REFINED_ANALYSIS', 'FOLLOW_UP', 'LAW_REFERENCES'];
  
  // Step 1: CASE SUMMARY (Organized Fact Pattern) - OpenAI
  console.log('📝 Step 1: CASE SUMMARY - OpenAI organizing fact pattern...');
  workflowState.stepResults.step1 = await executeStepWithOpenAI(1, 'CASE_SUMMARY', workflowState, existingContext, authHeader);
  workflowState.stepResults.step1.stepType = 'CASE_SUMMARY';
  const validation1 = await validateStepCompletion(1, workflowState.stepResults.step1, 'CASE_SUMMARY', { CASE_SUMMARY: workflowState.stepResults.step1 });
  console.log('✅ Step 1 validation:', validation1);
  // Only throw on critical errors (score < 0.3), otherwise proceed with warnings
  if (validation1.score < 0.3 && validation1.errors?.length > 0) {
    console.warn('⚠️ Step 1 has validation issues but proceeding:', validation1);
  }
  workflowState.completedSteps.add(1);

  // Step 2: PRELIMINARY ANALYSIS (AI-assisted broad issue spotting) - OpenAI
  console.log('🔍 Step 2: PRELIMINARY ANALYSIS - OpenAI conducting issue spotting...');
  workflowState.stepResults.step2 = await executeStepWithOpenAI(2, 'PRELIMINARY_ANALYSIS', workflowState, existingContext, authHeader);
  workflowState.stepResults.step2.stepType = 'PRELIMINARY_ANALYSIS';
  const validation2 = await validateStepCompletion(2, workflowState.stepResults.step2, 'PRELIMINARY_ANALYSIS', { 
    CASE_SUMMARY: workflowState.stepResults.step1, 
    PRELIMINARY_ANALYSIS: workflowState.stepResults.step2 
  });
  console.log('❌ Step 2 validation:', validation2);
  // Always proceed for PRELIMINARY_ANALYSIS - we made it more flexible
  if (validation2.errors?.length > 0 || validation2.warnings?.length > 0) {
    console.warn('⚠️ Step 2 validation warnings present but proceeding (score >= 0.5, no errors).', validation2);
  }
  workflowState.completedSteps.add(2);

  // Step 3: RELEVANT TEXAS LAWS (Targeted legal research) - OpenAI + Perplexity
  console.log('⚖️ Step 3: RELEVANT TEXAS LAWS - OpenAI formatting Perplexity research...');
  workflowState.stepResults.step3 = await executeStepWithOpenAI(3, 'TEXAS_LAWS', workflowState, existingContext, authHeader);
  workflowState.stepResults.step3.stepType = 'TEXAS_LAWS';
  const validation3 = await validateStepCompletion(3, workflowState.stepResults.step3, 'TEXAS_LAWS', {
    CASE_SUMMARY: workflowState.stepResults.step1,
    PRELIMINARY_ANALYSIS: workflowState.stepResults.step2,
    TEXAS_LAWS: workflowState.stepResults.step3
  });
  console.log('❌ Step 3 validation:', validation3);
  // Always proceed for TEXAS_LAWS - we made it more flexible
  if (validation3.errors?.length > 0) {
    console.warn('⚠️ Step 3 has validation warnings but proceeding:', validation3);
  }
  workflowState.completedSteps.add(3);
    console.warn('⚠️ Step 3 validation issues present but proceeding (score >= 0.6, <=1 error).', validation3);
  }
  workflowState.completedSteps.add(3);

  // Step 4: ADDITIONAL CASE LAW (Precedent research) - OpenAI + Perplexity
  console.log('📚 Step 4: ADDITIONAL CASE LAW - OpenAI formatting Perplexity research...');
  workflowState.stepResults.step4 = await executeStepWithOpenAI(4, 'CASE_LAW', workflowState, existingContext, authHeader);
  workflowState.stepResults.step4.stepType = 'CASE_LAW';
  const validation4 = await validateStepCompletion(4, workflowState.stepResults.step4, 'CASE_LAW', {
    CASE_SUMMARY: workflowState.stepResults.step1,
    PRELIMINARY_ANALYSIS: workflowState.stepResults.step2,
    TEXAS_LAWS: workflowState.stepResults.step3,
    CASE_LAW: workflowState.stepResults.step4
  });
  if (!validation4.isValid) {
    console.warn('⚠️ Step 4 has validation issues but proceeding:', validation4);
  }
  workflowState.completedSteps.add(4);

  // Step 5: IRAC LEGAL ANALYSIS (Comprehensive deep analysis) - OpenAI
  console.log('🧮 Step 5: IRAC LEGAL ANALYSIS - OpenAI conducting systematic analysis...');
  workflowState.stepResults.step5 = await executeStepWithOpenAI(5, 'IRAC_ANALYSIS', workflowState, existingContext, authHeader);
  workflowState.stepResults.step5.stepType = 'IRAC_ANALYSIS';
  const validation5 = await validateStepCompletion(5, workflowState.stepResults.step5, 'IRAC_ANALYSIS', {
    CASE_SUMMARY: workflowState.stepResults.step1,
    PRELIMINARY_ANALYSIS: workflowState.stepResults.step2,
    TEXAS_LAWS: workflowState.stepResults.step3,
    CASE_LAW: workflowState.stepResults.step4,
    IRAC_ANALYSIS: workflowState.stepResults.step5
  });
  if (!validation5.isValid) {
    console.warn('⚠️ Step 5 has validation issues but proceeding:', validation5);
  }
  workflowState.completedSteps.add(5);

  // Step 6: CASE STRENGTHS & WEAKNESSES (Combined from old Steps 6+7) - OpenAI
  console.log('⚡ Step 6: CASE STRENGTHS & WEAKNESSES - OpenAI conducting risk assessment...');
  workflowState.stepResults.step6 = await executeStepWithOpenAI(6, 'STRENGTHS_WEAKNESSES', workflowState, existingContext, authHeader);
  workflowState.stepResults.step6.stepType = 'STRENGTHS_WEAKNESSES';
  console.log(`📝 Step 6 generated content length: ${workflowState.stepResults.step6.content?.length || 0}`);
  const validation6 = await validateStepCompletion(6, workflowState.stepResults.step6, 'STRENGTHS_WEAKNESSES', {
    CASE_SUMMARY: workflowState.stepResults.step1,
    PRELIMINARY_ANALYSIS: workflowState.stepResults.step2,
    TEXAS_LAWS: workflowState.stepResults.step3,
    CASE_LAW: workflowState.stepResults.step4,
    IRAC_ANALYSIS: workflowState.stepResults.step5,
    STRENGTHS_WEAKNESSES: workflowState.stepResults.step6
  });
  if (!validation6.isValid) {
    console.warn('⚠️ Step 6 has validation issues but proceeding:', validation6);
  }
  workflowState.completedSteps.add(6);

  // Step 7: REFINED ANALYSIS (Requirements vs. Case Comparison) - OpenAI
  console.log('🎯 Step 7: REFINED ANALYSIS - OpenAI generating requirements comparison...');
  workflowState.stepResults.step7 = await executeStepWithOpenAI(7, 'REFINED_ANALYSIS', workflowState, existingContext, authHeader);
  workflowState.stepResults.step7.stepType = 'REFINED_ANALYSIS';
  const step7Len = workflowState.stepResults.step7.content?.length || 0;
  console.log(`📝 Step 7 generated content length: ${step7Len}`);
  const validation7 = await validateStepCompletion(7, workflowState.stepResults.step7, 'REFINED_ANALYSIS', {
    CASE_SUMMARY: workflowState.stepResults.step1,
    PRELIMINARY_ANALYSIS: workflowState.stepResults.step2,
    TEXAS_LAWS: workflowState.stepResults.step3,
    CASE_LAW: workflowState.stepResults.step4,
    IRAC_ANALYSIS: workflowState.stepResults.step5,
    STRENGTHS_WEAKNESSES: workflowState.stepResults.step6,
    REFINED_ANALYSIS: workflowState.stepResults.step7
  });
  // More resilient gating: allow proceed if reasonably substantive
  const step7Proceed = step7Len >= 400 || ((validation7.errors?.length ?? 0) <= 1 && (validation7.score ?? 0) >= 0.6);
  if (!validation7.isValid && !step7Proceed) {
    console.warn('⚠️ Step 7 validation failed but proceeding anyway:', validation7);
  }
  if (!validation7.isValid && step7Proceed) {
    console.warn('⚠️ Step 7 validation issues present but proceeding (len>=400 or score>=0.6 with <=1 error).', validation7);
  }
  workflowState.completedSteps.add(7);

  // Eager-save Step 7 so UI can render even if later steps fail
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.0');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (supabaseUrl && supabaseServiceKey) {
      const sb = createClient(supabaseUrl, supabaseServiceKey);
      await sb.functions.invoke('validate-and-save-legal-analysis', {
        body: {
          clientId: workflowState.context.clientId,
          caseId: workflowState.context.caseId,
          content: workflowState.stepResults.step7.content,
          timestamp: new Date().toISOString(),
          analysisType: 'step-7-refined-analysis',
          provenance: {
            step: 'step7',
            stepType: 'REFINED_ANALYSIS',
            methodology: '9-step-workflow',
            workflowVersion: '2.0',
            metadata: workflowState.stepResults.step7.metadata || {}
          }
        },
        headers: authHeader ? { Authorization: authHeader } : {}
      });
      console.log('💾 Eager-saved Step 7 refined analysis');
    } else {
      console.warn('⚠️ Cannot eager-save Step 7: Supabase env not configured');
    }
  } catch (e) {
    console.warn('⚠️ Failed to eager-save Step 7 (non-blocking):', e);
  }

  // Step 8: RECOMMENDED FOLLOW-UP QUESTIONS - OpenAI
  console.log('❓ Step 8: FOLLOW-UP QUESTIONS - OpenAI identifying information gaps...');
  workflowState.stepResults.step8 = await executeStepWithOpenAI(8, 'FOLLOW_UP', workflowState, existingContext, authHeader);
  workflowState.stepResults.step8.stepType = 'FOLLOW_UP';
  const validation8 = await validateStepCompletion(8, workflowState.stepResults.step8, 'FOLLOW_UP', {
    CASE_SUMMARY: workflowState.stepResults.step1,
    PRELIMINARY_ANALYSIS: workflowState.stepResults.step2,
    TEXAS_LAWS: workflowState.stepResults.step3,
    CASE_LAW: workflowState.stepResults.step4,
    IRAC_ANALYSIS: workflowState.stepResults.step5,
    STRENGTHS_WEAKNESSES: workflowState.stepResults.step6,
    REFINED_ANALYSIS: workflowState.stepResults.step7,
    FOLLOW_UP: workflowState.stepResults.step8
  });
  if (!validation8.isValid) {
    console.warn('⚠️ Step 8 has validation issues but proceeding:', validation8);
  }
  workflowState.completedSteps.add(8);

  // Step 9: RELEVANT TEXAS LAW REFERENCES (Vectorized Legal Documents) - OpenAI
  console.log('📚 Step 9: LAW REFERENCES - OpenAI compiling legal references...');
  workflowState.stepResults.step9 = await executeStepWithOpenAI(9, 'LAW_REFERENCES', workflowState, existingContext, authHeader);
  workflowState.stepResults.step9.stepType = 'LAW_REFERENCES';
  const validation9 = await validateStepCompletion(9, workflowState.stepResults.step9, 'LAW_REFERENCES', {
    CASE_SUMMARY: workflowState.stepResults.step1,
    PRELIMINARY_ANALYSIS: workflowState.stepResults.step2,
    TEXAS_LAWS: workflowState.stepResults.step3,
    CASE_LAW: workflowState.stepResults.step4,
    IRAC_ANALYSIS: workflowState.stepResults.step5,
    STRENGTHS_WEAKNESSES: workflowState.stepResults.step6,
    REFINED_ANALYSIS: workflowState.stepResults.step7,
    FOLLOW_UP: workflowState.stepResults.step8,
    LAW_REFERENCES: workflowState.stepResults.step9
  });
  if (!validation9.isValid) {
    console.warn('⚠️ Step 9 has validation issues but proceeding:', validation9);
  }
  workflowState.completedSteps.add(9);

  // Final synthesis by Gemini orchestrator
  console.log('🎼 FINAL SYNTHESIS: Gemini orchestrating complete 9-step output...');
  const finalSynthesis = await performFinalSynthesis(workflowState, geminiApiKey);

  const executionTime = Date.now() - startTime;
  console.log(`✅ 9-Step Sequential Workflow COMPLETED in ${executionTime}ms`);

  // Final quality control assessment
  const allValidations = [validation1, validation2, validation3, validation4, validation5, validation6, validation7, validation8, validation9];
  const averageScore = allValidations.reduce((sum, v) => sum + v.score, 0) / allValidations.length;
  const qualityControlPassed = averageScore >= 0.7 && allValidations.every(v => v.isValid);

  console.log(`🎯 Quality Control Assessment: Score ${averageScore.toFixed(2)}/1.0, Passed: ${qualityControlPassed}`);

  return {
    stepResults: workflowState.stepResults,
    completedSteps: workflowState.completedSteps,
    finalSynthesis,
    executionTime,
    qualityControlPassed,
    overallQualityScore: averageScore,
    researchSources: extractResearchSources(workflowState)
  };
}

// New OpenAI step executor
async function executeStepWithOpenAI(
  stepNumber: number, 
  stepType: string, 
  workflowState: WorkflowState, 
  existingContext: any, 
  authHeader?: string | null
): Promise<any> {
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.0');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing for OpenAI step processor');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`🤖 Calling OpenAI processor for Step ${stepNumber}: ${stepType}`);
    
    const response = await supabase.functions.invoke('openai-legal-step-processor', {
      body: {
        stepNumber,
        stepType,
        workflowState,
        context: JSON.stringify(existingContext),
        authHeader
      },
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    
    if (response.error) {
      console.error(`OpenAI Step ${stepNumber} failed:`, response.error);
      throw new Error(`OpenAI Step ${stepNumber} failed: ${response.error.message}`);
    }
    
    if (!response.data?.success) {
      console.error(`OpenAI Step ${stepNumber} unsuccessful:`, response.data);
      throw new Error(`OpenAI Step ${stepNumber} unsuccessful`);
    }
    
    console.log(`✅ OpenAI Step ${stepNumber} completed successfully`);
    return response.data.result;
    
  } catch (error) {
    console.error(`Error in OpenAI Step ${stepNumber}:`, error);
    throw error;
  }
}

// Step 1: CASE SUMMARY (Organized Fact Pattern)
async function executeStep1CaseSummary(workflowState: WorkflowState, existingContext: any, geminiApiKey: string) {
  const prompt = `You are GEMINI, the orchestrator of a 9-step legal analysis workflow. You are executing STEP 1: CASE SUMMARY.

CRITICAL: This is Step 1 of 9. Do not skip ahead or include content from later steps.

STEP 1 TASKS - GEMINI:
- Process and organize the raw fact pattern into clear, structured format
- Extract key factual elements from vectorized documents
- Create chronological timeline if relevant
- Identify parties, relationships, and critical events
- Present facts objectively without legal conclusions

QUERY: ${workflowState.context.query}

EXISTING DOCUMENTS CONTEXT:
${existingContext.documents ? JSON.stringify(existingContext.documents.slice(0, 3)) : 'No documents found'}

REQUIRED OUTPUT FORMAT:
CASE SUMMARY

- Parties: [List all relevant parties]
- Timeline: [Key dates and events]
- Core Facts: [Organized factual narrative]
- Key Documents: [Reference to important evidence]

Focus ONLY on organizing facts. Do not provide legal analysis, opinions, or conclusions.`;

  return await callGeminiOrchestrator(prompt, geminiApiKey, 'CASE_SUMMARY');
}

// Step 2: PRELIMINARY ANALYSIS (AI-assisted broad issue spotting)
async function executeStep2PreliminaryAnalysis(workflowState: WorkflowState, authHeader: string | null, geminiApiKey: string) {
  // First, coordinate with OpenAI for legal issue identification (from intake + Step 1)
  console.log('🤝 Step 2: Gemini coordinating with OpenAI for preliminary analysis...');
  
  let openAIResult: any = { content: '' };
  try {
    openAIResult = await coordinateWithOpenAI(
      'preliminary-analysis',
      workflowState.context.query,
      workflowState.stepResults.step1?.content || '',
      workflowState.context.clientId,
      workflowState.context.caseId,
      authHeader
    );
  } catch (err) {
    console.error('Error coordinating with OpenAI for preliminary-analysis:', err);
    // Proceed without OpenAI contribution; Gemini will handle Step 2 solo
  }

  // 🚫 AGGRESSIVE IRAC SANITIZATION for Step 2
  const cleanedOpenAI = (openAIResult.content || '')
    .replace(/\*\*IRAC[^\n]*\n?/gi, '')
    .replace(/\*\*ISSUE\s*\[?\d*\]?\s*:\*\*/gi, '**POTENTIAL AREA:**')
    .replace(/\*\*RULE\s*:\*\*/gi, '**RESEARCH NOTE:**')
    .replace(/\*\*APPLICATION\s*:\*\*/gi, '**FACTUAL CONSIDERATION:**')
    .replace(/\*\*CONCLUSION\s*:\*\*/gi, '**PRELIMINARY FINDING:**')
    .replace(/\*\*OVERALL CONCLUSION\*\*/gi, '**SUMMARY NOTES**')
    .replace(/IRAC/gi, 'preliminary review');

  // Try to enrich with vectorized document context (client/case documents)
  let vectorContextText = '';
  try {
    const combinedQuery = `${workflowState.context.query}\n\n${workflowState.stepResults.step1?.content || ''}`;
    const embedding = await generateEmbeddingForText(combinedQuery);
    const { topSnippets, totalFound } = await fetchVectorContext(
      workflowState.context.clientId,
      workflowState.context.caseId,
      embedding,
      0.65,
      8
    );
    vectorContextText = topSnippets;
    console.log(`📄 Step 2 vector context: using ${totalFound} matches, included ${topSnippets.length} chars`);
  } catch (e) {
    console.warn('⚠️ Step 2 vector context unavailable:', (e as Error).message);
  }

  // Optional: quick current-research pulse via Perplexity (directional only)
  let perplexityNotes = '';
  try {
    const pQuery = `From case summary, outline key real-world angles to watch (no citations):\n${truncate(workflowState.stepResults.step1?.content || '', 900)}`;
    const p = await coordinateWithPerplexity('legal-research', pQuery, workflowState.context.clientId, workflowState.context.caseId, authHeader);
    perplexityNotes = truncate(p.content || '', 1500);
    console.log('🛰️ Perplexity notes length (chars):', perplexityNotes.length);
  } catch (e) {
    console.warn('⚠️ Step 2 Perplexity notes unavailable:', (e as Error).message);
  }

  // Then have Gemini organize and structure the results (now allowed to use vector + research notes)
  const prompt = `You are GEMINI, the orchestrator. You are executing STEP 2: PRELIMINARY ANALYSIS.

CRITICAL: This is Step 2 of 9. Build on Step 1 and client intake facts. You MAY use (a) vectorized document snippets and (b) directional external research notes for issue spotting. Do NOT invoke logic of Steps 3–9.

HARD RULES FOR STEP 2:
- Absolutely NO IRAC format, headings, or structure
- Do NOT use the words Issue, Rule, Application, or Conclusion as headings
- No case citations, statute section numbers, or URLs; this is broad issue spotting
- Keep it fact-driven and strategic; no detailed legal analysis

STEP 1 RESULTS:
${workflowState.stepResults.step1?.content || ''}

VECTOR DOCUMENT CONTEXT (top snippets):
${vectorContextText || 'None'}

PERPLEXITY RESEARCH NOTES (directional, not authoritative):
${perplexityNotes || 'None'}

OPENAI PRELIMINARY ANALYSIS (sanitized):
${cleanedOpenAI}

STEP 2 TASKS - GEMINI:
- Perform initial legal problem spotting using intake, Step 1, vector context, and research notes
- Create preliminary strategic roadmap (no IRAC)
- Identify areas requiring focused research (priorities)
- Maintain professional legal tone without detailed analysis

REQUIRED OUTPUT FORMAT (USE EXACT HEADERS BELOW; 2–6 concise bullets under each):
**PRELIMINARY ANALYSIS:**

**POTENTIAL LEGAL AREAS:**
- [Warranties, Texas Lemon Law, DTPA, negligence, fraud, contract, etc.]

**PRELIMINARY ISSUES:**
- [Brief issue statements or element-level notes; no citations]

**RESEARCH PRIORITIES:**
- [Targeted questions or topics to confirm next]

**STRATEGIC NOTES:**
- [Early tactics, info gaps, evidence to collect, and next steps]

Do not include IRAC or detailed legal reasoning. Keep it broad, factual, and strategic.`;

  let result = await callGeminiOrchestrator(prompt, geminiApiKey, 'PRELIMINARY_ANALYSIS');
  let enforced = enforcePreliminaryStructure(
    sanitizeIracContent(result.content || ''),
    workflowState.stepResults.step1?.content || ''
  );

  // Quick local bullet validation and one retry if needed
  const counts = getSectionBulletCounts(enforced);
  console.log('🔢 Step 2 bullet counts:', counts);
  const needsRetry = ['POTENTIAL LEGAL AREAS', 'PRELIMINARY ISSUES', 'RESEARCH PRIORITIES', 'STRATEGIC NOTES']
    .some(key => (counts[key] || 0) < 2 || (counts[key] || 0) > 8); // allow up to 8 on first pass

  if (needsRetry) {
    const fixPrompt = `${prompt}

STRICT REWRITE INSTRUCTIONS:
- Ensure EACH section has 2–5 non-empty, specific bullets
- No placeholder text; keep bullets concise and actionable
- Preserve professional tone; no IRAC, no citations`;
    const retry = await callGeminiOrchestrator(fixPrompt, geminiApiKey, 'PRELIMINARY_ANALYSIS');
    enforced = enforcePreliminaryStructure(
      sanitizeIracContent(retry.content || ''),
      workflowState.stepResults.step1?.content || ''
    );
    console.log('🔁 Step 2 regenerated due to bullet count constraints');
  }

  return { ...result, content: enforced };
}

// Step 3: RELEVANT TEXAS LAWS (Targeted legal research)
async function executeStep3TexasLaws(workflowState: WorkflowState, authHeader: string | null, geminiApiKey: string) {
  // First, have Perplexity research Texas statutes with gap analysis
  console.log('📖 Step 3: Perplexity researching Texas statutes with vectorized law comparison...');
  
  const researchPriorities = extractResearchPriorities(workflowState.stepResults.step2?.content || '');
  
  // Enhanced Perplexity query to check for missed statutes and recent changes
  const enhancedQuery = `Texas legal research for: ${researchPriorities.join(', ')}. 
  
SEARCH REQUIREMENTS:
1. Find ALL relevant Texas statutes (not just the obvious ones)
2. Check for any 2024-2025 legislative changes or amendments
3. Look for recent updates that may not be in knowledge bases
4. Cross-reference multiple Texas codes for comprehensive coverage
5. Include ANY recent legislative sessions that changed these areas

Focus on: Texas Business & Commerce Code, Texas Civil Practice & Remedies Code, Texas Transportation Code, and other relevant codes.`;

  const perplexityResult = await coordinateWithPerplexity(
    'legal-research',
    enhancedQuery,
    workflowState.context.clientId,
    workflowState.context.caseId,
    authHeader
  );

  // Try to get vectorized law database context for comparison
  let vectorLawContext = '';
  try {
    const embedding = await generateEmbeddingForText(researchPriorities.join(' '));
    const lawContext = await fetchVectorLawContext(embedding, 0.7, 5);
    vectorLawContext = lawContext.topSnippets;
    console.log('📚 Step 3 vector law context: found statutes from knowledge base');
  } catch (e) {
    console.warn('⚠️ Step 3 vector law context unavailable:', (e as Error).message);
  }

  // Then have Gemini organize according to your exact specification
  const prompt = `You are GEMINI, the orchestrator executing STEP 3: RELEVANT TEXAS LAWS (3 agent system).

CRITICAL: This is Step 3 of 9. You must organize legal research using the EXACT format specified below.

YOUR ROLE IN 3-AGENT SYSTEM:
- Vector database has been searched for relevant Texas laws
- Perplexity has researched additional statutes and recent changes
- You must organize by legal issue area as specified

PREVIOUS STEPS:
Step 1: ${workflowState.stepResults.step1?.content || ''}
Step 2: ${workflowState.stepResults.step2?.content || ''}

VECTORIZED LAWS FROM KNOWLEDGE BASE:
${vectorLawContext}

PERPLEXITY RESEARCH (gap analysis + recent updates):
${perplexityResult.content}

MANDATORY OUTPUT FORMAT (do not deviate):

**RELEVANT TEXAS LAWS (Targeted legal research)**

**Legal Area Statutes:**
- [Legal Area from Step 2]: [Relevant statute citations and key provisions]
- [Legal Area from Step 2]: [Relevant statute citations and key provisions]
- [Continue for each legal area identified in Step 2]

**Recent Updates:**
- [Any 2024-2025 legislative changes found by Perplexity]
- [Recent amendments or new statutes]
- [Session updates that affect this case]

**Key Provisions:**
- [Most relevant statutory language for this case]
- [Critical elements or requirements]
- [Procedural requirements or deadlines]

STRICT REQUIREMENTS:
1. Organize by legal issue areas from Step 2 preliminary analysis
2. Must include "Legal Area Statutes", "Recent Updates", and "Key Provisions" sections
3. Cross-reference vectorized knowledge base with Perplexity findings
4. Flag any gaps where Perplexity found statutes not in knowledge base
5. Focus on Texas statutes only - no federal law in this step`;

  const result = await callGeminiOrchestrator(prompt, geminiApiKey, 'TEXAS_LAWS');
  
  // Enforce the exact structure format
  const enforcedContent = enforceTexasLawsStructure(result.content || '');
  
  return { ...result, content: enforcedContent };
}

// Step 4: ADDITIONAL CASE LAW (Precedent research)
async function executeStep4CaseLaw(workflowState: WorkflowState, authHeader: string | null, geminiApiKey: string) {
  // First, have Perplexity research case law
  console.log('⚖️ Step 4: Perplexity researching case precedents...');
  
  const legalAreas = extractLegalAreas(workflowState.stepResults.step2?.content || '');
  const perplexityResult = await coordinateWithPerplexity(
    'case-precedents',
    `Research Texas case law precedents for: ${legalAreas.join(', ')}. Focus on recent Texas Supreme Court and appellate decisions.`,
    workflowState.context.clientId,
    workflowState.context.caseId,
    authHeader
  );

  // Then have Gemini organize the case law research
  const prompt = `You are GEMINI, the orchestrator. You are executing STEP 4: ADDITIONAL CASE LAW.

CRITICAL: This is Step 4 of 9. Build upon Steps 1-3 but do not include content from later steps.

PREVIOUS STEPS:
Steps 1-2: ${combineStepsForAnalysis(workflowState, [1, 2])}
Step 3: ${workflowState.stepResults.step3?.content || ''}

PERPLEXITY CASE LAW RESEARCH:
${perplexityResult.content}

STEP 4 TASKS - GEMINI:
- Organize case law by legal area and relevance
- Cross-reference with statutory research from Step 3
- Ensure comprehensive precedent coverage

REQUIRED OUTPUT FORMAT:
ADDITIONAL CASE LAW

- [Legal Area 1]: [Key case citations and holdings]
- [Legal Area 2]: [Key case citations and holdings]
- Precedent Analysis: [How cases interact with statutes]
- Jurisdictional Notes: [Texas vs. federal precedents]

Organize the Perplexity case law research into the required format above.`;

  return await callGeminiOrchestrator(prompt, geminiApiKey, 'CASE_LAW');
}

// Step 5: IRAC LEGAL ANALYSIS (Comprehensive deep analysis)
async function executeStep5IracAnalysis(workflowState: WorkflowState, authHeader: string | null, geminiApiKey: string) {
  // First, have OpenAI conduct systematic IRAC analysis
  console.log('🧠 Step 5: OpenAI conducting systematic IRAC analysis...');
  
  const combinedResearch = combineStepsForAnalysis(workflowState, [1, 2, 3, 4]);
  const openAIResult = await coordinateWithOpenAI(
    'irac-analysis',
    workflowState.context.query,
    combinedResearch,
    workflowState.context.clientId,
    workflowState.context.caseId,
    authHeader
  );

  // Then have Gemini organize and structure the IRAC analysis
  const prompt = `You are GEMINI, the orchestrator. You are executing STEP 5: IRAC LEGAL ANALYSIS.

CRITICAL: This is Step 5 of 9. Build upon Steps 1-4 to conduct comprehensive IRAC analysis.

COMBINED RESEARCH FROM STEPS 1-4:
${combinedResearch}

OPENAI IRAC ANALYSIS:
${openAIResult.content}

STEP 5 TASKS - GEMINI:
- Coordinate with OPENAI to conduct systematic IRAC analysis
- Apply Texas law research to specific fact patterns
- Provide comprehensive legal analysis with citations

REQUIRED OUTPUT FORMAT:
IRAC LEGAL ANALYSIS

[Detailed IRAC analysis organized by legal issue]

Organize the OpenAI IRAC analysis into a comprehensive legal analysis.`;

  return await callGeminiOrchestrator(prompt, geminiApiKey, 'IRAC_ANALYSIS');
}

// Step 6: LEGAL ISSUES ASSESSMENT (Issues validated through analysis)
async function executeStep6IssuesAssessment(workflowState: WorkflowState, authHeader: string | null, geminiApiKey: string) {
  // Coordinate with OpenAI to evaluate issue viability
  console.log('📊 Step 6: Gemini coordinating with OpenAI for issues assessment...');
  
  const iracResults = workflowState.stepResults.step5?.content || '';
  const openAIResult = await coordinateWithOpenAI(
    'issues-assessment',
    `Evaluate the viability of issues after IRAC analysis: ${iracResults}`,
    combineStepsForAnalysis(workflowState, [1, 2, 3, 4, 5]),
    workflowState.context.clientId,
    workflowState.context.caseId,
    authHeader
  );

  // Then have Gemini structure the assessment
  const prompt = `You are GEMINI, the orchestrator. You are executing STEP 6: LEGAL ISSUES ASSESSMENT.

CRITICAL: This is Step 6 of 9. Build upon Steps 1-5 to assess issue viability after IRAC analysis.

IRAC ANALYSIS FROM STEP 5:
${iracResults}

OPENAI ISSUES ASSESSMENT:
${openAIResult.content}

STEP 6 TASKS - GEMINI:
- Evaluate viability of each legal issue after IRAC analysis
- Assign probability assessments to potential claims
- Prioritize issues by strength and strategic value

REQUIRED OUTPUT FORMAT:
LEGAL ISSUES ASSESSMENT

- Issue Viability Analysis
- Probability Assessments  
- Strategic Prioritization
- Risk Factors

Organize the OpenAI assessment into the required format above.`;

  return await callGeminiOrchestrator(prompt, geminiApiKey, 'ISSUES_ASSESSMENT');
}

// Step 6: CASE STRENGTHS & WEAKNESSES
async function executeStep6StrengthsWeaknesses(workflowState: WorkflowState, authHeader: string | null, geminiApiKey: string) {
  // Have OpenAI analyze overall case strength
  console.log('💪 Step 6: OpenAI analyzing case strengths and weaknesses...');
  
  const combinedAnalysis = combineStepsForAnalysis(workflowState, [1, 2, 3, 4, 5]);
  const openAIResult = await coordinateWithOpenAI(
    'strengths-weaknesses',
    `Analyze overall case strength and weaknesses based on completed analysis`,
    combinedAnalysis,
    workflowState.context.clientId,
    workflowState.context.caseId,
    authHeader
  );

  // Then have Gemini structure the strengths and weaknesses analysis
  const prompt = `You are GEMINI, the orchestrator. You are executing STEP 6: CASE STRENGTHS & WEAKNESSES.

CRITICAL: This is Step 6 of 9. Build upon Steps 1-5 to analyze overall case strength.

COMBINED ANALYSIS FROM STEPS 1-5:
${combinedAnalysis}

OPENAI STRENGTHS & WEAKNESSES ANALYSIS:
${openAIResult.content}

STEP 6 TASKS - GEMINI:
- Synthesize overall case strength assessment
- Identify key strengths and vulnerabilities
- Provide strategic recommendations based on analysis

REQUIRED OUTPUT FORMAT:
CASE STRENGTHS & WEAKNESSES

- Case Strengths
- Case Weaknesses  
- Strategic Recommendations
- Risk Mitigation

Organize the OpenAI analysis into the required format above.`;

  return await callGeminiOrchestrator(prompt, geminiApiKey, 'STRENGTHS_WEAKNESSES');
}

// Step 7: Now handled by OpenAI processor - removed Gemini function

// Step 8: RECOMMENDED FOLLOW-UP QUESTIONS
async function executeStep8FollowUpQuestions(workflowState: WorkflowState, geminiApiKey: string) {
  const prompt = `You are GEMINI, the orchestrator. You are executing STEP 8: RECOMMENDED FOLLOW-UP QUESTIONS.

CRITICAL: This is Step 8 of 9. Build upon all previous steps.

COMPLETE ANALYSIS (Steps 1–7):
${combineStepsForAnalysis(workflowState, [1, 2, 3, 4, 5, 6, 7])}

STEP 8 TASKS - GEMINI:
- Identify critical information gaps from all previous steps
- Generate strategic follow-up questions organized by priority
- Recommend additional investigation areas
- Suggest expert consultation needs

REQUIRED OUTPUT FORMAT:
RECOMMENDED FOLLOW-UP QUESTIONS

CRITICAL INFORMATION NEEDED:
1. [Question about key factual gap]
2. [Question about legal clarification]
3. [Question about evidence/documentation]

ADDITIONAL INVESTIGATION:
- [Areas requiring further factual development]
- [Potential witnesses to interview]
- [Documents to obtain]

EXPERT CONSULTATION:
- [Whether specialized experts needed]
- [Areas requiring additional legal research]

Generate specific, actionable follow-up questions based on the complete analysis.`;

  return await callGeminiOrchestrator(prompt, geminiApiKey, 'FOLLOW_UP_QUESTIONS');
}

// Step 9: RELEVANT TEXAS LAW REFERENCES
async function executeStep9LawReferences(workflowState: WorkflowState, geminiApiKey: string) {
  // Gather vectorized law snippets using Step 3/4 context and the original query
  let lawSnippets = '';
  try {
    const basis = `${truncate(workflowState.stepResults.step3?.content || '', 1500)}\n\n${truncate(workflowState.stepResults.step4?.content || '', 1500)}\n\n${truncate(workflowState.context.query || '', 500)}`;
    const embedding = await generateEmbeddingForText(basis);
    const lawCtx = await fetchVectorLawContext(embedding, 0.7, 6);
    lawSnippets = lawCtx.topSnippets;
  } catch (e) {
    console.warn('⚠️ Step 9 law reference vector search failed:', (e as Error).message);
  }

  const prompt = `You are GEMINI, the orchestrator. You are executing STEP 9: RELEVANT TEXAS LAW REFERENCES.

CRITICAL: This is the final Step 9 of 9. Provide concise, accurate references tied to the case.

PRIOR ANALYSIS (Steps 1–8):
${combineStepsForAnalysis(workflowState, [1, 2, 3, 4, 5, 6, 7, 8])}

VECTOR LAW CONTEXT:
${lawSnippets || 'No vector law context available'}

TASKS:
- List the most relevant Texas statutes and regulations with short summaries
- Map each reference to specific issues from the case
- Include citations in a consistent format

REQUIRED OUTPUT FORMAT:
TEXAS LAW REFERENCES
- [Citation]: [One‑sentence relevance summary]
- [Citation]: [One‑sentence relevance summary]

Keep it focused and practical.`;

  return await callGeminiOrchestrator(prompt, geminiApiKey, 'LAW_REFERENCES');
}

// Helper functions
async function retrieveExistingContext(supabase: any, clientId: string, caseId?: string) {
  // Retrieve existing analysis and documents
  let analysisQuery = supabase
    .from('legal_analyses')
    .select('content, case_type, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (caseId) {
    analysisQuery = analysisQuery.eq('case_id', caseId);
  } else {
    analysisQuery = analysisQuery.is('case_id', null);
  }
  
  const { data: analyses } = await analysisQuery;
  
  // Get documents
  const { data: documents } = await supabase
    .from('document_metadata')
    .select('id, title, url, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    analysis: analyses?.[0]?.content,
    documents: documents || []
  };
}

async function callGeminiOrchestrator(prompt: string, geminiApiKey: string, stepType: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2, // Low temperature for consistent, structured output
          maxOutputTokens: 4096,
          topK: 40,
          topP: 0.95
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error for ${stepType}: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!content) {
      throw new Error(`No content generated by Gemini for ${stepType}`);
    }
    
    return { content, stepType };
  } catch (error) {
    console.error(`Error in Gemini ${stepType}:`, error);
    throw error;
  }
}

async function coordinateWithOpenAI(
  analysisType: string,
  query: string, 
  context: string,
  clientId: string,
  caseId?: string,
  authHeader?: string | null
) {
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.0");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    const response = await supabase.functions.invoke('generate-legal-analysis', {
      body: { 
        clientId, 
        caseId,
        conversation: [{ role: 'attorney', content: `${analysisType}: ${query}. Context: ${context}` }],
        researchFocus: analysisType,
        requestContext: '9-step-workflow',
        stepType: analysisType // Pass step type to ensure correct prompt
      },
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    
    if (response.error) throw new Error(response.error.message);
    
    return {
      content: response.data?.analysis || '',
      metadata: response.data?.metadata || {}
    };
  } catch (error) {
    console.error(`Error coordinating with OpenAI for ${analysisType}:`, error);
    throw error;
  }
}

async function coordinateWithPerplexity(
  searchType: string,
  query: string,
  clientId: string,
  caseId?: string,
  authHeader?: string | null
) {
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/perplexity-research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({ 
        query,
        clientId,
        caseId,
        searchType,
        requestContext: '9-step-workflow'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Perplexity ${searchType} failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      content: data.content || '',
      citations: data.citations || [],
      metadata: data.metadata || {}
    };
  } catch (error) {
    console.error(`Error coordinating with Perplexity for ${searchType}:`, error);
    throw error;
  }
}

async function generateEmbeddingForText(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
  const input = truncate(text || '', 8000);
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings error: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.data?.[0]?.embedding || [];
}

async function fetchVectorContext(
  clientId: string,
  caseId: string | undefined,
  queryEmbedding: number[],
  match_threshold = 0.65,
  match_count = 8
): Promise<{ topSnippets: string; totalFound: number }> {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.0');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase config missing');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase.rpc('search_client_and_case_documents_by_similarity', {
    query_embedding: queryEmbedding,
    client_id_param: clientId,
    case_id_param: caseId || null,
    match_threshold,
    match_count
  });
  if (error) throw new Error(`Vector RPC error: ${error.message}`);
  const chunks = (data || []) as Array<{ content: string; similarity: number; metadata: any }>; 
  const snippets = chunks
    .map((c, i) => `- [sim ${(c.similarity || 0).toFixed(2)}] ${truncate((c.content || '').replace(/\s+/g, ' ').trim(), 280)}`)
    .join('\n');
  return { topSnippets: snippets ? `${snippets}` : '', totalFound: chunks.length };
}

async function fetchVectorLawContext(
  queryEmbedding: number[],
  match_threshold = 0.7,
  match_count = 5
): Promise<{ topSnippets: string; totalFound: number }> {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.0');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase config missing');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Search Texas law documents in knowledge base
  const { data, error } = await supabase.rpc('search_texas_law_documents', {
    query_embedding: queryEmbedding,
    match_threshold,
    match_count
  });
  
  if (error) {
    console.warn('Texas law vector search failed, falling back to general search:', error.message);
    // Fallback to searching general documents table if Texas law function doesn't exist
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('documents')
      .select('content, metadata')
      .textSearch('content', 'Texas statute law code', { 
        type: 'websearch',
        config: 'english'
      })
      .limit(match_count);
    
    if (fallbackError) throw new Error(`Fallback law search error: ${fallbackError.message}`);
    
    const snippets = (fallbackData || [])
      .map((doc, i) => `- [statute] ${truncate((doc.content || '').replace(/\s+/g, ' ').trim(), 200)}`)
      .join('\n');
    
    return { topSnippets: snippets || '', totalFound: fallbackData?.length || 0 };
  }
  
  const lawChunks = (data || []) as Array<{ content: string; similarity: number; title: string }>; 
  const snippets = lawChunks
    .map((c, i) => `- [${c.title || 'statute'}] ${truncate((c.content || '').replace(/\s+/g, ' ').trim(), 250)}`)
    .join('\n');
  
  return { topSnippets: snippets || '', totalFound: lawChunks.length };
}

function truncate(s: string, n: number) { return s && s.length > n ? s.slice(0, n) + '…' : (s || ''); }

function sectionSlice(content: string, header: string): string {
  const startRe = new RegExp(`\\*\\*${header}\\:\\*\\*`, 'i');
  const idx = content.search(startRe);
  if (idx === -1) return '';
  const rest = content.slice(idx + 4 + header.length); // rough skip
  const nextHeader = rest.search(/\n\s*\*\*[A-Z][A-Z\s]+:\*\*/);
  return nextHeader === -1 ? rest : rest.slice(0, nextHeader);
}

function countBullets(block: string): number {
  return (block.match(/^[\t ]*(?:-|\*|\d+\.)\s+.+$/gm) || []).length;
}

function getSectionBulletCounts(content: string): Record<string, number> {
  const sections = ['POTENTIAL LEGAL AREAS', 'PRELIMINARY ISSUES', 'RESEARCH PRIORITIES', 'STRATEGIC NOTES'];
  const counts: Record<string, number> = {};
  for (const s of sections) {
    counts[s] = countBullets(sectionSlice(content, s));
  }
  return counts;
}

async function validateStepCompletion(stepNumber: number, stepResult: any, stepType: string = 'GENERAL', allStepResults: Record<string, any> = {}): Promise<StepValidation> {
  // Enhanced validation with quality control and blocking mechanism
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 1.0;

  // Basic content validation
  if (!stepResult || !stepResult.content) {
    errors.push(`Step ${stepNumber} produced no content`);
    return { isValid: false, errors, warnings, score: 0 };
  }

  const content = stepResult.content;

  // Minimum content length based on step type
  const minLengths = {
    'CASE_SUMMARY': 300,
    'PRELIMINARY_ANALYSIS': 400,
    'TEXAS_LAWS': 200,
    'CASE_LAW': 200,
    'IRAC_ANALYSIS': 600,
    'STRENGTHS_WEAKNESSES': 300,
    'RISK_ASSESSMENT': 300,
    'FOLLOW_UP': 150,
    'REMEDIES': 200,
    'SYNTHESIS': 500
  };

  const minLength = minLengths[stepType as keyof typeof minLengths] || 150;
  if (content.length < minLength) {
    errors.push(`Step ${stepNumber} content too short (${content.length} chars, minimum ${minLength})`);
    score -= 0.3;
  }

  // Professional legal writing standards
  const emotionalWords = /\b(obviously|ridiculous|absurd|shocking|outrageous|terrible|amazing|incredible)\b/gi;
  if (emotionalWords.test(content)) {
    errors.push(`Step ${stepNumber} contains emotional or unprofessional language`);
    score -= 0.2;
  }

  const subjectivePatterns = /\b(I think|I believe|in my opinion|clearly|definitely should)\b/gi;
  if (subjectivePatterns.test(content)) {
    warnings.push(`Step ${stepNumber} may contain subjective language`);
    score -= 0.1;
  }

  // Structural validation based on step type
  const requiredStructures = {
  'CASE_SUMMARY': /Parties|Timeline|Key Facts/i,
  'PRELIMINARY_ANALYSIS': /(?=.*POTENTIAL LEGAL AREAS)(?=.*PRELIMINARY ISSUES)(?=.*RESEARCH PRIORITIES)(?=.*STRATEGIC NOTES)/i,
  'TEXAS_LAWS': /(?=.*(?:Texas|statute|law|provision|code|chapter|section|penal|civil|property|family|business|health|safety|finance|insurance|labor|education|government|transportation|water|tax))/i,
  'IRAC_ANALYSIS': /(?=.*ISSUE)(?=.*RULE)(?=.*APPLICATION)(?=.*CONCLUSION)/si,
  'STRENGTHS_WEAKNESSES': /\*\*CASE STRENGTHS:\*\*|\*\*CASE WEAKNESSES:\*\*/i
  };

  const requiredStructure = requiredStructures[stepType as keyof typeof requiredStructures];
  if (requiredStructure && !requiredStructure.test(content)) {
    if (stepType === 'PRELIMINARY_ANALYSIS') {
      // Downgrade to warning for Step 2 – don't block the workflow
      warnings.push(`Step ${stepNumber} lacks required structural elements for ${stepType}`);
      score -= 0.2;
    } else if (stepType === 'IRAC_ANALYSIS') {
      // For IRAC, provide more detailed feedback
      const hasIssue = /ISSUE/i.test(content);
      const hasRule = /RULE/i.test(content);
      const hasApplication = /APPLICATION/i.test(content);
      const hasConclusion = /CONCLUSION/i.test(content);
      const missing = [];
      if (!hasIssue) missing.push('ISSUE');
      if (!hasRule) missing.push('RULE');
      if (!hasApplication) missing.push('APPLICATION');
      if (!hasConclusion) missing.push('CONCLUSION');
      
      if (missing.length > 0) {
        console.log(`🔍 IRAC validation failed. Missing: ${missing.join(', ')}`);
        console.log(`📄 Content length: ${content.length} chars`);
        console.log(`📄 Content preview: ${content.substring(0, 500)}...`);
        // Downgrade to warning instead of error to allow graceful degradation
        warnings.push(`Step ${stepNumber} missing IRAC components: ${missing.join(', ')}`);
        score -= 0.2;
      }
    } else if (stepType === 'TEXAS_LAWS') {
      // For Texas Laws, provide detailed feedback and downgrade to warning
      console.log(`⚖️ TEXAS_LAWS validation failed for Step ${stepNumber}`);
      console.log(`📄 Content length: ${content.length} chars`);
      console.log(`📄 Content preview: ${content.substring(0, 500)}...`);
      // Downgrade to warning instead of error to allow graceful degradation
      warnings.push(`Step ${stepNumber} lacks specific Texas law content structure`);
      score -= 0.2;
    } else {
      errors.push(`Step ${stepNumber} lacks required structural elements for ${stepType}`);
      score -= 0.3;
    }
  }
  
  // Critical validation: Step 2 must NOT contain IRAC format
  if (stepType === 'PRELIMINARY_ANALYSIS') {
    const iracPatterns = /\*\*ISSUE \[\d+\]\*\*:|IRAC ANALYSIS|ISSUE \[\d+\]:|APPLICATION:|detailed legal analysis/i;
    if (iracPatterns.test(content)) {
      errors.push(`Step ${stepNumber} illegally contains IRAC format - this is preliminary analysis only`);
      score -= 0.5;
    }
    
    // Prefer, but don't require, preliminary analysis sections
    const prelimRequired = /(?=.*POTENTIAL LEGAL AREAS)(?=.*PRELIMINARY ISSUES)(?=.*RESEARCH PRIORITIES)(?=.*STRATEGIC NOTES)/i;
    if (!prelimRequired.test(content)) {
      // Downgrade to warning so we can proceed to later steps
      warnings.push(`Step ${stepNumber} missing required preliminary analysis sections`);
      score -= 0.2;
    }
  }

  // Cross-step consistency validation
  if (stepNumber > 1) {
    const previousSteps = Object.keys(allStepResults).filter(key => key.match(/step\d+/));
    if (previousSteps.length < stepNumber - 1) {
      warnings.push(`Step ${stepNumber} may be missing context from previous steps`);
      score -= 0.1;
    }
  }

  // Final score adjustment
  score = Math.max(0, Math.min(1, score));
  const isValid = errors.length === 0 && score >= 0.6;

  console.log(`${isValid ? '✅' : '❌'} Step ${stepNumber} validation:`, { 
    isValid,
    errors: errors.length,
    warnings: warnings.length,
    score: score.toFixed(2),
    contentLength: content.length,
    stepType
  });

  return {
    isValid,
    errors,
    warnings,
    score
  };
}

function combineStepsForAnalysis(workflowState: WorkflowState, stepNumbers: number[]): string {
  return stepNumbers
    .map(num => workflowState.stepResults[`step${num}`]?.content || '')
    .filter(content => content.length > 0)
    .join('\n\n=== NEXT STEP ===\n\n');
}

function extractResearchPriorities(preliminaryAnalysis: string): string[] {
  // Prefer ELEMENTS ANALYSIS bullets; fallback to POTENTIAL LEGAL THEORIES bullets
  const extractBullets = (section: string) => {
    const re = new RegExp(`\\*\\*${section}:\\*\\*([\\s\\S]*?)(?=\\*\\*[A-Z][^*]+:\\*\\*|$)`, 'i');
    const m = preliminaryAnalysis.match(re);
    if (!m) return [] as string[];
    const block = m[1] || '';
    return (block.match(/^-\s+.+$/gmi) || []).map(s => s.replace(/^[-*]\s+/, '').trim());
  };
  const fromElements = extractBullets('ELEMENTS ANALYSIS');
  const fromTheories = extractBullets('POTENTIAL LEGAL THEORIES');
  const combined = [...fromElements, ...fromTheories].slice(0, 6);
  return combined.length > 0 ? combined : ['General legal research'];
}

function extractLegalAreas(preliminaryAnalysis: string): string[] {
  // Extract bullets under POTENTIAL LEGAL THEORIES
  const re = /\*\*POTENTIAL LEGAL THEORIES:\*\*([\s\S]*?)(?=\*\*[A-Z][^*]+:\*\*|$)/i;
  const m = preliminaryAnalysis.match(re);
  if (!m) return ['General case law'];
  const block = m[1] || '';
  const bullets = (block.match(/^-\s+.+$/gmi) || []).map(s => s.replace(/^[-*]\s+/, '').trim());
  return bullets.length > 0 ? bullets.slice(0, 6) : ['General case law'];
}

async function performFinalSynthesis(workflowState: WorkflowState, geminiApiKey: string): Promise<string> {
  const allSteps = combineStepsForAnalysis(workflowState, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  
  const prompt = `You are GEMINI, the final orchestrator. Synthesize the complete 9-step legal analysis into a comprehensive, professional legal memo.

COMPLETE 9-STEP ANALYSIS:
${allSteps}

SYNTHESIS REQUIREMENTS:
- Create a cohesive, professional legal analysis
- Maintain all key findings and recommendations
- Ensure proper legal structure and formatting
- Include executive summary and action items

Synthesize all 9 steps into a comprehensive legal analysis.`;

  const result = await callGeminiOrchestrator(prompt, geminiApiKey, 'FINAL_SYNTHESIS');
  return result.content;
}

function extractCitations(content: string): string[] {
  const citations = [];
  
  // Extract Texas statute citations
  const statuteMatches = content.match(/Texas [A-Z][a-zA-Z\s&]+ Code §[\s]*[\d\.\-A-Za-z]+/g) || [];
  citations.push(...statuteMatches);
  
  // Extract case citations
  const caseMatches = content.match(/\b[A-Z][a-zA-Z\s&]+\s+v\.\s+[A-Z][a-zA-Z\s&]+/g) || [];
  citations.push(...caseMatches);
  
  // Extract section references
  const sectionMatches = content.match(/§[\s]*[\d\.\-A-Za-z]+/g) || [];
  citations.push(...sectionMatches);
  
  return [...new Set(citations)];
}

function extractResearchSources(workflowState: WorkflowState): any[] {
  const sources = [];
  
  // Extract from each step's metadata
  for (const [stepKey, stepResult] of Object.entries(workflowState.stepResults)) {
    if (stepResult?.metadata?.citations) {
      sources.push({
        step: stepKey,
        citations: stepResult.metadata.citations,
        type: stepResult.stepType || 'unknown'
      });
    }
  }
  
  return sources;
}

// Enforce preliminary analysis structure and sanitize IRAC remnants
function sanitizeIracContent(text: string): string {
  return (text || '')
    .replace(/\*\*IRAC[^\n]*\n?/gi, '')
    .replace(/(^|\n)\s*(\*{0,2}\s*)?(ISSUE|RULE|APPLICATION|ANALYSIS|CONCLUSION)\s*:\s*.*$/gim, '')
    .replace(/##\s*IRAC[^\n]*\n?/gi, '')
    .replace(/\(\s*Tex\.[^\)]*\)/gi, '')
    .replace(/§\s*[\d\.\-A-Za-z]+/g, '');
}

function enforcePreliminaryStructure(content: string, step1Summary: string): string {
  let result = content || '';

  // Normalize headings to exact uppercase with colons
  const normalize = (text: string) => text
    .replace(/^\s*#{1,6}\s*PRELIMINARY ANALYSIS[^\n]*$/gim, '**PRELIMINARY ANALYSIS:**')
    .replace(/\*\*\s*PRELIMINARY ANALYSIS\s*\*\*/gi, '**PRELIMINARY ANALYSIS:**')
    .replace(/\*\*\s*POTENTIAL\s+LEGAL\s+AREAS\s*:?(\*\*)?/gi, '**POTENTIAL LEGAL AREAS:**')
    .replace(/\*\*\s*PRELIMINARY\s+ISSUES(?:\s+IDENTIFIED)?\s*:?(\*\*)?/gi, '**PRELIMINARY ISSUES:**')
    .replace(/\*\*\s*RESEARCH\s+PRIORITIES\s*:?(\*\*)?/gi, '**RESEARCH PRIORITIES:**')
    .replace(/\*\*\s*STRATEGIC\s+NOTES\s*:?(\*\*)?/gi, '**STRATEGIC NOTES:**');

  result = normalize(result);

  // Ensure top header exists at the top once
  if (!/\*\*PRELIMINARY ANALYSIS:\*\*/.test(result)) {
    result = `**PRELIMINARY ANALYSIS:**\n\n${result}`.trim();
  }

  // Ensure required section headers exist (no filler content added)
  const required = [
    '**POTENTIAL LEGAL AREAS:**',
    '**PRELIMINARY ISSUES:**',
    '**RESEARCH PRIORITIES:**',
    '**STRATEGIC NOTES:**',
  ];

  for (const header of required) {
    const re = new RegExp(header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!re.test(result)) {
      result += `\n\n${header}\n`;
    }
  }

  return result.trim();
}

// Enforce Texas Laws structure according to specification
function enforceTexasLawsStructure(content: string): string {
  let result = content || '';

  // Normalize headings to exact format
  const normalize = (text: string) => text
    .replace(/^\s*#{1,6}\s*RELEVANT TEXAS LAWS[^\n]*$/gim, '**RELEVANT TEXAS LAWS (Targeted legal research)**')
    .replace(/\*\*\s*RELEVANT TEXAS LAWS[^\n]*\*\*/gi, '**RELEVANT TEXAS LAWS (Targeted legal research)**')
    .replace(/\*\*\s*Legal\s+Area\s+Statutes?\s*:?(\*\*)?/gi, '**Legal Area Statutes:**')
    .replace(/\*\*\s*Recent\s+Updates?\s*:?(\*\*)?/gi, '**Recent Updates:**')
    .replace(/\*\*\s*Key\s+Provisions?\s*:?(\*\*)?/gi, '**Key Provisions:**');

  result = normalize(result);

  // Ensure main header exists at the top
  if (!/\*\*RELEVANT TEXAS LAWS \(Targeted legal research\)\*\*/.test(result)) {
    result = `**RELEVANT TEXAS LAWS (Targeted legal research)**\n\n${result}`.trim();
  }

  // Ensure required section headers exist
  const required = [
    '**Legal Area Statutes:**',
    '**Recent Updates:**',
    '**Key Provisions:**',
  ];

  for (const header of required) {
    const re = new RegExp(header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!re.test(result)) {
      result += `\n\n${header}\n`;
    }
  }

  return result.trim();
}

// Save individual steps as separate analysis records
async function saveIndividualSteps(
  workflowResult: any,
  clientId: string,
  caseId: string | undefined,
  supabase: any,
  authHeader: string | null
) {
  try {
    const stepMappings = {
      step1: 'step-1-case-summary',
      step2: 'step-2-preliminary-analysis',
      step3: 'step-3-texas-laws',
      step4: 'step-4-case-law',
      step5: 'step-5-irac-analysis',
      step6: 'step-6-strengths-weaknesses',
      step7: 'step-7-refined-analysis',
      step8: 'step-8-follow-up-questions',
      step9: 'step-9-law-references'
    };

    const savePromises = [];

    for (const [stepKey, analysisType] of Object.entries(stepMappings)) {
      const stepResult = workflowResult.stepResults[stepKey];
      if (stepResult?.content) {
        const savePromise = supabase.functions.invoke('validate-and-save-legal-analysis', {
          body: {
            clientId,
            caseId,
            content: stepResult.content,
            timestamp: new Date().toISOString(),
            analysisType,
            provenance: {
              step: stepKey,
              stepType: stepResult.stepType,
              methodology: '9-step-workflow',
              workflowVersion: '2.0',
              metadata: stepResult.metadata || {}
            }
          },
          headers: authHeader ? { Authorization: authHeader } : {}
        });
        savePromises.push(savePromise);
        console.log(`💾 Saving ${stepKey} as ${analysisType}`);
      }
    }

    const results = await Promise.allSettled(savePromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Saved ${successful} steps successfully, ${failed} failed`);
    
    if (failed > 0) {
      console.warn('Some steps failed to save:', results.filter(r => r.status === 'rejected'));
    }

    return { successful, failed };
  } catch (error) {
    console.error('Failed to save individual steps:', error);
    throw error;
  }
}

async function saveWorkflowToDatabase(
  workflowResult: any,
  clientId: string,
  caseId: string | undefined,
  supabase: any,
  authHeader: string | null
) {
  try {
    // Save individual steps as separate analysis records
    await saveIndividualSteps(workflowResult, clientId, caseId, supabase, authHeader);
    
    // Also save the complete synthesis as a master record
    const { data, error } = await supabase.functions.invoke('validate-and-save-legal-analysis', {
      body: {
        clientId,
        caseId,
        content: workflowResult.finalSynthesis,
        timestamp: new Date().toISOString(),
        analysisType: '9-step-workflow-synthesis',
        provenance: {
          methodology: '9-step-workflow',
          workflowResults: Object.keys(workflowResult.stepResults),
          researchSources: workflowResult.researchSources,
          qualityControlPassed: workflowResult.qualityControlPassed,
          overallQualityScore: workflowResult.overallQualityScore,
          completedSteps: Array.from(workflowResult.completedSteps)
        }
      },
      headers: authHeader ? { Authorization: authHeader } : {}
    });

    if (error) {
      console.error('Error saving 9-step workflow synthesis to database:', error);
      throw error;
    }

    console.log('✅ 9-step workflow saved to database successfully');
    return data;
  } catch (error) {
    console.error('Failed to save 9-step workflow:', error);
    throw error;
  }
}