
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
