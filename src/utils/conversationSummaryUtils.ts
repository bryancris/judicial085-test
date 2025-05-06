
// Create a conversation summary from messages
export const createConversationSummary = (messages: any[]): string => {
  if (!messages || messages.length === 0) {
    return "No conversation data available.";
  }
  
  // Count the frequency of key terms to identify main topics
  const keyTerms: Record<string, number> = {};
  
  messages.forEach(msg => {
    const content = msg.content.toLowerCase();
    
    // List of potential legal terms to track
    const legalTerms = [
      "injury", "accident", "witness", "evidence", "damages",
      "liability", "negligence", "compensation", "settlement",
      "police", "report", "insurance", "medical", "treatment",
      "property", "contract", "agreement", "document", "payment",
      "lawsuit", "claim", "court", "judge", "trial"
    ];
    
    legalTerms.forEach(term => {
      if (content.includes(term)) {
        keyTerms[term] = (keyTerms[term] || 0) + 1;
      }
    });
  });
  
  // Sort terms by frequency
  const sortedTerms = Object.entries(keyTerms)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);
  
  // Generate summary based on client-attorney conversation
  let summary = "This consultation addressed ";
  
  if (sortedTerms.length > 0) {
    summary += `${sortedTerms.slice(0, -1).join(", ")}`;
    if (sortedTerms.length > 1) {
      summary += ` and ${sortedTerms[sortedTerms.length - 1]}`;
    }
    summary += ". ";
  } else {
    summary += "various legal matters. ";
  }
  
  // Add info about the conversation length
  summary += `The conversation consisted of ${messages.length} exchanges between the attorney and client. `;
  
  // Determine if it was an initial consultation or follow-up
  const isInitial = messages.some(msg => 
    msg.content.toLowerCase().includes("first time") || 
    msg.content.toLowerCase().includes("initial consultation")
  );
  
  if (isInitial) {
    summary += "This appears to be an initial consultation to gather case information. ";
  } else {
    summary += "This appears to be a follow-up discussion to address specific case details. ";
  }
  
  // Add a concluding statement
  summary += "Key details from the conversation have been analyzed for the case evaluation.";
  
  return summary;
};
