
// Generate search terms for case similarity search
export function generateSearchTerms(content: string, caseType: string): string {
  try {
    if (!content) {
      console.log("No content provided for search term generation");
      return `${caseType} case law Texas`;
    }
    
    // Extract key phrases from the content
    const keyPhrases = extractKeyPhrases(content, caseType);
    
    console.log(`Generated search terms: ${keyPhrases}`);
    return keyPhrases;
  } catch (error) {
    console.error("Error generating search terms:", error);
    return `${caseType} liability damages`;
  }
}

// Extract key phrases from case content with case-type specific logic
function extractKeyPhrases(content: string, caseType: string): string {
  const lowerContent = content.toLowerCase();
  
  // Start with case-specific terms based on detected type
  let caseSpecificTerms: string[] = [];
  
  if (caseType === "animal-protection") {
    caseSpecificTerms = extractAnimalProtectionTerms(content);
  } else if (caseType === "consumer-protection" || caseType === "deceptive-trade") {
    caseSpecificTerms = extractConsumerProtectionTerms(content);
  } else if (caseType === "personal-injury") {
    caseSpecificTerms = extractPersonalInjuryTerms(content);
  } else if (caseType === "real-estate") {
    caseSpecificTerms = extractRealEstateTerms(content);
  } else if (caseType === "contract") {
    caseSpecificTerms = extractContractTerms(content);
  } else {
    // Generic extraction for unknown case types
    caseSpecificTerms = extractGenericLegalTerms(content);
  }
  
  // Extract statute references
  const statuteReferences = extractStatuteReferences(content);
  
  // Extract case citations
  const caseCitations = extractCaseCitations(content);
  
  // Combine all terms, prioritizing case-specific terms
  let allTerms = [...caseSpecificTerms, ...statuteReferences, ...caseCitations];
  
  // Remove duplicates and limit to most important terms
  const uniqueTerms = [...new Set(allTerms)];
  
  // Return top 8 terms for effective search
  return uniqueTerms.slice(0, 8).join(" ");
}

// Extract animal protection specific terms
function extractAnimalProtectionTerms(content: string): string[] {
  const terms = [];
  const lowerContent = content.toLowerCase();
  
  // Specific statute references
  if (lowerContent.includes("42.092") || lowerContent.includes("§ 42.092")) {
    terms.push("Texas Penal Code 42.092");
  }
  if (lowerContent.includes("42.091")) {
    terms.push("Texas Penal Code 42.091");
  }
  
  // Animal-specific terms
  if (lowerContent.includes("animal cruelty")) terms.push("animal cruelty");
  if (lowerContent.includes("pet boarding")) terms.push("pet boarding");
  if (lowerContent.includes("animal care")) terms.push("animal care");
  if (lowerContent.includes("dogtopia")) terms.push("pet boarding negligence");
  if (lowerContent.includes("heat exposure")) terms.push("heat exposure animal");
  if (lowerContent.includes("negligent supervision")) terms.push("negligent supervision");
  if (lowerContent.includes("animal abuse")) terms.push("animal abuse");
  if (lowerContent.includes("animal neglect")) terms.push("animal neglect");
  
  // If DTPA is also mentioned (consumer protection aspect)
  if (lowerContent.includes("dtpa") || lowerContent.includes("deceptive trade")) {
    terms.push("DTPA animal services");
    terms.push("consumer protection pets");
  }
  
  // Add generic fallbacks if no specific terms found
  if (terms.length === 0) {
    terms.push("animal", "pet", "boarding", "care", "negligence");
  }
  
  return terms;
}

// Extract consumer protection specific terms
function extractConsumerProtectionTerms(content: string): string[] {
  const terms = [];
  const lowerContent = content.toLowerCase();
  
  // DTPA specific
  if (lowerContent.includes("dtpa")) terms.push("DTPA");
  if (lowerContent.includes("deceptive trade practices")) terms.push("deceptive trade practices");
  if (lowerContent.includes("17.46") || lowerContent.includes("§ 17.46")) {
    terms.push("Texas Business Commerce Code 17.46");
  }
  
  // Consumer protection terms
  if (lowerContent.includes("consumer protection")) terms.push("consumer protection");
  if (lowerContent.includes("false advertising")) terms.push("false advertising");
  if (lowerContent.includes("misrepresentation")) terms.push("misrepresentation");
  if (lowerContent.includes("warranty")) terms.push("warranty breach");
  if (lowerContent.includes("service provider")) terms.push("service provider negligence");
  
  return terms;
}

