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

  // 🚫 ABSOLUTE ZERO-TOLERANCE IRAC DETECTION FOR STEP 2
  const iracDetectionPatterns = [
    /\*\*ISSUE\s*\[\d+\]\s*:\s*\*\*/i,
    /\*\*ISSUE\s*\[.*?\]\s*:\s*\*\*/i,
    /\*\*RULE\s*:\s*\*\*/i,
    /\*\*APPLICATION\s*:\s*\*\*/i,
    /\*\*CONCLUSION\s*:\s*\*\*/i,
    /##\s*IRAC/i,
    /IRAC\s+LEGAL\s+ANALYSIS/i,
    /detailed\s+legal\s+analysis/i,
    /ISSUE\s*\[\d+\]/i,
    /statutory\s+analysis/i,
    /case\s+law\s+analysis/i
  ];
  
  // Test each pattern individually for better error reporting
  for (const pattern of iracDetectionPatterns) {
    if (pattern.test(analysisContent)) {
      console.error('🚨 STEP 2 IRAC VIOLATION - Pattern found:', pattern);
      console.error('Analysis content preview:', analysisContent.substring(0, 500));
      
      // Return error state that will be displayed to user
      return {
        potentialLegalAreas: [`CRITICAL ERROR: Step 2 contains forbidden IRAC format`],
        preliminaryIssues: [`Pattern found: ${pattern}`, 'Step 2 must use PRELIMINARY ANALYSIS format only'],
        researchPriorities: ['Regenerate Step 2 analysis with correct format', 'Remove all IRAC headings and structure'],
        strategicNotes: ['Step 2 validation failed - contains IRAC content', 'System will block any IRAC format in Step 2']
      };
    }
  }
  
  console.log('✅ Step 2 content passed IRAC validation check');

  const isTraditionalFormat = /\*\*PRELIMINARY ANALYSIS:|\*\*POTENTIAL LEGAL AREAS:/i.test(analysisContent);

  if (isTraditionalFormat) {
    return parseTraditionalFormat(analysisContent);
  } else {
    return parseGenericFormat(analysisContent);
  }
}

function parseIracFormat(analysisContent: string): PreliminaryAnalysisData {
  const potentialLegalAreas: string[] = [];
  const preliminaryIssues: string[] = [];
  const researchPriorities: string[] = [];
  const strategicNotes: string[] = [];

  // Extract legal areas from ISSUE section titles
  const issueMatches = analysisContent.match(/\*\*ISSUE\s+\[([^\]]+)\]\*\*/gi) || [];
  issueMatches.forEach(match => {
    const bracketContent = match.match(/\[([^\]]+)\]/)?.[1];
    if (bracketContent) {
      // Split on " - " to get main legal area
      const mainArea = bracketContent.split(' - ')[0];
      if (mainArea && !potentialLegalAreas.includes(mainArea)) {
        potentialLegalAreas.push(mainArea);
      }
      // Also add the full description if it's different
      if (bracketContent !== mainArea && !potentialLegalAreas.includes(bracketContent)) {
        potentialLegalAreas.push(bracketContent);
      }
    }
  });

  // Extract preliminary issues from ISSUE content
  const issueContentMatches = analysisContent.match(/\*\*ISSUE\s+\[[^\]]+\]\*\*\s*(.*?)(?=\*\*RULE|$)/gis) || [];
  issueContentMatches.forEach(match => {
    // Clean up the issue text
    const issueText = match.replace(/\*\*ISSUE\s+\[[^\]]+\]\*\*\s*/i, '').trim();
    if (issueText.length > 20 && issueText.length < 300) {
      const cleanIssue = issueText.replace(/\n+/g, ' ').trim();
      if (!preliminaryIssues.includes(cleanIssue)) {
        preliminaryIssues.push(cleanIssue);
      }
    }
  });

  // Extract research priorities from APPLICATION sections
  const applicationMatches = analysisContent.match(/\*\*APPLICATION\*\*\s*(.*?)(?=\*\*CONCLUSION|$)/gis) || [];
  applicationMatches.forEach(match => {
    const appText = match.replace(/\*\*APPLICATION\*\*\s*/i, '');
    
    // Look for "requires further investigation" or similar phrases
    const researchPatterns = [
      /[^.]*(?:requires?\s+(?:further|additional)|need(?:s)?\s+(?:to\s+)?(?:investigate|research|examine|determine))[^.]*/gi,
      /[^.]*(?:factual\s+investigation|discovery|evidence\s+gathering)[^.]*/gi
    ];
    
    researchPatterns.forEach(pattern => {
      const matches = appText.match(pattern) || [];
      matches.forEach(researchMatch => {
        const cleaned = researchMatch.trim().replace(/\n+/g, ' ');
        if (cleaned.length > 15 && cleaned.length < 200 && !researchPriorities.includes(cleaned)) {
          researchPriorities.push(cleaned);
        }
      });
    });
  });

  // Extract strategic notes from CONCLUSION sections
  const conclusionMatches = analysisContent.match(/\*\*CONCLUSION\*\*\s*(.*?)(?=\*\*ISSUE|\*\*$|$)/gis) || [];
  conclusionMatches.forEach(match => {
    const conclusionText = match.replace(/\*\*CONCLUSION\*\*\s*/i, '').trim();
    
    // Split into sentences and take meaningful ones
    const sentences = conclusionText.split(/[.!?]+/);
    sentences.forEach(sentence => {
      const cleaned = sentence.trim().replace(/\n+/g, ' ');
      if (cleaned.length > 20 && cleaned.length < 200 && !strategicNotes.includes(cleaned)) {
        strategicNotes.push(cleaned);
      }
    });
  });

  // Apply quality control and fallbacks
  return applyQualityControl({
    potentialLegalAreas,
    preliminaryIssues,
    researchPriorities,
    strategicNotes
  }, analysisContent);
}

