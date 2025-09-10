// Utility functions for extracting structured data from analysis content

export function extractStrengthsWeaknesses(content: string): { strengths: string[], weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  if (!content) return { strengths, weaknesses };
  
  // Look for CASE STRENGTHS section
  const strengthsMatch = content.match(/\*\*CASE STRENGTHS:\*\*(.*?)(?=\*\*|$)/is);
  if (strengthsMatch) {
    const strengthsText = strengthsMatch[1];
    // Extract numbered or bulleted items
    const strengthItems = strengthsText.match(/(?:^\d+\.|^[-•*])\s*(.+?)$/gm);
    if (strengthItems) {
      strengthItems.forEach(item => {
        const cleaned = item.replace(/^\d+\.|^[-•*]\s*/, '').trim();
        if (cleaned) strengths.push(cleaned);
      });
    }
  }
  
  // Look for CASE WEAKNESSES section
  const weaknessesMatch = content.match(/\*\*CASE WEAKNESSES:\*\*(.*?)(?=\*\*|$)/is);
  if (weaknessesMatch) {
    const weaknessesText = weaknessesMatch[1];
    // Extract numbered or bulleted items
    const weaknessItems = weaknessesText.match(/(?:^\d+\.|^[-•*])\s*(.+?)$/gm);
    if (weaknessItems) {
      weaknessItems.forEach(item => {
        const cleaned = item.replace(/^\d+\.|^[-•*]\s*/, '').trim();
        if (cleaned) weaknesses.push(cleaned);
      });
    }
  }
  
  return { strengths, weaknesses };
}