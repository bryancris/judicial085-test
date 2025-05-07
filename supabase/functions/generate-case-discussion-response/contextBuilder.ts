
// Build the context for the AI based on client data
export const buildClientSection = (clientData: any) => {
  if (!clientData) return { clientSection: "", caseTypesSection: "", caseDetailsSection: "" };
  
  let clientSection = `\n\n## CLIENT INFORMATION\nName: ${clientData.first_name} ${clientData.last_name}`;
  
  // Add case types as a primary context element if available
  let caseTypesSection = "";
  if (clientData.case_types && clientData.case_types.length > 0) {
    caseTypesSection = `\n\n## CASE TYPE\n${clientData.case_types.join(", ")}`;
  }
  
  // Build comprehensive case details section
  let caseDetailsSection = "\n\n## CASE DETAILS";
  
  // Add case number if available
  if (clientData.case_number) {
    caseDetailsSection += `\nCase Number: ${clientData.case_number}`;
  }
  
  // Add case notes if available - critical for context
  if (clientData.case_notes) {
    caseDetailsSection += `\n\nCase Notes: ${clientData.case_notes}`;
  }
  
  // Add address information if available
  let addressInfo = "";
  if (clientData.address) {
    addressInfo += clientData.address;
    if (clientData.city) addressInfo += `, ${clientData.city}`;
    if (clientData.state) addressInfo += `, ${clientData.state}`;
    if (clientData.zip_code) addressInfo += ` ${clientData.zip_code}`;
    
    if (addressInfo) {
      caseDetailsSection += `\n\nClient Address: ${addressInfo}`;
    }
  }
  
  // Add contact information
  caseDetailsSection += `\nContact: ${clientData.email || 'N/A'} | ${clientData.phone || 'N/A'}`;
  
  return { clientSection, caseTypesSection, caseDetailsSection };
};