// Extract personal injury specific terms
function extractPersonalInjuryTerms(content: string): string[] {
  const terms = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes("negligence")) terms.push("negligence");
  if (lowerContent.includes("duty of care")) terms.push("duty of care");
  if (lowerContent.includes("premises liability")) terms.push("premises liability");
  if (lowerContent.includes("slip and fall")) terms.push("slip and fall");
  if (lowerContent.includes("motor vehicle")) terms.push("motor vehicle accident");
  
  return terms;
}

// Extract real estate specific terms
function extractRealEstateTerms(content: string): string[] {
  const terms = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes("real estate")) terms.push("real estate");
  if (lowerContent.includes("property")) terms.push("property");
  if (lowerContent.includes("deed")) terms.push("deed");
  if (lowerContent.includes("title")) terms.push("title");
  if (lowerContent.includes("landlord")) terms.push("landlord tenant");
  
  return terms;
}

// Extract contract specific terms
function extractContractTerms(content: string): string[] {
  const terms = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes("contract")) terms.push("contract");
  if (lowerContent.includes("agreement")) terms.push("agreement");
  if (lowerContent.includes("breach")) terms.push("breach of contract");
  if (lowerContent.includes("consideration")) terms.push("consideration");
  
  return terms;
}

// Extract generic legal terms as fallback
function extractGenericLegalTerms(content: string): string[] {
  const terms = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes("negligence")) terms.push("negligence");
  if (lowerContent.includes("liability")) terms.push("liability");
  if (lowerContent.includes("damages")) terms.push("damages");
  if (lowerContent.includes("breach")) terms.push("breach");
  
  return terms;
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
  
  // Texas Penal Code patterns
  const penalCodePattern = /(?:Texas\s+)?Penal\s+Code\s*[§]?\s*(\d+\.\d+)/gi;
  let match;
  while ((match = penalCodePattern.exec(content)) !== null) {
    statutes.push(`Texas Penal Code ${match[1]}`);
  }
  
  // DTPA patterns
  const dtpaPattern = /(?:Texas\s+)?(?:Business\s+.*?Commerce\s+Code|DTPA)\s*[§]?\s*(17\.\d+)/gi;
  while ((match = dtpaPattern.exec(content)) !== null) {
    statutes.push(`Texas Business Commerce Code ${match[1]}`);
  }
  
  // Generic statute patterns
  const genericPattern = /[§]\s*(\d+\.\d+)/g;
  while ((match = genericPattern.exec(content)) !== null) {
    statutes.push(match[1]);
  }
  
  return statutes;
}

// Add additional legal terms based on case type
export function addExplicitLegalTerms(searchTerms: string, content: string, caseType: string): string {
  const normalizedType = (caseType || "").toLowerCase().replace(/[-_\s]/g, "");
  
  // Add case-specific terms
  if (normalizedType.includes("animal") || normalizedType.includes("protection")) {
    return `${searchTerms} animal cruelty Texas Penal Code 42.092 pet boarding negligence`;
  }
  
  if (normalizedType.includes("consumer") || normalizedType.includes("dtpa") || normalizedType.includes("deceptive")) {
    return `${searchTerms} DTPA deceptive trade practices consumer protection Texas`;
  }
  
  if (normalizedType.includes("personal") || normalizedType.includes("injury")) {
    return `${searchTerms} negligence damages duty breach personal injury`;
  }
  
  if (normalizedType.includes("contract")) {
    return `${searchTerms} contract agreement breach performance consideration`;
  }
  
  if (normalizedType.includes("realestate") || normalizedType.includes("property")) {
    return `${searchTerms} property deed title easement restriction`;
  }
  
  if (normalizedType.includes("bailment")) {
    return `${searchTerms} bailment property possession duty care`;
  }
  
  // Default added terms
  return `${searchTerms} Texas law liability`;
}
