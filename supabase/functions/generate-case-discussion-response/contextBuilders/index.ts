
// Main module that assembles all context components
import { buildClientSection } from "./clientSectionBuilder.ts";
import { buildLegalAnalysisSection } from "./legalAnalysisBuilder.ts";
import { buildAttorneyNotesSection } from "./notesBuilder.ts";
import { buildClientConversationSection } from "./conversationBuilder.ts";
import { buildInstructionsSection } from "./instructionsBuilder.ts";

// Assemble the complete context
export const buildCompleteContext = (
  clientData: any, 
  clientError: any, 
  analysisData: any, 
  notesData: any, 
  messagesData: any,
  existingAnalysisContext?: string
) => {
  // Client identification is the most critical context - place it at the very beginning
  let contextText = "IMPORTANT CONTEXT - READ CAREFULLY:";
  
  // Handle client data
  if (clientError) {
    console.error('Error fetching client data:', clientError);
    contextText += "\nWARNING: Unable to fetch client details for this conversation.";
  } else if (clientData) {
    // Add prominent client identification for the attorney's reference
    contextText += `\n\nYou are assisting with the case of CLIENT: ${clientData.first_name} ${clientData.last_name}.\n`;
    contextText += `You are speaking TO the attorney/paralegal ABOUT their client ${clientData.first_name} ${clientData.last_name}.\n`;
    contextText += `Always reference the client in third person as "your client ${clientData.first_name}" or "the client ${clientData.first_name} ${clientData.last_name}".`;
    
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
  
  // 4. Legal analysis section - include existing analysis context if available
  if (existingAnalysisContext) {
    contextText += "\n\nEXISTING LEGAL ANALYSIS CONTEXT:\n" + existingAnalysisContext;
  }
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
  
  // Add final explicit directive to maintain professional attorney-assistant relationship
  if (clientData) {
    contextText += `\n\nCRITICAL REMINDER: You are assisting the attorney/paralegal with ${clientData.first_name} ${clientData.last_name}'s case. Reference the client in third person and stick to factual legal analysis without emotional characterizations.`;
  }
  
  // Log a sample of the context for debugging
  console.log("Sample of context being sent to OpenAI (first 500 chars):");
  console.log(contextText.substring(0, 500) + "...");
  
  return contextText;
};

// Re-export all builder functions for backward compatibility
export { 
  buildClientSection,
  buildLegalAnalysisSection,
  buildAttorneyNotesSection,
  buildClientConversationSection,
  buildInstructionsSection
};
