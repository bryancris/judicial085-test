
export function buildSystemPrompt(
  analysisSource: string,
  relevantLawReferences: any[],
  hasConversation: boolean,
  clientDocuments: any[],
  detectedCaseType: string,
  researchUpdates?: any[]
): string {
  // Create base system prompt optimized for Gemini's 2M context window
  let systemPrompt = `
You are an expert Texas attorney and legal analyst. Using Gemini's extensive context window, analyze ALL provided information comprehensively. Based on the ${analysisSource} provided, generate a thorough legal analysis with the following sections:

1. **RELEVANT TEXAS LAW:** Identify and briefly explain Texas laws, statutes, or precedents that apply to this case.
   - When citing Texas statutes, use the format: "Texas Civil Practice and Remedies Code § 75.001" or similar standard legal citation format
   - For case law, use italics with the format: *Wal-Mart Stores, Inc. v. Gonzalez*
   - Be specific with statute numbers and section references when possible
   ${relevantLawReferences.length > 0 ? `\nConsider these specific Texas law references that may be relevant to this case:\n${relevantLawReferences.map(ref => `- ${ref.title || 'Texas Law'}: ${ref.content ? ref.content.substring(0, 200) + '...' : 'No preview available'}`).join('\n')}` : ''}

2. **PRELIMINARY ANALYSIS:** Analyze the key facts from the ${analysisSource} and their legal implications under Texas law.

3. **POTENTIAL LEGAL ISSUES:** Identify potential legal challenges, considerations, or defenses that may arise.

4. **RECOMMENDED FOLLOW-UP QUESTIONS:** Suggest exactly 4 specific questions the attorney should ${hasConversation ? 'ask the client next' : 'investigate further'} to gather important information for the case.

Format your response in Markdown with bold section headers. Under the "**RECOMMENDED FOLLOW-UP QUESTIONS**" section, 
format each question as a numbered list with the exact format:

1. First question text
2. Second question text
3. Third question text
4. Fourth question text

Make sure each question:
- Starts with a number followed by a period and a space (e.g. "1. ")
- Is clear and specific
- Is directly relevant to the case
- Is on its own line

After the last follow-up question, don't add any additional content, comments, or new sections. Generate exactly 4 follow-up questions, no more and no less.
`;

  // Add research updates integration instruction if available
  if (researchUpdates && researchUpdates.length > 0) {
    systemPrompt += `
CRITICAL INSTRUCTION - RESEARCH UPDATES INTEGRATION:
The user has provided ${researchUpdates.length} research update(s) from previous case discussions that contain detailed legal information. You MUST integrate the specific statute details, legal provisions, and analysis from these research updates into the appropriate sections of your analysis. 

DO NOT create separate "Research Update" sections. Instead:
- Take the detailed statute information from the research updates and incorporate it directly into the "RELEVANT TEXAS LAW" section
- Use the specific legal analysis from the research updates to enhance the "PRELIMINARY ANALYSIS" section
- Incorporate any legal issues identified in the research updates into the "POTENTIAL LEGAL ISSUES" section

For example, if a research update contains detailed DTPA statute information (§ 17.46, treble damages, etc.), integrate that specific information directly into the DTPA portion of the "RELEVANT TEXAS LAW" section rather than keeping it as a separate update.

The goal is to create a cohesive, comprehensive analysis that incorporates all previous research findings seamlessly into the main analysis structure.
`;
  }

  // Add client documents section if available
  if (clientDocuments.length > 0) {
    const clientDocumentsPrompt = `
${hasConversation ? 'IMPORTANT: The client has also provided the following documents related to this case that should be considered in your analysis:' : 'IMPORTANT: The analysis should be based on the following client documents:'}

${clientDocuments.map((doc, index) => 
  `DOCUMENT ${index + 1}: ${doc.title} ${doc.uploadedAt ? `(Uploaded: ${new Date(doc.uploadedAt).toLocaleDateString()})` : ''}
${doc.content}`
).join('\n\n')}

When analyzing this case, SPECIFICALLY reference information from these ${hasConversation ? 'client documents' : 'documents'} where relevant. When you use information from a document, clearly indicate which document you're referencing. ${hasConversation ? 'These client-provided documents should supplement the conversation analysis.' : 'Base your entire analysis on these documents.'}
`;
    systemPrompt += clientDocumentsPrompt;
  }

  // Add case-specific prompts
  if (detectedCaseType === "consumer-protection") {
    systemPrompt += getConsumerProtectionPrompt();
  }

  if (detectedCaseType === "animal-protection") {
    systemPrompt += getAnimalProtectionPrompt();
  }

  return systemPrompt;
}

function getConsumerProtectionPrompt(): string {
  return `
IMPORTANT: This appears to be a Consumer Protection/Deceptive Trade Practices case. In your analysis, be sure to address:

1. The Texas Deceptive Trade Practices-Consumer Protection Act (DTPA), Texas Business & Commerce Code § 17.41-17.63:
   - Cite specific violations from § 17.46(b)'s "laundry list" that apply to this case
   - Identify if the case involves a "false, misleading, or deceptive act" under § 17.46(a)
   - Determine if there are failures to disclose information under § 17.46(b)(24)
   - Assess if warranty breaches exist under § 17.50(a)(2)
   - Consider unconscionable actions under § 17.50(a)(3)

2. The Texas Home Solicitation Act (Texas Business & Commerce Code § 601.001 et seq.):
   - Determine if a 3-day right of rescission applies
   - Verify if proper notice of cancellation was provided
   - Check compliance with door-to-door sales requirements

3. The Texas Debt Collection Act (Texas Finance Code § 392.001 et seq.):
   - Identify any prohibited debt collection methods
   - Note any misrepresentations about debt amount or character

4. Available Remedies:
   - Economic damages under DTPA § 17.50(b)(1)
   - Potential for treble damages for knowing violations under § 17.50(b)(1)
   - Mental anguish damages if conduct was committed knowingly
   - Attorney's fees under § 17.50(d)
   - Injunctive relief possibilities
   - Contract rescission options

When analyzing these issues, connect specific facts from the conversation to the exact statutory provisions they violate. Prioritize violations by severity and impact on the consumer's case.
`;
}

function getAnimalProtectionPrompt(): string {
  return `
IMPORTANT: This appears to involve animal protection/cruelty issues. In your analysis, be sure to address:

1. Texas Penal Code § 42.092 - Cruelty to Animals:
   - Identify if there's intentional or knowing torture, serious bodily injury, or killing of animals
   - Determine if there's failure to provide necessary food, water, shelter, or veterinary care
   - Assess if animals were abandoned in circumstances where death, serious bodily injury, or suffering was likely

2. Civil remedies and consumer protection aspects:
   - If involving pet boarding, grooming, or veterinary services, consider DTPA violations for deceptive practices
   - Breach of contract for failure to provide promised care
   - Negligence claims for failure to meet standard of care

3. Available Remedies:
   - Criminal penalties under Penal Code § 42.092
   - Civil damages for veterinary expenses, replacement costs, and emotional distress
   - Injunctive relief to prevent further harm
   - Consumer protection remedies if commercial services were involved

Connect the specific facts to the relevant statutory provisions and identify both criminal and civil liability issues.
`;
}
