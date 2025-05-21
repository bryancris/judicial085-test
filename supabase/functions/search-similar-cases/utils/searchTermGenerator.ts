
// Generate search terms for case similarity search
export function generateSearchTerms(content: string, caseType: string): string {
  try {
    if (!content) {
      console.log("No content provided for search term generation");
      return `${caseType} case law Texas`;
    }
    
    // Extract key phrases from the content
    const keyPhrases = extractKeyPhrases(content);
    
    console.log(`Generated search terms: ${keyPhrases}`);
    return keyPhrases;
  } catch (error) {
    console.error("Error generating search terms:", error);
    return `${caseType} liability damages`;
  }
}

// Extract key phrases from case content
function extractKeyPhrases(content: string): string {
  // Extract legal concepts
  const legalConcepts = extractLegalConcepts(content);
  
  // Extract case citations
  const caseCitations = extractCaseCitations(content);
  
  // Extract statute references
  const statuteReferences = extractStatuteReferences(content);
  
  // Combine all terms
  let terms = [...legalConcepts, ...caseCitations, ...statuteReferences];
  
  // If we have 3 or more terms, that's good enough
  if (terms.length >= 3) {
    return terms.slice(0, 5).join(" ");
  }
  
  // If not enough terms, extract some key nouns and adjectives
  const keyWords = extractKeyWords(content);
  terms = [...terms, ...keyWords];
  
  // Limit to 5 terms for effective search
  return terms.slice(0, 5).join(" ");
}

// Extract legal concepts from content
function extractLegalConcepts(content: string): string[] {
  const lowerContent = content.toLowerCase();
  const concepts = [];
  
  // Common legal concepts to check for
  const legalConceptPatterns = [
    { term: "negligence", regex: /negligen[ct]/i },
    { term: "duty of care", regex: /duty\s+of\s+care/i },
    { term: "breach", regex: /breach/i },
    { term: "damages", regex: /damages/i },
    { term: "liability", regex: /liab[il]l?it[yi]/i },
    { term: "contract", regex: /contract/i },
    { term: "warranty", regex: /warrant[yi]/i },
    { term: "fraud", regex: /fraud/i },
    { term: "injury", regex: /injur[yi]/i },
    { term: "property", regex: /property/i },
    { term: "trespass", regex: /trespass/i },
    { term: "easement", regex: /easement/i },
    { term: "nuisance", regex: /nuisance/i },
    { term: "discrimination", regex: /discriminat/i },
    { term: "harassment", regex: /harass/i },
    { term: "defamation", regex: /defam/i },
    { term: "slander", regex: /slander/i },
    { term: "libel", regex: /libel/i },
    { term: "consent", regex: /consent/i },
    { term: "reasonable", regex: /reasonable/i }
  ];
  
  // Check for each legal concept
  legalConceptPatterns.forEach(concept => {
    if (concept.regex.test(lowerContent)) {
      concepts.push(concept.term);
    }
  });
  
  return concepts;
}

// Extract case citations
function extractCaseCitations(content: string): string[] {
  // Look for patterns like "Smith v. Jones"
  const caseCitations = [];
  const casePattern = /([A-Z][a-z]+)\s+v\.\s+([A-Z][a-z]+)/g;
  let match;
  
  while ((match = casePattern.exec(content)) !== null) {
    caseCitations.push(`${match[1]} v. ${match[2]}`);
  }
  
  return caseCitations;
}

// Extract statute references
function extractStatuteReferences(content: string): string[] {
  const statutes = [];
  
  // Look for common statute patterns
  const statutePatterns = [
    /(\d+\.\d+)/g,  // Like 17.46 (DTPA)
    /(\d+\.\d+\.\d+)/g,  // Like 17.46.1
    /§\s*(\d+)/g,   // Like § 17
    /section\s+(\d+)/gi  // Like Section 17
  ];
  
  statutePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      statutes.push(match[1]);
    }
  });
  
  return statutes;
}

// Extract key words (nouns and legal terminology)
function extractKeyWords(content: string): string[] {
  const words = content.split(/\W+/).filter(word => word.length > 3);
  
  // Count word frequency
  const wordCounts = new Map<string, number>();
  words.forEach(word => {
    const lower = word.toLowerCase();
    wordCounts.set(lower, (wordCounts.get(lower) || 0) + 1);
  });
  
  // Sort by frequency
  const sortedWords = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
  
  // Return top words
  return sortedWords.slice(0, 5);
}

// Add additional legal terms based on case type
export function addExplicitLegalTerms(searchTerms: string, content: string, caseType: string): string {
  const normalizedType = (caseType || "").toLowerCase().replace(/[-_\s]/g, "");
  
  // Add case-specific terms
  if (normalizedType.includes("hoa") || normalizedType.includes("homeowner")) {
    return `${searchTerms} homeowners association property code restrictions covenant`;
  }
  
  if (normalizedType.includes("personal") || normalizedType.includes("injury")) {
    return `${searchTerms} negligence damages duty breach`;
  }
  
  if (normalizedType.includes("consumer") || normalizedType.includes("dtpa")) {
    return `${searchTerms} deceptive trade practice consumer warranty misrepresentation`;
  }
  
  if (normalizedType.includes("contract")) {
    return `${searchTerms} contract agreement breach performance consideration`;
  }
  
  if (normalizedType.includes("realestate") || normalizedType.includes("property")) {
    return `${searchTerms} property deed title easement restriction`;
  }
  
  if (normalizedType.includes("deceptive") || normalizedType.includes("trade")) {
    return `${searchTerms} deceptive trade practice dtpa consumer protection`;
  }
  
  if (normalizedType.includes("bailment") || normalizedType.includes("property")) {
    return `${searchTerms} bailment property possession duty care`;
  }
  
  // Default added terms for general liability
  return `${searchTerms} liability negligence Texas law`;
}
