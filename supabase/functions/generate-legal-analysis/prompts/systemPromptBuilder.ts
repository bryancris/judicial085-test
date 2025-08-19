
// Build comprehensive system prompt for legal analysis generation
export const buildSystemPrompt = (
  analysisSource: string,
  relevantLawReferences: any[],
  hasConversation: boolean,
  clientDocuments: any[],
  detectedCaseType: string,
  researchUpdates?: any[],
  domainHint?: string
) => {
  const effectiveCaseType = domainHint || detectedCaseType;
  console.log(`Building system prompt with effective case type: ${effectiveCaseType}`);
  
  let systemPrompt = `You are an expert Texas attorney providing detailed legal analysis. You will analyze the provided ${analysisSource} and generate a comprehensive legal assessment.`;

  // Add domain-specific instructions based on case type
  if (effectiveCaseType === "consumer-protection") {
    systemPrompt += `\n\nCRITICAL DOMAIN FOCUS: This is a consumer protection case under Texas and federal law. You MUST focus exclusively on:
- Texas Deceptive Trade Practices-Consumer Protection Act (DTPA) - Texas Business & Commerce Code § 17.41 et seq.
- Texas Debt Collection Act (TDCA) - Texas Finance Code Chapter 392
- Fair Debt Collection Practices Act (FDCPA) - 15 U.S.C. § 1692 et seq.
- Fair Credit Reporting Act (FCRA) - 15 U.S.C. § 1681 et seq.
- Consumer Financial Protection Bureau (CFPB) regulations

DO NOT include content about real estate law, property law, premises liability, trespass to try title, adverse possession, easements, or Texas Property Code unless explicitly and directly relevant to consumer protection violations.`;
  } else if (effectiveCaseType === "animal-protection") {
    systemPrompt += `\n\nCASE TYPE FOCUS: This involves animal protection and safety issues under Texas Health & Safety Code Chapter 822 and related statutes.`;
  } else if (effectiveCaseType === "personal-injury") {
    systemPrompt += `\n\nCASE TYPE FOCUS: This is a personal injury matter involving Texas tort law, negligence principles, and damage calculations.`;
  }

  // Add law references if available
  if (relevantLawReferences && relevantLawReferences.length > 0) {
    systemPrompt += `\n\nRELEVANT LEGAL AUTHORITIES:\n`;
    relevantLawReferences.forEach(ref => {
      systemPrompt += `- ${ref.title}: ${ref.content}\n`;
    });
  }

  // Add document context
  if (clientDocuments && clientDocuments.length > 0) {
    systemPrompt += `\n\nDOCUMENT CONTEXT: You have access to ${clientDocuments.length} client document(s) that should be referenced in your analysis.`;
  }

  // Add research updates context
  if (researchUpdates && researchUpdates.length > 0) {
    systemPrompt += `\n\nRESEARCH INTEGRATION: You have ${researchUpdates.length} research update(s) to integrate into your analysis. These should be woven into the appropriate sections rather than kept as separate updates.`;
  }

  // Core analysis structure requirements
  systemPrompt += `\n\nYour analysis must include these sections with proper markdown formatting:

**CASE SUMMARY:**
Concise overview of the legal matter and key facts.

**RELEVANT TEXAS LAW:**
Applicable statutes, regulations, and case law with specific citations.`;

  // Case-type specific requirements
  if (effectiveCaseType === "consumer-protection") {
    systemPrompt += `
Focus on DTPA violations, FDCPA violations, debt collection practices, and consumer remedies.`;
  }

  systemPrompt += `

**PRELIMINARY ANALYSIS:**
Detailed legal analysis applying law to facts.

**CASE STRENGTHS:**
Favorable factors and strong legal arguments.

**CASE WEAKNESSES:**
Potential challenges and opposing arguments.

**POTENTIAL LEGAL ISSUES:**
Key legal questions and complications.

**RECOMMENDED FOLLOW-UP QUESTIONS:**
Specific questions to gather additional information (numbered list).

**NEXT STEPS:**
Recommended actions and strategy.`;

  // Add specific formatting and quality requirements
  systemPrompt += `\n\nFORMATTING REQUIREMENTS:
- Use proper markdown formatting with ** for section headers
- Include specific Texas statute citations where applicable
- Reference case law with proper citations when relevant
- Keep analysis factual and professional
- Avoid speculation beyond reasonable legal inferences
- Provide actionable recommendations`;

  // Add domain constraint reminder if domain locked
  if (domainHint) {
    systemPrompt += `\n\nDOMAIN CONSTRAINT REMINDER: This analysis is domain-locked to ${domainHint}. Ensure all content relates specifically to this area of law and avoid drift into unrelated legal domains.`;
  }

  return systemPrompt;
};
