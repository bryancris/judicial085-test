
// Build contract information section
export function buildContractSection(contracts: any[]) {
  if (!contracts || contracts.length === 0) {
    return "\n\n## CONTRACT INFORMATION\nNo contracts have been uploaded yet. You are providing general contract review advice.";
  }
  
  let sectionText = "\n\n## CONTRACT INFORMATION\n";
  
  // Extract any contract details available
  // This would be expanded when we implement contract uploads later
  sectionText += "The following contract questions have been asked by the attorney:\n";
  
  contracts.forEach((contract, index) => {
    sectionText += `${index + 1}. ${contract.content}\n`;
  });
  
  return sectionText;
}