function parseTraditionalFormat(analysisContent: string): PreliminaryAnalysisData {
  const potentialLegalAreas: string[] = [];
  const preliminaryIssues: string[] = [];
  const researchPriorities: string[] = [];
  const strategicNotes: string[] = [];

  // Helper function to split content into items while preserving sentence integrity
  const splitIntoItems = (content: string): string[] => {
    // Split on bullet points, numbered lists, or double newlines, but preserve sentences with commas
    const items = content
      .split(/\n\s*[-•*]\s*|\n\s*\d+\.\s*|\n\s*\([a-z]\)\s*|\n\n+/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    // If no structured list found, treat the whole content as a single item
    if (items.length === 1 && !content.includes('\n-') && !content.includes('\n•') && !content.match(/\n\s*\d+\./)) {
      return [content.trim()];
    }
    
    return items;
  };

  // Extract from traditional sections
  const areasMatch = analysisContent.match(/\*\*POTENTIAL LEGAL AREAS:\*\*(.*?)(?=\*\*|$)/is);
  if (areasMatch) {
    const areas = splitIntoItems(areasMatch[1]).filter(a => a.length > 0);
    potentialLegalAreas.push(...areas);
  }

  const issuesMatch = analysisContent.match(/\*\*PRELIMINARY ISSUES:\*\*(.*?)(?=\*\*|$)/is);
  if (issuesMatch) {
    const issues = splitIntoItems(issuesMatch[1]).filter(i => i.length > 10);
    preliminaryIssues.push(...issues);
  }

  const researchMatch = analysisContent.match(/\*\*RESEARCH PRIORITIES:\*\*(.*?)(?=\*\*|$)/is);
  if (researchMatch) {
    const priorities = splitIntoItems(researchMatch[1]).filter(r => r.length > 10);
    researchPriorities.push(...priorities);
  }

  const notesMatch = analysisContent.match(/\*\*STRATEGIC NOTES:\*\*(.*?)(?=\*\*|$)/is);
  if (notesMatch) {
    const notes = splitIntoItems(notesMatch[1]).filter(n => n.length > 10);
    strategicNotes.push(...notes);
  }

  return applyQualityControl({
    potentialLegalAreas,
    preliminaryIssues,
    researchPriorities,
    strategicNotes
  }, analysisContent);
}

function parseGenericFormat(analysisContent: string): PreliminaryAnalysisData {
  const potentialLegalAreas: string[] = [];
  const preliminaryIssues: string[] = [];
  const researchPriorities: string[] = [];
  const strategicNotes: string[] = [];

  // Pre-process to detect and split concatenated legal areas
  const preprocessedContent = detectAndSplitConcatenatedLegalAreas(analysisContent);
  
  // Extract individual legal concepts instead of full sentences
  const extractedConcepts = extractLegalConcepts(preprocessedContent);
  
  // Add extracted concepts with deduplication
  extractedConcepts.forEach(concept => {
    const cleanConcept = cleanLegalConcept(concept);
    
    // Check for exact duplicates first
    const isExactDuplicate = potentialLegalAreas.some(existing => 
      existing.toLowerCase().trim() === cleanConcept.toLowerCase().trim()
    );
    
    if (!isExactDuplicate && cleanConcept.length > 3) {
      const isSimilarDuplicate = potentialLegalAreas.some(existing => 
        areSimilarLegalConcepts(existing, cleanConcept)
      );
      
      if (!isSimilarDuplicate) {
        potentialLegalAreas.push(cleanConcept);
      }
    }
  });

  // If no legal areas found, fallback to basic extraction
  if (potentialLegalAreas.length === 0) {
    const fallbackPatterns = [
      /[^.]*(?:texas lemon law|magnuson-moss|deceptive trade practices)[^.]*/gi,
      /[^.]*(?:warranty|contract law|premises liability)[^.]*/gi,
      /[^.]*(?:consumer protection|negligence|liability)[^.]*/gi
    ];
    
    fallbackPatterns.forEach(pattern => {
      const matches = preprocessedContent.match(pattern) || [];
      matches.forEach(match => {
        const cleaned = match.trim().replace(/\n+/g, ' ');
        if (cleaned.length > 15 && cleaned.length < 300) {
          const isExactDuplicate = potentialLegalAreas.some(existing => 
            existing.toLowerCase().trim() === cleaned.toLowerCase().trim()
          );
          
          if (!isExactDuplicate) {
            const isSimilarDuplicate = potentialLegalAreas.some(existing => 
              areSimilarLegalConcepts(existing, cleaned)
            );
            if (!isSimilarDuplicate) {
              potentialLegalAreas.push(cleaned);
            }
          }
        }
      });
    });
  }

  // Enhanced issue detection
  const issuePatterns = [
    /(?:whether|can|did|does|is|was|will)\s+[^.]{15,150}[.?]/gi,
    /[^.]*(?:issue|question|problem|concern)[^.]{10,100}[.?]/gi,
    /[^.]*(?:liable|liability|responsible|breach)[^.]{10,100}[.?]/gi
  ];
  
  issuePatterns.forEach(pattern => {
    const matches = analysisContent.match(pattern) || [];
    matches.forEach(match => {
      const cleaned = match.trim();
      if (cleaned.length > 20 && cleaned.length < 200 && !preliminaryIssues.includes(cleaned)) {
        preliminaryIssues.push(cleaned);
      }
    });
  });

  // Enhanced research priorities detection
  const researchPatterns = [
    /[^.]*(?:need(?:s)?\s+(?:to\s+)?(?:research|investigate|examine|determine))[^.]*/gi,
    /[^.]*(?:further|additional)\s+(?:research|investigation|evidence|discovery)[^.]*/gi,
    /[^.]*(?:factual\s+investigation|missing\s+evidence|unclear)[^.]*/gi
  ];
  
  researchPatterns.forEach(pattern => {
    const matches = analysisContent.match(pattern) || [];
    matches.forEach(match => {
      const context = match.trim().replace(/\n+/g, ' ');
      if (context.length > 15 && context.length < 200 && !researchPriorities.includes(context)) {
        researchPriorities.push(context);
      }
    });
  });

  // Enhanced strategic notes detection
  const strategicPatterns = [
    /[^.]*(?:recommend|suggest|advise|strategy)[^.]*/gi,
    /[^.]*(?:should|must|may|could)\s+(?:consider|pursue|investigate|argue)[^.]*/gi,
    /[^.]*(?:strength|weakness|advantage|disadvantage)[^.]*/gi
  ];
  
  strategicPatterns.forEach(pattern => {
    const matches = analysisContent.match(pattern) || [];
    matches.forEach(match => {
      const cleaned = match.trim().replace(/\n+/g, ' ');
      if (cleaned.length > 20 && cleaned.length < 200 && !strategicNotes.includes(cleaned)) {
        strategicNotes.push(cleaned);
      }
    });
  });

  return applyQualityControl({
    potentialLegalAreas,
    preliminaryIssues,
    researchPriorities,
    strategicNotes
  }, analysisContent);
}

/**
 * Extract individual legal concepts using targeted patterns
 */
function extractLegalConcepts(content: string): string[] {
  const concepts: string[] = [];
  
  // Patterns for common legal concepts
  const legalPatterns = [
    // Texas-specific laws with citations
    /Texas\s+[A-Za-z\s]+(?:Law|Act|Code)(?:\s*\([^)]+\))?/gi,
    // Federal acts
    /(?:Magnuson-Moss|Fair Credit|Truth in Lending|Americans with Disabilities)\s+[A-Za-z\s]*Act/gi,
    // DTPA variations
    /(?:Deceptive Trade Practices?|DTPA)(?:\s*Act)?(?:\s*\([^)]+\))?/gi,
    // General legal concepts
    /(?:Implied|Express)\s+Warrant(?:y|ies)/gi,
    /Breach\s+of\s+(?:Contract|Warranty)/gi,
    /(?:Negligence|Fraud|Misrepresentation)/gi,
    /(?:Damages|Remedies|Relief)/gi,
    // Generic laws and codes
    /[A-Za-z\s]+(?:Law|Act|Code)(?:\s*\([^)]+\))?/gi,
  ];
  
  // Extract using each pattern
  legalPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = cleanLegalConcept(match);
        if (cleaned.length > 3) { // Avoid very short matches
          concepts.push(cleaned);
        }
      });
    }
  });
  
  return concepts;
}

