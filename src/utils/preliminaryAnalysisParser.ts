export interface PreliminaryAnalysisData {
  potentialLegalAreas: string[];
  preliminaryIssues: string[];
  researchPriorities: string[];
  strategicNotes: string[];
}

export function parsePreliminaryAnalysis(analysisContent: string): PreliminaryAnalysisData {
  if (!analysisContent?.trim()) {
    return {
      potentialLegalAreas: [],
      preliminaryIssues: [],
      researchPriorities: [],
      strategicNotes: []
    };
  }

  const content = analysisContent.toLowerCase();
  
  // Extract potential legal areas from various sections
  const potentialLegalAreas: string[] = [];
  
  // Look for legal concepts, areas of law, and case types
  const legalAreaPatterns = [
    /(?:premises liability|negligence|tort law|contract law|consumer protection|dtpa|personal injury|property damage)/gi,
    /(?:breach of|duty of care|reasonable care|foreseeability|causation)/gi,
    /(?:liability|damages|compensation|restitution|punitive damages)/gi
  ];
  
  legalAreaPatterns.forEach(pattern => {
    const matches = analysisContent.match(pattern) || [];
    matches.forEach(match => {
      const formatted = match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
      if (!potentialLegalAreas.includes(formatted)) {
        potentialLegalAreas.push(formatted);
      }
    });
  });

  // Extract preliminary issues from IRAC structure
  const preliminaryIssues: string[] = [];
  
  // Look for issue statements and legal questions
  const issuePatterns = [
    /issue(?:s)?:\s*([^.]*\.)/gi,
    /legal question(?:s)?:\s*([^.]*\.)/gi,
    /(?:whether|can|did|does|is|was)\s+[^.]{20,100}\.?/gi
  ];
  
  issuePatterns.forEach(pattern => {
    const matches = analysisContent.match(pattern) || [];
    matches.forEach(match => {
      const cleaned = match.replace(/^(issue(?:s)?:|legal question(?:s)?:)/i, '').trim();
      if (cleaned.length > 10 && !preliminaryIssues.includes(cleaned)) {
        preliminaryIssues.push(cleaned);
      }
    });
  });

  // Extract research priorities
  const researchPriorities: string[] = [];
  
  // Look for areas needing further investigation
  const researchPatterns = [
    /need(?:s)?\s+(?:to\s+)?(?:research|investigate|examine|determine)/gi,
    /(?:further|additional)\s+(?:research|investigation|evidence)/gi,
    /(?:statute|case law|precedent|regulation)(?:s)?\s+(?:should|must|need)/gi
  ];
  
  researchPatterns.forEach(pattern => {
    const matches = analysisContent.match(pattern) || [];
    matches.forEach(match => {
      const context = extractSentenceContext(analysisContent, match);
      if (context && !researchPriorities.includes(context)) {
        researchPriorities.push(context);
      }
    });
  });

  // Extract strategic notes from conclusions and recommendations
  const strategicNotes: string[] = [];
  
  // Look for strategic advice, recommendations, and conclusions
  const strategicPatterns = [
    /conclusion:\s*([^.]*\.)/gi,
    /recommend(?:ation)?(?:s)?:\s*([^.]*\.)/gi,
    /strategy:\s*([^.]*\.)/gi,
    /(?:should|must|may|could)\s+(?:consider|pursue|investigate|argue)/gi
  ];
  
  strategicPatterns.forEach(pattern => {
    const matches = analysisContent.match(pattern) || [];
    matches.forEach(match => {
      const cleaned = match.replace(/^(conclusion:|recommend(?:ation)?(?:s)?:|strategy:)/i, '').trim();
      if (cleaned.length > 10 && !strategicNotes.includes(cleaned)) {
        strategicNotes.push(cleaned);
      }
    });
  });

  // Add fallback content if sections are too sparse
  if (potentialLegalAreas.length === 0 && content.includes('negligence')) {
    potentialLegalAreas.push('Negligence', 'Tort Law');
  }
  
  if (preliminaryIssues.length === 0) {
    // Try to extract first few sentences that might be issues
    const sentences = analysisContent.split(/[.!?]+/).slice(0, 3);
    sentences.forEach(sentence => {
      if (sentence.trim().length > 20 && sentence.trim().length < 150) {
        preliminaryIssues.push(sentence.trim() + '.');
      }
    });
  }

  return {
    potentialLegalAreas: potentialLegalAreas.slice(0, 8),
    preliminaryIssues: preliminaryIssues.slice(0, 5),
    researchPriorities: researchPriorities.slice(0, 6),
    strategicNotes: strategicNotes.slice(0, 5)
  };
}

function extractSentenceContext(text: string, match: string): string | null {
  const index = text.toLowerCase().indexOf(match.toLowerCase());
  if (index === -1) return null;
  
  // Find sentence boundaries
  const beforeText = text.substring(0, index);
  const afterText = text.substring(index);
  
  const sentenceStart = Math.max(
    beforeText.lastIndexOf('.'),
    beforeText.lastIndexOf('!'),
    beforeText.lastIndexOf('?')
  ) + 1;
  
  const sentenceEnd = afterText.search(/[.!?]/);
  if (sentenceEnd === -1) return null;
  
  const sentence = text.substring(sentenceStart, index + sentenceEnd + 1).trim();
  return sentence.length > 15 && sentence.length < 200 ? sentence : null;
}