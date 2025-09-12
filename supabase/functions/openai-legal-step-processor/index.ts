import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface StepRequest {
  stepNumber: number;
  stepType: string;
  workflowState: any;
  context: string;
  authHeader?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stepNumber, stepType, workflowState, context, authHeader }: StepRequest = await req.json();
    
    console.log(`🤖 OpenAI Step Processor - Executing Step ${stepNumber}: ${stepType}`);
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let result;
    switch (stepNumber) {
      case 1:
        result = await executeStep1CaseSummary(workflowState, context, openaiApiKey);
        break;
      case 2:
        result = await executeStep2PreliminaryAnalysis(workflowState, context, openaiApiKey);
        break;
      case 3:
        result = await executeStep3TexasLaws(workflowState, context, openaiApiKey, authHeader);
        break;
      case 4:
        result = await executeStep4CaseLaw(workflowState, context, openaiApiKey, authHeader);
        break;
      case 5:
        result = await executeStep5IracAnalysis(workflowState, context, openaiApiKey);
        break;
      case 6:
        result = await executeStep6StrengthsWeaknesses(workflowState, context, openaiApiKey);
        break;
      case 8:
        result = await executeStep8FollowUpQuestions(workflowState, context, openaiApiKey);
        break;
      case 9:
        result = await executeStep9LawReferences(workflowState, context, openaiApiKey);
        break;
      default:
        throw new Error(`Step ${stepNumber} not handled by OpenAI processor`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
        stepNumber,
        stepType,
        provider: 'openai'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in OpenAI step processor:', error);
    return new Response(
      JSON.stringify({ 
        error: 'OpenAI step processing failed', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// OpenAI API helper function
async function callOpenAI(prompt: string, systemPrompt: string, model: string = 'gpt-4.1-2025-04-14'): Promise<any> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];

  // Model-specific parameter handling
  const requestBody: any = {
    model,
    messages,
  };

  // Use correct parameters based on model
  if (model.includes('gpt-5') || model.includes('o3') || model.includes('o4')) {
    // New models use max_completion_tokens and no temperature
    requestBody.max_completion_tokens = model.includes('gpt-5-nano') ? 1000 : 2048;
  } else {
    // Legacy models use max_tokens and support temperature
    requestBody.max_tokens = 2048;
    requestBody.temperature = 0.2;
  }

  console.log(`🤖 Calling OpenAI ${model}...`);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  console.log(`✅ OpenAI ${model} response generated (${content.length} chars)`);
  
  return {
    content,
    usage: data.usage,
    model,
    metadata: { provider: 'openai', model }
  };
}

// Step 1: Case Summary - Organized fact pattern
async function executeStep1CaseSummary(workflowState: any, context: string, openaiApiKey: string) {
  const systemPrompt = `You are a legal AI assistant specializing in organizing case facts for legal analysis. Your task is to create a clear, structured case summary from raw client information.

CRITICAL: This is Step 1 of a 9-step legal analysis. Focus ONLY on organizing facts - do not provide legal analysis, conclusions, or recommendations.`;

  const prompt = `STEP 1 TASK: Create an organized case summary from the following information.

CLIENT QUERY/INFORMATION:
${workflowState.context.query}

EXISTING CONTEXT:
${context}

REQUIRED OUTPUT FORMAT:
# CASE SUMMARY

## Parties Involved
- [List all relevant parties and their roles]

## Timeline of Events
- [Key dates and chronological sequence of events]

## Core Facts
- [Organized factual narrative without legal conclusions]

## Key Documents/Evidence
- [Reference to important evidence or documentation]

## Disputed/Unclear Facts
- [Note any facts that may need clarification]

Focus strictly on fact organization. Do not include legal opinions, analysis, or conclusions.`;

  return await callOpenAI(prompt, systemPrompt, 'gpt-5-mini-2025-08-07');
}

// Step 2: Preliminary Analysis - Broad issue spotting
async function executeStep2PreliminaryAnalysis(workflowState: any, context: string, openaiApiKey: string) {
  const systemPrompt = `You are a legal AI assistant specializing in preliminary case analysis and issue identification. Your task is to identify potential legal issues without conducting deep analysis.

CRITICAL: This is Step 2 of a 9-step workflow. Provide broad issue spotting - do not conduct detailed IRAC analysis (that comes in Step 5).`;

  const prompt = `STEP 2 TASK: Conduct preliminary analysis and broad issue identification.

CASE SUMMARY (Step 1):
${workflowState.stepResults?.step1?.content || 'No Step 1 available'}

CLIENT INFORMATION:
${workflowState.context.query}

ADDITIONAL CONTEXT:
${context}

REQUIRED OUTPUT FORMAT:
# PRELIMINARY ANALYSIS

## Potential Legal Issues Identified
1. [Issue 1 - brief description]
2. [Issue 2 - brief description]
3. [Issue 3 - brief description]

## Areas of Law Potentially Involved
- [e.g., Contract Law, Tort Law, Consumer Protection, etc.]

## Initial Assessment of Claim Viability
- [High-level assessment without detailed analysis]

## Key Legal Questions to Address
1. [Question 1]
2. [Question 2]
3. [Question 3]

## Recommended Next Steps for Investigation
- [Information gaps to fill]
- [Additional research needed]

Do NOT conduct detailed legal analysis or IRAC format analysis. Keep this at a preliminary, issue-spotting level.`;

  return await callOpenAI(prompt, systemPrompt, 'gpt-4.1-2025-04-14');
}

// Step 3: Texas Laws Research
async function executeStep3TexasLaws(workflowState: any, context: string, openaiApiKey: string, authHeader?: string) {
  // First get research from Perplexity, then format with OpenAI
  const researchContent = await callPerplexityResearch('texas-laws', workflowState, authHeader);
  
  const systemPrompt = `You are a legal AI assistant specializing in Texas state law research and analysis. Format and organize legal research into a clear structure.`;

  const prompt = `STEP 3 TASK: Format and organize Texas state law research relevant to this case.

CASE FACTS:
${workflowState.stepResults?.step1?.content || 'No case summary available'}

PRELIMINARY ISSUES IDENTIFIED:
${workflowState.stepResults?.step2?.content || 'No preliminary analysis available'}

RESEARCH RESULTS:
${researchContent}

REQUIRED OUTPUT FORMAT:
# RELEVANT TEXAS LAWS

## Applicable Statutes
- [List relevant Texas statutes with citations]

## Regulatory Framework
- [Relevant Texas regulations and rules]

## Key Legal Standards
- [Standards of proof, requirements, thresholds]

## Statutory Analysis
- [How the statutes apply to the case facts]

## Compliance Requirements
- [Any procedural or substantive requirements]

Focus on Texas state law specifically. Provide clear citations and explain how each law relates to the identified issues.`;

  const formatResult = await callOpenAI(prompt, systemPrompt, 'gpt-5-nano-2025-08-07');
  
  return {
    ...formatResult,
    researchSources: researchContent ? [researchContent] : [],
    metadata: { ...formatResult.metadata, researchProvider: 'perplexity' }
  };
}

// Step 4: Case Law Research
async function executeStep4CaseLaw(workflowState: any, context: string, openaiApiKey: string, authHeader?: string) {
  // First get research from Perplexity, then format with OpenAI
  const researchContent = await callPerplexityResearch('case-law', workflowState, authHeader);
  
  const systemPrompt = `You are a legal AI assistant specializing in case law research and precedent analysis. Format and organize case law research into a clear structure.`;

  const prompt = `STEP 4 TASK: Format and organize case law research relevant to this case.

CASE FACTS:
${workflowState.stepResults?.step1?.content || 'No case summary available'}

IDENTIFIED ISSUES:
${workflowState.stepResults?.step2?.content || 'No preliminary analysis available'}

RELEVANT TEXAS LAWS:
${workflowState.stepResults?.step3?.content || 'No Texas law research available'}

CASE LAW RESEARCH RESULTS:
${researchContent}

REQUIRED OUTPUT FORMAT:
# RELEVANT CASE LAW

## Controlling Precedents
- [Cases that directly control the outcome]

## Persuasive Authority
- [Similar cases from other jurisdictions]

## Key Legal Principles
- [Legal principles established by the cases]

## Factual Similarities
- [How case facts compare to precedent facts]

## Distinguishing Factors
- [How this case differs from precedents]

## Precedential Value Analysis
- [Strength and applicability of each precedent]

Focus on cases most relevant to the identified legal issues. Provide proper citations and explain the relevance of each case.`;

  const formatResult = await callOpenAI(prompt, systemPrompt, 'gpt-5-nano-2025-08-07');
  
  return {
    ...formatResult,
    researchSources: researchContent ? [researchContent] : [],
    metadata: { ...formatResult.metadata, researchProvider: 'perplexity' }
  };
}

// Step 5: IRAC Analysis - Comprehensive legal analysis
async function executeStep5IracAnalysis(workflowState: any, context: string, openaiApiKey: string) {
  const systemPrompt = `You are a legal AI assistant specializing in comprehensive IRAC legal analysis. Conduct systematic legal analysis using the Issue, Rule, Application, Conclusion framework.

CRITICAL: This is Step 5 of a 9-step workflow. Provide detailed IRAC analysis based on all previous steps.`;

  const prompt = `STEP 5 TASK: Conduct comprehensive IRAC legal analysis.

CASE SUMMARY:
${workflowState.stepResults?.step1?.content || 'No case summary available'}

PRELIMINARY ANALYSIS:
${workflowState.stepResults?.step2?.content || 'No preliminary analysis available'}

RELEVANT TEXAS LAWS:
${workflowState.stepResults?.step3?.content || 'No Texas law research available'}

RELEVANT CASE LAW:
${workflowState.stepResults?.step4?.content || 'No case law research available'}

REQUIRED OUTPUT FORMAT:
# IRAC LEGAL ANALYSIS

## ISSUE [1]
**[State the first legal issue as a question]**

### RULE
[State the applicable legal rule, statute, or precedent]

### APPLICATION
[Apply the rule to the specific facts of this case]

### CONCLUSION
[Conclude on this issue based on the application]

## ISSUE [2]
**[State the second legal issue as a question]**

### RULE
[State the applicable legal rule, statute, or precedent]

### APPLICATION
[Apply the rule to the specific facts of this case]

### CONCLUSION
[Conclude on this issue based on the application]

[Continue for additional issues as needed]

## OVERALL LEGAL ASSESSMENT
[Synthesize conclusions across all issues]

Provide thorough analysis for each identified legal issue using proper IRAC structure.`;

  return await callOpenAI(prompt, systemPrompt, 'gpt-4.1-2025-04-14');
}

// Step 6: Strengths and Weaknesses
async function executeStep6StrengthsWeaknesses(workflowState: any, context: string, openaiApiKey: string) {
  const systemPrompt = `You are a legal AI assistant specializing in case assessment and risk analysis. Evaluate case strengths and weaknesses based on comprehensive legal analysis.`;

  const prompt = `STEP 6 TASK: Analyze case strengths and weaknesses based on completed legal analysis.

CASE SUMMARY:
${workflowState.stepResults?.step1?.content || 'No case summary available'}

IRAC ANALYSIS:
${workflowState.stepResults?.step5?.content || 'No IRAC analysis available'}

REQUIRED OUTPUT FORMAT:
# CASE STRENGTHS & WEAKNESSES

## CASE STRENGTHS
### Legal Strengths
- [Strong legal arguments and precedents]

### Factual Strengths
- [Strong factual evidence and circumstances]

### Procedural Advantages
- [Any procedural benefits or advantages]

## CASE WEAKNESSES
### Legal Weaknesses
- [Weak legal arguments or adverse precedents]

### Factual Weaknesses
- [Weak evidence or adverse facts]

### Procedural Risks
- [Procedural challenges or risks]

## RISK ASSESSMENT
### Likelihood of Success
- [Overall assessment with percentage if appropriate]

### Key Risk Factors
- [Primary risks that could impact outcome]

### Mitigating Strategies
- [Ways to address weaknesses]

## SETTLEMENT CONSIDERATIONS
- [Factors that favor settlement vs. litigation]

Provide balanced, realistic assessment based on the legal analysis.`;

  return await callOpenAI(prompt, systemPrompt, 'gpt-4.1-2025-04-14');
}

// Step 8: Follow-up Questions
async function executeStep8FollowUpQuestions(workflowState: any, context: string, openaiApiKey: string) {
  const systemPrompt = `You are a legal AI assistant specializing in identifying information gaps and follow-up questions for case development.`;

  const prompt = `STEP 8 TASK: Generate follow-up questions to strengthen the case analysis.

CASE SUMMARY:
${workflowState.stepResults?.step1?.content || 'No case summary available'}

IRAC ANALYSIS:
${workflowState.stepResults?.step5?.content || 'No IRAC analysis available'}

STRENGTHS & WEAKNESSES:
${workflowState.stepResults?.step6?.content || 'No strengths/weaknesses analysis available'}

REQUIRED OUTPUT FORMAT:
# RECOMMENDED FOLLOW-UP QUESTIONS

## Critical Information Gaps
1. [Question about missing crucial facts]
2. [Question about unclear circumstances]
3. [Question about potential evidence]

## Evidence Development
1. [Questions about documents needed]
2. [Questions about witness information]
3. [Questions about expert testimony needs]

## Legal Clarifications
1. [Questions to clarify legal positions]
2. [Questions about client objectives]
3. [Questions about preferred outcomes]

## Timeline and Procedural
1. [Questions about deadlines]
2. [Questions about prior legal actions]
3. [Questions about regulatory compliance]

## Strategic Considerations
1. [Questions about client priorities]
2. [Questions about risk tolerance]
3. [Questions about settlement preferences]

Focus on questions that will materially improve the legal analysis and case strategy.`;

  return await callOpenAI(prompt, systemPrompt, 'gpt-5-mini-2025-08-07');
}

// Step 9: Law References
async function executeStep9LawReferences(workflowState: any, context: string, openaiApiKey: string) {
  const systemPrompt = `You are a legal AI assistant specializing in legal research and citation compilation. Create a comprehensive reference list of relevant legal authorities.`;

  const prompt = `STEP 9 TASK: Compile comprehensive legal references relevant to this case.

CASE ANALYSIS SUMMARY:
${workflowState.stepResults?.step5?.content || 'No IRAC analysis available'}

TEXAS LAWS IDENTIFIED:
${workflowState.stepResults?.step3?.content || 'No Texas law research available'}

CASE LAW IDENTIFIED:
${workflowState.stepResults?.step4?.content || 'No case law research available'}

REQUIRED OUTPUT FORMAT:
# RELEVANT TEXAS LAW REFERENCES

## Primary Authorities
### Texas Statutes
- [List relevant Texas statutes with full citations]

### Texas Case Law
- [List relevant Texas cases with full citations]

### Texas Regulations
- [List relevant Texas administrative regulations]

## Secondary Authorities
### Legal Treatises
- [Relevant legal treatises and practice guides]

### Law Review Articles
- [Relevant scholarly articles]

### Practice Resources
- [CLE materials, practice guides, etc.]

## Federal Authorities (if applicable)
### Federal Statutes
- [Relevant federal laws]

### Federal Cases
- [Relevant federal precedents]

## Research Recommendations
### Additional Research Areas
- [Suggested areas for further research]

### Keywords for Research
- [Key terms for legal database searches]

Provide complete, properly formatted legal citations using standard citation format.`;

  return await callOpenAI(prompt, systemPrompt, 'gpt-5-nano-2025-08-07');
}

// Helper function to call Perplexity for research (simplified)
async function callPerplexityResearch(researchType: string, workflowState: any, authHeader?: string): Promise<string> {
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.0");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase not configured for Perplexity research');
      return 'No external research available';
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Build research query from case facts
    const caseContext = workflowState.stepResults?.step1?.content || workflowState.context.query;
    const researchQuery = `Texas law research: ${caseContext.substring(0, 500)}`;
    
    console.log(`🔍 Calling Perplexity for ${researchType} research...`);
    
    // This would call your existing Perplexity research function
    // For now, return a placeholder
    return `Research results for ${researchType} would be retrieved here via Perplexity API`;
    
  } catch (error) {
    console.error('Perplexity research failed:', error);
    return 'External research unavailable';
  }
}