/**
 * Clean and normalize a legal concept for display
 */
function cleanLegalConcept(concept: string): string {
  return concept
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^[^a-zA-Z]+/, '') // Remove leading non-letters
    .replace(/[^a-zA-Z0-9\s()&,-]+$/, ''); // Remove trailing punctuation except useful chars
}

// Function to detect and split concatenated legal areas
function detectAndSplitConcatenatedLegalAreas(content: string): string {
  // More aggressive patterns for splitting concatenated legal concepts
  const patterns = [
    // Split at legal concept boundaries
    /((?:Act|Law|Code|DTPA|Warranties?)(?:\s*\([^)]+\))?)\s*([A-Z][A-Za-z\s]+)/g,
    // Split when parenthetical citation is followed by another concept
    /(\([^)]+\))\s*([A-Z][A-Za-z\s]+(?:Act|Law|Code|DTPA))/g,
    // Split DTPA from other concepts
    /(DTPA)\s*([A-Z][a-z])/g,
    // Split when legal keywords are directly followed by other concepts
    /((?:Implied|Express)\s+Warrant(?:y|ies))\s*([A-Z][A-Za-z\s]+)/g,
  ];
  
  let processedContent = content;
  
  patterns.forEach(pattern => {
    processedContent = processedContent.replace(pattern, '$1\n$2');
  });
  
  return processedContent;
}

