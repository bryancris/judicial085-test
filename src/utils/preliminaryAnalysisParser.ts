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

  // Extract from traditional sections
  const areasMatch = analysisContent.match(/\*\*POTENTIAL LEGAL AREAS:\*\*(.*?)(?=\*\*|$)/is);
  if (areasMatch) {
    const areas = areasMatch[1].split(/[,\n]/).map(a => a.trim()).filter(a => a.length > 0);
    potentialLegalAreas.push(...areas);
  }

  const issuesMatch = analysisContent.match(/\*\*PRELIMINARY ISSUES:\*\*(.*?)(?=\*\*|$)/is);
  if (issuesMatch) {
    const issues = issuesMatch[1].split(/[,\n]/).map(i => i.trim()).filter(i => i.length > 10);
    preliminaryIssues.push(...issues);
  }

  const researchMatch = analysisContent.match(/\*\*RESEARCH PRIORITIES:\*\*(.*?)(?=\*\*|$)/is);
  if (researchMatch) {
    const priorities = researchMatch[1].split(/[,\n]/).map(r => r.trim()).filter(r => r.length > 10);
    researchPriorities.push(...priorities);
  }

  const notesMatch = analysisContent.match(/\*\*STRATEGIC NOTES:\*\*(.*?)(?=\*\*|$)/is);
  if (notesMatch) {
    const notes = notesMatch[1].split(/[,\n]/).map(n => n.trim()).filter(n => n.length > 10);
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

  const content = analysisContent.toLowerCase();

  // Enhanced legal area detection
  const legalAreaPatterns = [
    /(?:contract law|breach of contract|warranty|express warranty|implied warranty)/gi,
    /(?:texas lemon law|magnuson-moss|deceptive trade practices|dtpa)/gi,
    /(?:premises liability|negligence|tort law|personal injury|property damage)/gi,
    /(?:consumer protection|breach of duty|duty of care|reasonable care)/gi,
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

function applyQualityControl(
  data: PreliminaryAnalysisData,
  originalContent: string
): PreliminaryAnalysisData {
  // No fallbacks: preserve exactly what the model produced; only clean and bound sizes
  return {
    potentialLegalAreas: data.potentialLegalAreas.slice(0, 8).map(cleanText),
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