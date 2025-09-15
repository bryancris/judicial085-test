// Utility functions for extracting structured data from analysis content

export function extractStrengthsWeaknesses(content: string): { strengths: string[], weaknesses: string[] } {
  console.log('🔍 Enhanced extraction of strengths/weaknesses from analysis content');
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  if (!content) {
    console.log('❌ No content provided for extraction');
    return { strengths, weaknesses };
  }
  
  // First try to find explicit CASE STRENGTHS/WEAKNESSES sections
  const explicitStrengths = extractExplicitSection(content, 'STRENGTHS');
  const explicitWeaknesses = extractExplicitSection(content, 'WEAKNESSES');
  
  if (explicitStrengths.length > 0 || explicitWeaknesses.length > 0) {
    console.log('✅ Found explicit strengths/weaknesses sections');
    return { 
      strengths: explicitStrengths.filter(s => !isGenericStrengthWeakness(s)), 
      weaknesses: explicitWeaknesses.filter(w => !isGenericStrengthWeakness(w))
    };
  }
  
  // If no explicit sections, extract from analysis structure (requirements, assessments, etc.)
  console.log('🔄 No explicit sections found, extracting from analysis structure');
  
  // Extract strengths from "✅ Meets requirement" and positive assessments
  const meetRequirementMatches = content.match(/\*\*[^*]+:\*\*.*?→\s*✅\s*Meets requirement/g);
  if (meetRequirementMatches) {
    meetRequirementMatches.forEach(match => {
      const requirementMatch = match.match(/\*\*([^*]+):\*\*/);
      if (requirementMatch) {
        const requirement = requirementMatch[1].trim();
        if (requirement.length > 5 && !isGenericStrengthWeakness(requirement)) {
          strengths.push(`Meets ${requirement.toLowerCase()}`);
        }
      }
    });
  }
  
  // Extract from analysis text that explains why requirements are met
  const analysisMatches = content.match(/\*\*Analysis:\*\*\s*([^#\n]+)/g);
  if (analysisMatches) {
    analysisMatches.forEach(match => {
      const analysisText = match.replace(/\*\*Analysis:\*\*\s*/, '').trim();
      if (analysisText.length > 20 && !isGenericStrengthWeakness(analysisText)) {
        // Extract key positive points from analysis
        const sentences = analysisText.split('.').map(s => s.trim()).filter(s => s.length > 15);
        sentences.forEach(sentence => {
          if (sentence.toLowerCase().includes('support') || 
              sentence.toLowerCase().includes('fulfill') ||
              sentence.toLowerCase().includes('demonstrate') ||
              sentence.toLowerCase().includes('indicates')) {
            strengths.push(sentence);
          }
        });
      }
    });
  }
  
  // Extract from overall assessment
  const assessmentMatch = content.match(/\*\*Overall Assessment:\*\*\s*([^*\n]+)/);
  if (assessmentMatch) {
    const assessment = assessmentMatch[1].trim();
    if (assessment.toLowerCase().includes('strong')) {
      strengths.push('Strong case with solid legal foundation');
    }
    if (assessment.length > 20 && !isGenericStrengthWeakness(assessment)) {
      strengths.push(assessment);
    }
  }
  
  // Extract strength rating
  const strengthRatingMatch = content.match(/\*\*Strength Rating:\*\*\s*([^.]+)/);
  if (strengthRatingMatch) {
    const rating = strengthRatingMatch[1].trim();
    if (rating.toLowerCase().includes('strong')) {
      strengths.push('Case has strong legal merit with supporting evidence');
    }
  }
  
  // Look for potential weaknesses in next steps or concerns
  const nextStepsMatch = content.match(/\*\*Next Steps:\*\*\s*(.*?)(?=\n#{1,3}|$)/s);
  if (nextStepsMatch) {
    const nextStepsText = nextStepsMatch[1];
    const steps = nextStepsText.split(/\d+\./).filter(step => step.trim().length > 10);
    steps.forEach(step => {
      const cleanStep = step.trim();
      if (cleanStep.toLowerCase().includes('gather') || 
          cleanStep.toLowerCase().includes('prepare') ||
          cleanStep.toLowerCase().includes('consider')) {
        if (cleanStep.length < 100) { // Keep it concise
          weaknesses.push(`Action needed: ${cleanStep.split('\n')[0].trim()}`);
        }
      }
    });
  }
  
  // Limit results to most relevant items
  const finalStrengths = strengths.slice(0, 4);
  const finalWeaknesses = weaknesses.slice(0, 3);
  
  console.log(`📊 Final extraction results: ${finalStrengths.length} strengths, ${finalWeaknesses.length} weaknesses`);
  return { strengths: finalStrengths, weaknesses: finalWeaknesses };
}

// Helper function to extract explicit strengths/weaknesses sections
function extractExplicitSection(content: string, sectionType: string): string[] {
  const patterns = [
    new RegExp(`\\*\\*CASE ${sectionType}:\\*\\*(.*?)(?=\\*\\*|$)`, 'is'),
    new RegExp(`\\*\\*${sectionType}:\\*\\*(.*?)(?=\\*\\*|$)`, 'is'),
    new RegExp(`(?:^|\\n)\\s*CASE ${sectionType}:\\s*(.*?)(?=\\n[A-Z][A-Z \\-()&\\/]+:\\s*|$)`, 'is'),
    new RegExp(`(?:^|\\n)\\s*${sectionType}:\\s*(.*?)(?=\\n[A-Z][A-Z \\-()&\\/]+:\\s*|$)`, 'is')
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      console.log(`✅ Found ${sectionType} section`);
      const sectionText = match[1];
      const items = sectionText.match(/(?:^\d+\.|^[-•*]|^-)\s*(.+?)$/gm) || 
                    sectionText.split('\n').filter(line => line.trim().length > 10);
      
      const cleanedItems: string[] = [];
      items.forEach(item => {
        const cleaned = item.replace(/^\d+\.|^[-•*-]\s*/, '').trim();
        if (cleaned && cleaned.length > 10) {
          cleanedItems.push(cleaned);
        }
      });
      
      return cleanedItems;
    }
  }
  
  return [];
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