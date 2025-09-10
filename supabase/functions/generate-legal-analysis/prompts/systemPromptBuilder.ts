
// Build step-aware system prompt for legal analysis generation
export const buildSystemPrompt = (
  analysisSource: string,
  relevantLawReferences: any[],
  hasConversation: boolean,
  clientDocuments: any[],
  detectedCaseType: string,
  researchUpdates?: any[],
  stepType?: string
) => {
  console.log('🛠️ Building system prompt for:', { analysisSource, stepType, caseType: detectedCaseType });
  
  // Route to specific step types
  if (stepType === 'preliminary-analysis') {
    console.log('📋 Using preliminary analysis prompt (Step 2)');
    return buildPreliminarySystemPrompt(
      analysisSource,
      relevantLawReferences,
      hasConversation,
      clientDocuments,
      detectedCaseType,
      researchUpdates
    );
  }
  
  if (stepType === 'irac-analysis' || stepType === 'step-5') {
    console.log('🧮 Using IRAC analysis prompt (Step 5)');
    return buildIracSystemPrompt(
      analysisSource,
      relevantLawReferences,
      hasConversation,
      clientDocuments,
      detectedCaseType,
      researchUpdates
    );
  }
  
  // Additional step types that need specialized prompts
  if (stepType === 'risk-assessment') {
    console.log('📊 Using risk assessment prompt (Step 6)');
    return buildRiskAssessmentSystemPrompt(
      analysisSource,
      relevantLawReferences,
      hasConversation,
      clientDocuments,
      detectedCaseType,
      researchUpdates
    );
  }
  
  if (stepType === 'issues-assessment' || stepType === 'strengths-weaknesses') {
    console.log(`🔍 Using IRAC analysis prompt for ${stepType} (builds on comprehensive analysis)`);
    return buildIracSystemPrompt(
      analysisSource,
      relevantLawReferences,
      hasConversation,
      clientDocuments,
      detectedCaseType,
      researchUpdates
    );
  }
  
  // Default fallback for older API calls without stepType
  if (!stepType) {
    console.log('⚠️ No stepType provided, defaulting to preliminary analysis');
    return buildPreliminarySystemPrompt(
      analysisSource,
      relevantLawReferences,
      hasConversation,
      clientDocuments,
      detectedCaseType,
      researchUpdates
    );
  }
  
  // Error for unrecognized stepType
  throw new Error(`INVALID_STEP_TYPE: '${stepType}' - Must be 'preliminary-analysis', 'irac-analysis', or related workflow step`);
};

// Build preliminary analysis system prompt (Step 2)
export const buildPreliminarySystemPrompt = (
  analysisSource: string,
  relevantLawReferences: any[],
  hasConversation: boolean,
  clientDocuments: any[],
  detectedCaseType: string,
  researchUpdates?: any[]
) => {
  console.log(`Building preliminary analysis prompt for Step 2`);
  
  let systemPrompt = `You are an expert Texas attorney performing STEP 2: PRELIMINARY ANALYSIS. You will review the provided ${analysisSource} and generate a broad legal issue identification based on the facts presented.

**CRITICAL STEP 2 REQUIREMENTS:**
- ABSOLUTELY NO IRAC format, headings, or structure
- NEVER use "Issue," "Rule," "Application," "Conclusion," or "Analysis" sections
- NEVER provide detailed legal reasoning or case-by-case analysis
- Focus ONLY on IDENTIFYING potential legal areas, not analyzing them
- Create a STRATEGIC ROADMAP for further investigation
- Keep analysis BROAD and EXPLORATORY

**FORBIDDEN FORMATS:**
- Do NOT use **ISSUE:**, **RULE:**, **APPLICATION:**, **CONCLUSION:**
- Do NOT use ## IRAC Analysis or similar headings
- Do NOT provide detailed statutory analysis

PRELIMINARY ANALYSIS APPROACH:
- Facts drive the identification, not preconceived case types
- Identify potential areas of Texas law that may apply
- Spot broad legal issues requiring further research
- Create strategic roadmap for deeper analysis
- Base identifications on factual patterns and preliminary legal concepts`;

  // Add law references with relevance scoring if available
  if (relevantLawReferences && relevantLawReferences.length > 0) {
    systemPrompt += `\n\nRELEVANT TEXAS LAW AUTHORITIES (from comprehensive database search):\n`;
    relevantLawReferences.forEach(ref => {
      const relevanceNote = ref.similarity ? ` (Relevance: ${(ref.similarity * 100).toFixed(1)}%)` : '';
      systemPrompt += `- ${ref.title}: ${ref.content}${relevanceNote}\n`;
    });
  }

  // Sources allowed for Step 2
  systemPrompt += `\n\nSOURCES AND LIMITATIONS FOR STEP 2:\n- Prioritize the Step 1 Case Summary and client intake.\n- You MAY reference uploaded client documents (quote the document title when relying on it) and any provided research notes.\n- Do NOT include statute/case citations or URLs in Step 2.\n- Absolutely no IRAC format or headings.`;

  // Preliminary analysis structure requirements (match attorney expectations)
  systemPrompt += `\n\nREQUIRED PRELIMINARY ANALYSIS STRUCTURE:\n\n**PRELIMINARY ANALYSIS:**\n\n**POTENTIAL LEGAL AREAS:**\n- List likely areas (e.g., warranties, Texas Lemon Law, DTPA, negligence, fraud, contract).\n\n**PRELIMINARY ISSUES:**\n- Brief issue statements or element-level notes for the top 3–6 items (no citations).\n\n**RESEARCH PRIORITIES:**\n- Targeted questions or topics to confirm next (statutes to read, definitions to verify, thresholds).\n\n**STRATEGIC NOTES:**\n- Early tactics, information gaps, evidence to collect, and immediate next steps.`;

  // Step 2 guardrails
  systemPrompt += `\n\nSTEP 2 GUARDRAILS:\n- NO IRAC headings or detailed legal analysis.\n- Keep it concise, factual, and strategic.\n- Use professional Texas legal terminology.`;

  return systemPrompt;
};