// Build legal analysis section with enhanced formatting and extraction
export const buildLegalAnalysisSection = (analysisData: any) => {
  let legalAnalysisText = "\n\n## LEGAL ANALYSIS";
  
  if (analysisData && analysisData.length > 0) {
    console.log("Processing legal analysis with length: " + analysisData[0].content.length);
    const analysisContent = analysisData[0].content;
    
    // Try to parse and highlight key sections from analysis with more detailed extraction
    try {
      // Log the first part of analysis content to help with debugging
      console.log("Analysis content preview: " + analysisContent.substring(0, 200) + "...");
      
      // Extract more structured data from the legal analysis
      let structuredAnalysis = "";
      
      // First look for case type information
      const caseTypeMatch = analysisContent.match(/Case Type[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
      if (caseTypeMatch && caseTypeMatch[1]) {
        structuredAnalysis += `\n\nCASE TYPE: ${caseTypeMatch[1].trim()}`;
        console.log("Found case type in analysis: " + caseTypeMatch[1].trim());
      }
      
      // Extract relevant laws section - expanded pattern matching
      if (analysisContent.includes("Relevant Law") || analysisContent.includes("Applicable Law")) {
        const relevantLawMatch = analysisContent.match(/(Relevant|Applicable) Law[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
        if (relevantLawMatch && relevantLawMatch[2]) {
          structuredAnalysis += `\n\nRELEVANT LAW: ${relevantLawMatch[2].trim()}`;
          console.log("Found relevant law section with length: " + relevantLawMatch[2].trim().length);
        }
      }
      
      // Extract case facts if available
      const factsMatch = analysisContent.match(/(?:Case Facts|Facts of the Case)[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
      if (factsMatch && factsMatch[1]) {
        structuredAnalysis += `\n\nCASE FACTS: ${factsMatch[1].trim()}`;
        console.log("Found case facts section");
      }
      
      // Extract strengths and weaknesses with improved pattern matching
      const strengthsMatch = analysisContent.match(/(?:Strengths|Case Strengths|Pros)[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
      const weaknessesMatch = analysisContent.match(/(?:Weaknesses|Case Weaknesses|Cons)[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
      
      if (strengthsMatch && strengthsMatch[1]) {
        structuredAnalysis += `\n\nCASE STRENGTHS: ${strengthsMatch[1].trim()}`;
        console.log("Found case strengths section");
      }
      
      if (weaknessesMatch && weaknessesMatch[1]) {
        structuredAnalysis += `\n\nCASE WEAKNESSES: ${weaknessesMatch[1].trim()}`;
        console.log("Found case weaknesses section");
      }
      
      // Extract legal strategy if available
      const strategyMatch = analysisContent.match(/(?:Legal Strategy|Strategy|Approach)[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
      if (strategyMatch && strategyMatch[1]) {
        structuredAnalysis += `\n\nLEGAL STRATEGY: ${strategyMatch[1].trim()}`;
        console.log("Found legal strategy section");
      }
      
      // Extract potential outcomes if available
      const outcomesMatch = analysisContent.match(/(?:Potential Outcomes|Outcomes|Possible Results)[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
      if (outcomesMatch && outcomesMatch[1]) {
        structuredAnalysis += `\n\nPOTENTIAL OUTCOMES: ${outcomesMatch[1].trim()}`;
        console.log("Found potential outcomes section");
      }
      
      // If we extracted structured data, use it; otherwise fall back to the full analysis
      if (structuredAnalysis) {
        legalAnalysisText += structuredAnalysis;
        console.log("Using structured analysis format with sections extracted");
      } else {
        // If no structured data was extracted, use the full content but still try to format it
        console.log("No structured sections found, using full analysis content");
        
        // Try to find any section headers and format them properly
        const formattedContent = analysisContent
          .replace(/^([A-Z][A-Za-z\s]+):$/gm, '\n\n$1:') // Format section headers
          .replace(/(\n\n\n+)/g, '\n\n'); // Remove excessive newlines
          
        legalAnalysisText += `\n${formattedContent}`;
      }
    } catch (parseError) {
      // If parsing fails, use the raw analysis but log the error
      console.error("Error parsing legal analysis:", parseError);
      legalAnalysisText += `\n${analysisContent}`;
    }
  } else {
    legalAnalysisText += `\nNo legal analysis has been generated for this case yet.`;
    console.log("No legal analysis found for this client");
  }
  
  return legalAnalysisText;
};

// Build attorney notes section
export const buildAttorneyNotesSection = (notesData: any) => {
  if (!notesData || notesData.length === 0) return "";
  
  let notesSection = "\n\n## ATTORNEY NOTES";
  notesData.forEach((note: any, index: number) => {
    notesSection += `\n${index + 1}. ${note.content}`;
  });
  
  return notesSection;
};

// Build client conversation summary
export const buildClientConversationSection = (messagesData: any) => {
  if (!messagesData || messagesData.length === 0) return "";
  
  let conversationSection = "\n\n## CLIENT CONVERSATION SUMMARY";
  messagesData.forEach((msg: any, index: number) => {
    if (index < 15) { // Limit to avoid token overflow
      conversationSection += `\n${msg.role.toUpperCase()}: ${msg.content}`;
    }
  });
  
  return conversationSection;
};

// Build AI instructions section
export const buildInstructionsSection = () => {
  return `\n\n## INSTRUCTIONS
1. You are discussing THIS SPECIFIC CASE with the attorney. Always acknowledge and reference the case details in your responses.
2. Directly reference the client's name, case type, and key facts in your responses to show you are aware of the context.
3. Provide thoughtful legal analysis based on the case details provided above.
4. When citing legal principles, be as specific as possible to the laws in the client's jurisdiction.
5. If you're unsure about any details, make it clear rather than making assumptions.
6. Maintain consistent advice between conversations to avoid contradicting earlier guidance.
7. Your goal is to help the attorney develop case strategy and prepare for proceedings.
8. IMPORTANT: Always base your responses on the case information provided, not general legal knowledge.
9. MANDATORY: Begin every response by addressing the client by name.`;
};

// Assemble the complete context
export const buildCompleteContext = (
  clientData: any, 
  clientError: any, 
  analysisData: any, 
  notesData: any, 
  messagesData: any
) => {
  // Client identification is the most critical context - place it at the very beginning
  let contextText = "IMPORTANT CONTEXT - READ CAREFULLY:";
  
  // Handle client data
  if (clientError) {
    console.error('Error fetching client data:', clientError);
    contextText += "\nWARNING: Unable to fetch client details for this conversation.";
  } else if (clientData) {
    // Add prominent client identification as the FIRST thing in the context
    contextText += `\n\nYou are discussing the case of CLIENT: ${clientData.first_name} ${clientData.last_name}.\n`;
    contextText += `THIS IS ${clientData.first_name} ${clientData.last_name}'s CASE.\n`;
    contextText += `Every response MUST begin with addressing ${clientData.first_name} ${clientData.last_name} by name.`;
    
    const { clientSection, caseTypesSection, caseDetailsSection } = buildClientSection(clientData);
    
    // Assemble the context in order of importance for the AI
    // 1. Start with case type information (most important for legal context)
    if (caseTypesSection) {
      contextText += caseTypesSection;
    }
    
    // 2. Add client information
    if (clientSection) {
      contextText += clientSection;
    }
    
    // 3. Add detailed case information
    if (caseDetailsSection) {
      contextText += caseDetailsSection;
    }
  } else {
    contextText += "\nWARNING: No client data available. You are unable to provide specific case advice.";
  }
  
  // 4. Legal analysis section
  contextText += buildLegalAnalysisSection(analysisData);
  
  // Attorney notes section
  const attorneyNotesSection = buildAttorneyNotesSection(notesData);
  if (attorneyNotesSection) {
    contextText += attorneyNotesSection;
  }
  
  // Extract key facts from client conversation
  const conversationSection = buildClientConversationSection(messagesData);
  if (conversationSection) {
    contextText += conversationSection;
  }
  
  // Add specific instructions for the AI
  contextText += buildInstructionsSection();
  
  // Add final explicit directive to reference the client's information in EVERY response
  if (clientData) {
    contextText += `\n\nCRITICAL REMINDER: You MUST address ${clientData.first_name} ${clientData.last_name} by name in EVERY response and reference their specific case details. Every response must start with the client's name.`;
  }
  
  // Log a sample of the context for debugging
  console.log("Sample of context being sent to OpenAI (first 500 chars):");
  console.log(contextText.substring(0, 500) + "...");
  
  return contextText;
};
