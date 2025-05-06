
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
  caseDetailsSection += `\nContact: ${clientData.email} | ${clientData.phone}`;
  
  return { clientSection, caseTypesSection, caseDetailsSection };
};

// Build legal analysis section
export const buildLegalAnalysisSection = (analysisData: any) => {
  let legalAnalysisText = "\n\n## LEGAL ANALYSIS";
  
  if (analysisData && analysisData.length > 0) {
    const analysisContent = analysisData[0].content;
    
    // Try to parse and highlight key sections from analysis
    try {
      // Check if there are sections that can be identified
      let structuredAnalysis = "";
      
      // Extract key sections from the legal analysis text
      if (analysisContent.includes("Relevant Law")) {
        const relevantLawMatch = analysisContent.match(/Relevant Law[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
        if (relevantLawMatch && relevantLawMatch[1]) {
          structuredAnalysis += `\n\nRELEVANT LAW: ${relevantLawMatch[1].trim()}`;
        }
      }
      
      // Extract strengths and weaknesses
      const strengthsMatch = analysisContent.match(/Strengths[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
      const weaknessesMatch = analysisContent.match(/Weaknesses[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
      
      if (strengthsMatch && strengthsMatch[1]) {
        structuredAnalysis += `\n\nCASE STRENGTHS: ${strengthsMatch[1].trim()}`;
      }
      
      if (weaknessesMatch && weaknessesMatch[1]) {
        structuredAnalysis += `\n\nCASE WEAKNESSES: ${weaknessesMatch[1].trim()}`;
      }
      
      // If we extracted structured data, use it; otherwise use full analysis
      if (structuredAnalysis) {
        legalAnalysisText += structuredAnalysis;
      } else {
        legalAnalysisText += `\n${analysisContent}`;
      }
    } catch (parseError) {
      // If parsing fails, use the raw analysis
      legalAnalysisText += `\n${analysisContent}`;
    }
  } else {
    legalAnalysisText += `\nNo legal analysis has been generated for this case yet.`;
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
8. IMPORTANT: Always base your responses on the case information provided, not general legal knowledge.`;
};

// Assemble the complete context
export const buildCompleteContext = (
  clientData: any, 
  clientError: any, 
  analysisData: any, 
  notesData: any, 
  messagesData: any
) => {
  // Start with a clear identity statement that prioritizes client awareness
  let contextText = "You are an AI legal assistant helping an attorney with a specific client case. ";
  
  // Handle client data
  if (clientError) {
    console.error('Error fetching client data:', clientError);
    contextText += "\nWARNING: Unable to fetch client details for this conversation.";
  } else if (clientData) {
    // Add prominent client identification at the very beginning
    contextText += `\n\nTHIS CONVERSATION IS ABOUT CLIENT: ${clientData.first_name} ${clientData.last_name}. `;
    contextText += `Always acknowledge this client by name in your responses.`;
    
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
  
  // Add final explicit directive to reference the client's information
  if (clientData) {
    contextText += `\n\n9. CRITICAL: You MUST address the client by name (${clientData.first_name} ${clientData.last_name}) in every response and reference their specific case details.`;
  }
  
  // Log full context for debugging purposes
  console.log("Full context being sent to OpenAI:");
  console.log(contextText);
  
  return contextText;
};
