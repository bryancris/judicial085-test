
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
  // Route to appropriate prompt builder based on step type
  if (stepType === 'preliminary-analysis') {
    return buildPreliminarySystemPrompt(
      analysisSource,
      relevantLawReferences,
      hasConversation,
      clientDocuments,
      detectedCaseType,
      researchUpdates
    );
  }
  
  // Default to IRAC analysis for backwards compatibility
  return buildIracSystemPrompt(
    analysisSource,
    relevantLawReferences,
    hasConversation,
    clientDocuments,
    detectedCaseType,
    researchUpdates
  );
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
  systemPrompt += `\n\nREQUIRED PRELIMINARY ANALYSIS STRUCTURE:\n\n**PRELIMINARY ANALYSIS:**\n\n**POTENTIAL LEGAL THEORIES:**\n- List likely theories by area (e.g., express warranty, implied warranty of merchantability, implied warranty of fitness, Texas Lemon Law, DTPA, negligence, fraud).\n\n**ELEMENTS ANALYSIS:**\n- Brief element-level notes for the top 3–6 theories (no citations).\n\n**AVAILABLE DEFENSES:**\n- Likely defenses based on the facts.\n\n**DAMAGES:**\n- Potential remedies/damages relevant to the facts.\n\n**EVIDENCE:**\n- Key documents, testimony, or expert proof needed.\n\n**STRATEGIC CONSIDERATIONS:**\n- Early tactics, information gaps, and next steps.`;

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
Favorable factors and strong legal arguments from IRAC analysis.

**CASE WEAKNESSES:**
Potential challenges and vulnerabilities identified in IRAC analysis.

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
