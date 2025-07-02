
// Main module that assembles all context components for contract reviews
import { buildClientSection } from "./clientSectionBuilder.ts";
import { buildContractSection } from "./contractSectionBuilder.ts";
import { buildContractHistorySection } from "./contractHistoryBuilder.ts";
import { buildInstructionsSection } from "./instructionsBuilder.ts";
import { buildTexasLawContext } from "./texasLawContextBuilder.ts";

// Assemble the complete context for contract review
export const buildCompleteContext = async (
  clientData: any, 
  clientError: any, 
  contractsData: any[], 
  contractHistory: any[],
  currentMessage: string
) => {
  // Optimized for Gemini's 2M context window - comprehensive contract analysis
  let contextText = "COMPREHENSIVE CONTRACT REVIEW CONTEXT FOR GEMINI AI - TEXAS LAW SPECIALIZATION:";
  
  console.log("📊 Building comprehensive context for Gemini's 2M token window...");
  
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
  
  // Extract contract text from message or history for Texas law analysis
  let contractText = currentMessage;
  if (contractHistory && contractHistory.length > 0) {
    // Look for contract text in history
    for (const entry of contractHistory) {
      if (entry.role === "attorney" && entry.content.length > 500) {
        contractText += " " + entry.content; // Include longer messages as they likely contain contract text
      }
    }
  }
  
  // Add Texas law context based on the contract text
  if (contractText && contractText.length > 0) {
    const texasLawContext = await buildTexasLawContext(contractText);
    contextText += texasLawContext;
  }
  
  // Add contract review history for context
  const historySection = buildContractHistorySection(contractHistory);
  if (historySection) {
    contextText += historySection;
  }
  
  // Add specific instructions for the AI
  contextText += buildInstructionsSection();
  
  // Enhanced directive leveraging Gemini's comprehensive analysis capabilities
  if (clientData) {
    contextText += `\n\nGEMINI SPECIALIZATION DIRECTIVE: You are an expert Texas contract attorney with comprehensive legal analysis capabilities. Provide detailed contract review for ${clientData.first_name} ${clientData.last_name} using your full 2M context window to analyze ALL provided information including contract text, client history, and relevant Texas law. Reference specific statutory provisions, case law, and identify potential risks with Texas-specific legal citations.`;
  }
  
  // Log comprehensive context metrics for Gemini optimization
  console.log("📈 Gemini context metrics:", {
    totalLength: contextText.length,
    estimatedTokens: Math.ceil(contextText.length / 4), // Rough estimate
    clientDataIncluded: !!clientData,
    contractsCount: contractsData?.length || 0,
    historyCount: contractHistory?.length || 0
  });
  
  return contextText;
};
