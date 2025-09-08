// Build client documents section for AI context
export const buildClientDocumentsSection = (documentsData: any[]) => {
  if (!documentsData || documentsData.length === 0) {
    return "\n\n## CLIENT DOCUMENTS\nNo client documents have been uploaded or processed for this case yet.";
  }

  let documentsSection = `\n\n## CLIENT DOCUMENTS\nThe following documents have been uploaded and processed for this client:`;

  documentsData.forEach((doc, index) => {
    documentsSection += `\n\n### Document ${index + 1}: ${doc.title}`;
    
    if (doc.fileName) {
      documentsSection += `\n**File Name:** ${doc.fileName}`;
    }
    
    if (doc.uploadedAt) {
      documentsSection += `\n**Uploaded:** ${doc.uploadedAt}`;
    }
    
    if (doc.isPdfDocument) {
      documentsSection += `\n**Type:** PDF Document`;
    }
    
    documentsSection += `\n**Content Excerpt:**\n${doc.content}`;
    
    if (doc.content.endsWith('...')) {
      documentsSection += `\n*(Document excerpt truncated - full document contains additional content)*`;
    }
  });

  documentsSection += `\n\n**IMPORTANT:** When answering questions, always check if the uploaded documents contain relevant information. Reference specific documents by their title and quote relevant excerpts when appropriate. If a question can be answered using information from these documents, prioritize that over general legal knowledge.`;

  return documentsSection;
};