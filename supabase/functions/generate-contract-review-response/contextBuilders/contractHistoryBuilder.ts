
// Build contract review history section
export function buildContractHistorySection(history: any[]) {
  if (!history || history.length === 0) {
    return "";
  }
  
  let sectionText = "\n\n## CONTRACT REVIEW HISTORY\n";
  sectionText += "Previous conversation about this contract:\n";
  
  // Format the conversation history
  history.forEach((item) => {
    const role = item.role === "attorney" ? "Attorney" : "AI Assistant";
    sectionText += `${role}: ${item.content}\n\n`;
  });
  
  return sectionText;
}
