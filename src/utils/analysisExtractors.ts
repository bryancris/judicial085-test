// Utility functions for extracting structured data from analysis content

export function extractStrengthsWeaknesses(content: string): { strengths: string[], weaknesses: string[] } {
  console.log('🔍 Enhanced extraction of strengths/weaknesses from analysis content');
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  if (!content) {
    console.log('❌ No content provided for extraction');
    return { strengths, weaknesses };
  }
  
  // Look for CASE STRENGTHS section with multiple pattern variations
  const strengthsPatterns = [
    /\*\*CASE STRENGTHS:\*\*(.*?)(?=\*\*|$)/is,
    /\*\*STRENGTHS:\*\*(.*?)(?=\*\*|$)/is,
    /(?:^|\n)\s*CASE STRENGTHS:\s*(.*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/is,
    /(?:^|\n)\s*STRENGTHS:\s*(.*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/is
  ];
  
  let strengthsMatch = null;
  for (const pattern of strengthsPatterns) {
    strengthsMatch = content.match(pattern);
    if (strengthsMatch) {
      console.log('✅ Found CASE STRENGTHS section');
      break;
    }
  }
  
  if (strengthsMatch) {
    const strengthsText = strengthsMatch[1];
    // Extract numbered, bulleted, or line-separated items
    const strengthItems = strengthsText.match(/(?:^\d+\.|^[-•*]|^-)\s*(.+?)$/gm) || 
                          strengthsText.split('\n').filter(line => line.trim().length > 10);
    
    if (strengthItems) {
      strengthItems.forEach(item => {
        const cleaned = item.replace(/^\d+\.|^[-•*-]\s*/, '').trim();
        if (cleaned && cleaned.length > 10 && !isGenericStrengthWeakness(cleaned)) {
          strengths.push(cleaned);
        }
      });
      console.log(`✅ Extracted ${strengths.length} case-specific strengths`);
    }
  }
  
  // Look for CASE WEAKNESSES section with multiple pattern variations
  const weaknessesPatterns = [
    /\*\*CASE WEAKNESSES:\*\*(.*?)(?=\*\*|$)/is,
    /\*\*WEAKNESSES:\*\*(.*?)(?=\*\*|$)/is,
    /(?:^|\n)\s*CASE WEAKNESSES:\s*(.*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/is,
    /(?:^|\n)\s*WEAKNESSES:\s*(.*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/is
  ];
  
  let weaknessesMatch = null;
  for (const pattern of weaknessesPatterns) {
    weaknessesMatch = content.match(pattern);
    if (weaknessesMatch) {
      console.log('✅ Found CASE WEAKNESSES section');
      break;
    }
  }
  
  if (weaknessesMatch) {
    const weaknessesText = weaknessesMatch[1];
    // Extract numbered, bulleted, or line-separated items
    const weaknessItems = weaknessesText.match(/(?:^\d+\.|^[-•*]|^-)\s*(.+?)$/gm) ||
                          weaknessesText.split('\n').filter(line => line.trim().length > 10);
    
    if (weaknessItems) {
      weaknessItems.forEach(item => {
        const cleaned = item.replace(/^\d+\.|^[-•*-]\s*/, '').trim();
        if (cleaned && cleaned.length > 10 && !isGenericStrengthWeakness(cleaned)) {
          weaknesses.push(cleaned);
        }
      });
      console.log(`✅ Extracted ${weaknesses.length} case-specific weaknesses`);
    }
  }
  
  console.log(`📊 Final extraction results: ${strengths.length} strengths, ${weaknesses.length} weaknesses`);
  return { strengths, weaknesses };
}

// Helper function to detect and filter out generic template language
function isGenericStrengthWeakness(text: string): boolean {
  const lowerText = text.toLowerCase();
  const genericPhrases = [
    "strong documentary evidence available",
    "clear liability chain established",
    "damages are well-documented",
    "favorable legal precedents exist",
    "potential credibility challenges",
    "complex factual issues to resolve",
    "opposing counsel likely to dispute key facts",
    "burden of proof considerations",
    "documentary evidence supports client",
    "legal precedent favors our arguments",
    "burden of proof challenges may arise",
    "damages calculation requires further documentation"
  ];
  
  return genericPhrases.some(phrase => lowerText.includes(phrase));
}