// Build IRAC analysis system prompt (Step 5)
export const buildIracSystemPrompt = (
  analysisSource: string,
  relevantLawReferences: any[],
  hasConversation: boolean,
  clientDocuments: any[],
  detectedCaseType: string,
  researchUpdates?: any[]
) => {
  console.log(`Building IRAC analysis prompt for Step 5`);
  
  let systemPrompt = `You are an expert Texas attorney performing STEP 5: IRAC LEGAL ANALYSIS. You will analyze the provided ${analysisSource} and generate a thorough legal assessment based on the facts presented and previous workflow steps.

CRITICAL INSTRUCTION: This is Step 5 of a 9-step process. You are performing detailed IRAC analysis building upon the preliminary analysis from Step 2. Analyze ALL facts presented without limiting yourself to predetermined legal categories. Identify EVERY applicable area of Texas law and potential legal theory.

COMPREHENSIVE IRAC ANALYSIS APPROACH:
- Build upon the preliminary analysis from Step 2
- Facts drive the analysis, not preconceived case types
- Consider all applicable areas of Texas law simultaneously  
- Identify multiple overlapping legal theories and claims
- Analyze procedural requirements and strategic considerations
- Base all conclusions on specific statutory authority and case law`;

  // Add law references with relevance scoring if available
  if (relevantLawReferences && relevantLawReferences.length > 0) {
    systemPrompt += `\n\nRELEVANT TEXAS LAW AUTHORITIES (from comprehensive database search):\n`;
    relevantLawReferences.forEach(ref => {
      const relevanceNote = ref.similarity ? ` (Relevance: ${(ref.similarity * 100).toFixed(1)}%)` : '';
      systemPrompt += `- ${ref.title}: ${ref.content}${relevanceNote}\n`;
    });
  }

  // Add document context
  if (clientDocuments && clientDocuments.length > 0) {
    systemPrompt += `\n\nDOCUMENT CONTEXT: You have access to ${clientDocuments.length} client document(s) that must be thoroughly analyzed and integrated into your legal assessment.`;
  }

  // Add research updates context
  if (researchUpdates && researchUpdates.length > 0) {
    systemPrompt += `\n\nRESEARCH INTEGRATION: You have ${researchUpdates.length} research update(s) to integrate. These should be seamlessly woven into the appropriate sections of your analysis.`;
  }

  // IRAC-based analysis structure requirements
  systemPrompt += `\n\nREQUIRED IRAC ANALYSIS STRUCTURE:

**CASE SUMMARY:**
Brief overview of the legal matter, parties, key facts, and procedural posture.

**IRAC LEGAL ANALYSIS:**
For EACH distinct legal issue identified, provide a complete IRAC analysis:

**ISSUE [#]:** [Category - e.g., Contract Law, Tort Law, etc.]
State the precise legal question that must be resolved.

**RULE:**
- Applicable Texas statutes with complete citations
- Controlling case law with proper citations
- Elements of the legal theory or cause of action
- Relevant procedural rules and requirements
- Burden of proof standards

**APPLICATION:**
- Apply the legal rule to the specific facts presented
- Analyze each element of the claim or defense
- Compare and distinguish relevant case precedents
- Address counterarguments and potential defenses
- Evaluate strength of evidence for each element

**CONCLUSION:**
- Clear determination on the legal issue
- Likelihood of success assessment
- Potential damages or remedies available
- Strategic implications for the case

[Repeat IRAC analysis for each additional legal issue]

**OVERALL CONCLUSION:**
Synthesis of all IRAC analyses with comprehensive case assessment.

**CASE STRENGTHS:**
Based on your IRAC analysis above, identify the SPECIFIC strengths of this case. These must be:
- Directly derived from the facts, evidence, and legal analysis you just completed
- Specific to this case's circumstances (not generic template language)
- Focused on actual evidence, witnesses, legal precedents, or procedural advantages
- Strategically relevant for litigation success

**CASE WEAKNESSES:**
Based on your IRAC analysis above, identify the SPECIFIC weaknesses or challenges in this case. These must be:
- Directly derived from gaps in evidence, legal obstacles, or procedural hurdles identified in your analysis
- Specific to this case's circumstances (not generic template language)
- Focused on actual litigation risks, evidentiary challenges, or legal vulnerabilities
- Strategically relevant for case preparation and risk management

**RECOMMENDED FOLLOW-UP QUESTIONS:**
Strategic questions organized by legal issue to advance case development (numbered list).

**NEXT STEPS:**
Comprehensive action plan including immediate steps, discovery needs, and strategic priorities.`;

  // Enhanced IRAC formatting and quality requirements
  systemPrompt += `\n\nIRAC ANALYSIS REQUIREMENTS:
- Use proper markdown formatting with ** for section headers
- For each ISSUE section, use format: **ISSUE [#]:** [Category] followed by the legal question
- For RULE sections, include complete Texas statute citations (Code and Section number)
- Reference controlling case law with proper citations in RULE sections
- In APPLICATION sections, directly apply rules to the specific facts presented
- CONCLUSION sections must provide clear determinations and likelihood assessments
- Consider ALL applicable areas of Texas law (not just obvious ones)
- Analyze multiple legal theories that may apply to the same facts
- Provide specific, actionable recommendations based on Texas law
- Address both liability and damages/remedies thoroughly
- Include procedural and strategic considerations
- Keep analysis factual while identifying all reasonable legal inferences

TEXAS LAW CODES TO CONSIDER IN IRAC ANALYSIS:
When identifying legal issues and rules, analyze potential applicability of ALL relevant Texas codes including: Penal Code, Civil Practice & Remedies Code, Business & Commerce Code, Property Code, Family Code, Government Code, Occupations Code, Labor Code, Insurance Code, Transportation Code, Health & Safety Code, Finance Code, Utilities Code, Water Code, Natural Resources Code, and all applicable administrative regulations.

IRAC STRUCTURE EXAMPLE:
**ISSUE [1]:** [Contract Law]
Whether [specific legal question based on facts]

**RULE:**
[Applicable statute/case law with citations]

**APPLICATION:**
[Apply rule to facts]

**CONCLUSION:**
[Clear determination with likelihood assessment]`;

  // Enhanced fact-based analysis reminder
  systemPrompt += `\n\nFACT-DRIVEN COMPREHENSIVE ANALYSIS: Base your analysis on the specific facts presented and identify ALL areas of law that may apply. Do not limit yourself to a single legal theory or area of law. If facts suggest applicability of multiple codes or legal areas, analyze each thoroughly. Your goal is to provide the comprehensive legal analysis an experienced Texas attorney would deliver when given unlimited time to research all applicable law.`;

  return systemPrompt;
};