// Helper function to detect similar legal concepts and prevent duplicates
function areSimilarLegalConcepts(concept1: string, concept2: string): boolean {
  const c1 = concept1.toLowerCase().trim();
  const c2 = concept2.toLowerCase().trim();
  
  // Exact match
  if (c1 === c2) return true;
  
  // Check if one is contained in the other (with significant overlap)
  const shorterLength = Math.min(c1.length, c2.length);
  if (shorterLength > 20) {
    if (c1.includes(c2) || c2.includes(c1)) return true;
  }
  
  // Check for significant word overlap in legal concepts
  const words1 = c1.split(/\s+/).filter(w => w.length > 3);
  const words2 = c2.split(/\s+/).filter(w => w.length > 3);
  
  if (words1.length > 0 && words2.length > 0) {
    const commonWords = words1.filter(w => words2.includes(w));
    const overlapRatio = commonWords.length / Math.min(words1.length, words2.length);
    
    // If 60% or more of the shorter concept's words are in the longer one
    if (overlapRatio >= 0.6) return true;
  }
  
  return false;
}

function applyQualityControl(
  data: PreliminaryAnalysisData,
  originalContent: string
): PreliminaryAnalysisData {
  // Apply strong deduplication with exact matching first, then similarity
  const uniqueLegalAreas = [];
  const seenExact = new Set();
  
  for (const area of data.potentialLegalAreas) {
    const normalizedArea = area.toLowerCase().trim();
    
    // Skip if exact duplicate
    if (seenExact.has(normalizedArea)) {
      console.log('🔄 Skipping exact duplicate:', area);
      continue;
    }
    
    // Skip if similar to existing
    const hasSimilar = uniqueLegalAreas.some(existing => 
      areSimilarLegalConcepts(existing, area)
    );
    
    if (!hasSimilar) {
      uniqueLegalAreas.push(area);
      seenExact.add(normalizedArea);
    } else {
      console.log('🔄 Skipping similar duplicate:', area);
    }
  }
  
  // Sort by length and quality (longer descriptions first)
  const sortedLegalAreas = uniqueLegalAreas
    .sort((a, b) => b.length - a.length)
    .filter(area => area.length > 10); // Ensure meaningful content

  return {
    potentialLegalAreas: sortedLegalAreas.slice(0, 6).map(cleanText),
    preliminaryIssues: data.preliminaryIssues.slice(0, 6).map(cleanText),
    researchPriorities: data.researchPriorities.slice(0, 6).map(cleanText),
    strategicNotes: data.strategicNotes.slice(0, 6).map(cleanText),
  };
}

function cleanText(text: string): string {
  return text
    .replace(/\*\*/g, '') // Remove markdown formatting
    .replace(/^[-•*]\s*/, '') // Remove bullet markers
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
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