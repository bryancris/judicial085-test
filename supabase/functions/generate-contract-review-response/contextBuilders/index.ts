
// Main module that assembles all context components for contract reviews
import { buildClientSection } from "./clientSectionBuilder.ts";
import { buildContractSection } from "./contractSectionBuilder.ts";
import { buildContractHistorySection } from "./contractHistoryBuilder.ts";
import { buildInstructionsSection } from "./instructionsBuilder.ts";

// Assemble the complete context for contract review
export const buildCompleteContext = (
  clientData: any, 
  clientError: any, 
  contractsData: any[], 
  contractHistory: any[],
  currentMessage: string
) => {
  // Client identification is the most critical context - place it at the beginning
  let contextText = "IMPORTANT CONTEXT FOR CONTRACT REVIEW - READ CAREFULLY:";
  
  // Handle client data
  if (clientError) {
    console.error('Error fetching client data:', clientError);
    contextText += "\nWARNING: Unable to fetch client details for this conversation.";
  } else if (clientData) {
    // Add prominent client identification
    contextText += `\n\nYou are reviewing contracts for CLIENT: ${clientData.first_name} ${clientData.last_name}.\n`;
    contextText += `THIS IS ${clientData.first_name} ${clientData.last_name}'s CASE.\n`;
    
    const clientSection = buildClientSection(clientData);
    contextText += clientSection;
  } else {
    contextText += "\nWARNING: No client data available. You are unable to provide specific contract advice.";
  }
  
  // Add contract information if available
  const contractSection = buildContractSection(contractsData);
  if (contractSection) {
    contextText += contractSection;
  }
  
  // Add contract review history for context
  const historySection = buildContractHistorySection(contractHistory);
  if (historySection) {
    contextText += historySection;
  }
  
  // Add specific instructions for the AI
  contextText += buildInstructionsSection();
  
  // Add final explicit directive to reference the client's information in EVERY response
  if (clientData) {
    contextText += `\n\nCRITICAL REMINDER: You are a legal assistant specializing in contract review. Address ${clientData.first_name} ${clientData.last_name}'s contract questions with specific legal expertise.`;
  }
  
  // Log a sample of the context for debugging
  console.log("Sample of contract review context (first 500 chars):");
  console.log(contextText.substring(0, 500) + "...");
  
  return contextText;
};