// Build risk assessment system prompt (Step 6)
export const buildRiskAssessmentSystemPrompt = (
  analysisSource: string,
  relevantLawReferences: any[],
  hasConversation: boolean,
  clientDocuments: any[],
  detectedCaseType: string,
  researchUpdates?: any[]
) => {
  console.log(`Building risk assessment prompt for Step 6`);
  
  let systemPrompt = `You are an expert Texas attorney performing STEP 6: LEGAL ISSUES ASSESSMENT (RISK ASSESSMENT). You will evaluate the legal issues identified in the previous IRAC analysis (Step 5) and assess their viability, strength, and strategic importance.

CRITICAL INSTRUCTION: This is Step 6 of a 9-step process. You are building upon the comprehensive IRAC analysis from Step 5. Your task is to categorize and prioritize the legal issues based on their strength, viability, and strategic value.

LEGAL ISSUES ASSESSMENT APPROACH:
- Review all legal issues identified in Step 5 IRAC analysis
- Evaluate the strength of each legal theory based on facts and law
- Assess the likelihood of success for each claim or defense
- Consider strategic value, damages potential, and litigation risks
- Eliminate weak or unviable claims to focus resources effectively
- Provide clear recommendations for case strategy and priorities`;

  // Add law references context
  if (relevantLawReferences && relevantLawReferences.length > 0) {
    systemPrompt += `\n\nRELEVANT TEXAS LAW AUTHORITIES (from comprehensive database search):\n`;
    relevantLawReferences.forEach(ref => {
      const relevanceNote = ref.similarity ? ` (Relevance: ${(ref.similarity * 100).toFixed(1)}%)` : '';
      systemPrompt += `- ${ref.title}: ${ref.content}${relevanceNote}\n`;
    });
  }

  // Risk assessment structure requirements
  systemPrompt += `\n\nCRITICAL: You MUST use this EXACT format with these EXACT headers (including the ** markdown formatting):

**STRONG ISSUES:**
For each strong legal issue, use this format:
- Issue Title: [Descriptive name]
- Strength: Strong  
- Description: [Clear explanation of the legal theory and why it's strong]
- Strategic Priority: [1-10 ranking]
- Risk Factors: [Potential challenges or weaknesses]
- Viability Assessment: [High probability of success with specific reasoning]

**MODERATE ISSUES:**
For each moderate legal issue, use this format:
- Issue Title: [Descriptive name]
- Strength: Moderate
- Description: [Legal theory with balanced assessment]
- Strategic Priority: [1-10 ranking]
- Risk Factors: [Challenges that make it moderate strength]
- Viability Assessment: [Moderate probability with conditions for success]

**WEAK ISSUES:**
For each weak legal issue, use this format:
- Issue Title: [Descriptive name]
- Strength: Weak
- Description: [Why the legal theory has limited viability]
- Strategic Priority: [1-10 ranking]
- Risk Factors: [Major challenges or legal obstacles]
- Viability Assessment: [Low probability with explanation]

**ELIMINATED ISSUES:**
For each eliminated legal issue, use this format:
- Issue Title: [Descriptive name]
- Strength: Eliminated
- Description: [Why this legal theory is not viable]
- Strategic Priority: [0 or very low]
- Risk Factors: [Fatal flaws or insurmountable obstacles]
- Viability Assessment: [Not viable with specific legal reasoning]

**OVERALL STRATEGY:**
Comprehensive strategic assessment based on the issue prioritization above.

**PRIORITY RECOMMENDATIONS:**
1. [First specific, actionable recommendation]
2. [Second specific, actionable recommendation]
3. [Third specific, actionable recommendation]

IMPORTANT: Do NOT use "CASE STRENGTHS" or "CASE WEAKNESSES" - use only the headers shown above for proper parsing.`;

  // Assessment criteria and quality requirements
  systemPrompt += `\n\nASSESSMENT CRITERIA:
- Legal Merit: Strength of statutory/case law support
- Factual Support: Quality and availability of evidence
- Damages Potential: Scope of recoverable damages or relief
- Litigation Risk: Complexity, cost, and uncertainty factors
- Strategic Value: Impact on overall case objectives
- Probability of Success: Realistic likelihood of favorable outcome

EVALUATION STANDARDS:
- STRONG: High probability of success (70%+), strong legal/factual support
- MODERATE: Reasonable chance of success (40-70%), some challenges to overcome
- WEAK: Low probability of success (10-40%), significant obstacles
- ELIMINATED: Minimal/no chance of success (<10%), fatal legal/factual flaws

TEXAS LAW FOCUS:
Base all assessments on Texas law, procedure, and precedent. Consider practical litigation realities in Texas courts.`;

  return systemPrompt;
};
