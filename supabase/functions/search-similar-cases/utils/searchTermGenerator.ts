
// Generate search terms for case similarity search
export function generateSearchTerms(content: string, caseType: string): string {
  try {
    if (!content) {
      console.log("No content provided for search term generation");
      return getDefaultSearchTermsForCaseType(caseType);
    }
    
    console.log(`=== SEARCH TERM GENERATION START ===`);
    console.log(`Case type: ${caseType}`);
    console.log(`Content preview: ${content.substring(0, 200)}...`);
    
    // For animal protection cases, use very specific search strategy
    if (caseType === "animal-protection") {
      const animalSpecificTerms = generateAnimalProtectionSearchTerms(content);
      console.log(`=== ANIMAL PROTECTION SEARCH TERMS ===`);
      console.log(`Generated terms: ${animalSpecificTerms}`);
      return animalSpecificTerms;
    }
    
    // Extract key phrases from the content for other case types
    const keyPhrases = extractKeyPhrases(content, caseType);
    
    console.log(`=== FINAL SEARCH TERMS ===`);
    console.log(`Generated terms: ${keyPhrases}`);
    return keyPhrases;
  } catch (error) {
    console.error("Error generating search terms:", error);
    return getDefaultSearchTermsForCaseType(caseType);
  }
}

// Specialized search term generation for animal protection cases
function generateAnimalProtectionSearchTerms(content: string): string {
  const lowerContent = content.toLowerCase();
  const searchTerms: string[] = [];
  
  console.log("🎯 Generating animal protection specific search terms...");
  
  // PRIORITY 1: Exact statute references (quoted for exact match)
  if (lowerContent.includes("42.092")) {
    searchTerms.push('"Texas Penal Code 42.092"');
    searchTerms.push('"animal cruelty"');
    console.log("✅ Added statute 42.092 terms");
  }
  if (lowerContent.includes("42.091")) {
    searchTerms.push('"Texas Penal Code 42.091"');
    searchTerms.push('"animal neglect"');
    console.log("✅ Added statute 42.091 terms");
  }
  
  // PRIORITY 2: Business-specific terms
  if (lowerContent.includes("dogtopia")) {
    searchTerms.push('"pet boarding negligence"');
    searchTerms.push('"animal care facility liability"');
    console.log("✅ Added Dogtopia-specific terms");
  }
  
  // PRIORITY 3: Animal cruelty and protection terms
  if (lowerContent.includes("animal cruelty") || lowerContent.includes("cruelty")) {
    searchTerms.push('"cruelty to animals"');
    console.log("✅ Added cruelty terms");
  }
  
  if (lowerContent.includes("heat exposure")) {
    searchTerms.push('"heat exposure animal death"');
    console.log("✅ Added heat exposure terms");
  }
  
  // PRIORITY 4: DTPA consumer protection aspect (if present)
  if (lowerContent.includes("dtpa") || lowerContent.includes("deceptive")) {
    searchTerms.push('"DTPA animal services"');
    searchTerms.push('"consumer protection pets"');
    console.log("✅ Added DTPA consumer protection terms");
  }
  
  // PRIORITY 5: General animal care terms (only if specific terms found)
  if (searchTerms.length > 0) {
    if (lowerContent.includes("pet") || lowerContent.includes("animal")) {
      searchTerms.push('"pet death liability"');
      searchTerms.push('"animal care negligence"');
      console.log("✅ Added general animal care terms");
    }
  }
  
  // Add location for Texas-specific cases
  searchTerms.push("Texas");
  
  // If we don't have enough specific terms, add fallback animal protection terms
  if (searchTerms.length < 3) {
    console.log("⚠️ Not enough specific terms, adding fallback animal protection terms");
    searchTerms.push('"animal protection"');
    searchTerms.push('"pet boarding"');
    searchTerms.push('"veterinary malpractice"');
  }
  
  // Limit to most important terms for focused search
  const finalTerms = searchTerms.slice(0, 6);
  console.log(`🎯 Final animal protection search terms: ${finalTerms.join(' ')}`);
  
  return finalTerms.join(' ');
}

// Get default search terms based on case type when no content available
function getDefaultSearchTermsForCaseType(caseType: string): string {
  console.log(`Getting default search terms for case type: ${caseType}`);
  
  switch (caseType) {
    case "animal-protection":
      return '"Texas Penal Code 42.092" "animal cruelty" "pet boarding negligence" Texas';
    case "consumer-protection":
      return '"DTPA" "deceptive trade practices" "consumer protection" Texas';
    case "personal-injury":
      return '"personal injury" "negligence" "damages" Texas';
    default:
      return `${caseType} liability Texas law`;
  }
}

// Extract key phrases from case content with case-type specific logic
function extractKeyPhrases(content: string, caseType: string): string {
  const lowerContent = content.toLowerCase();
  
  // Start with case-specific terms based on detected type
  let caseSpecificTerms: string[] = [];
  
  if (caseType === "consumer-protection" || caseType === "deceptive-trade") {
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
  
  // Combine all terms
  let allTerms = [...statuteReferences, ...caseSpecificTerms, ...caseCitations];
  
  // Remove duplicates and limit to most important terms
  const uniqueTerms = [...new Set(allTerms)];
  
  // Return top 6 terms for effective search
  return uniqueTerms.slice(0, 6).join(" ");
}

// Extract consumer protection specific terms
function extractConsumerProtectionTerms(content: string): string[] {
  const terms = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes("dtpa")) terms.push('"DTPA"');
  if (lowerContent.includes("deceptive trade practices")) terms.push('"deceptive trade practices"');
  if (lowerContent.includes("17.46")) terms.push('"Texas Business Commerce Code 17.46"');
  if (lowerContent.includes("consumer protection")) terms.push('"consumer protection"');
  if (lowerContent.includes("false advertising")) terms.push('"false advertising"');
  if (lowerContent.includes("misrepresentation")) terms.push('"misrepresentation"');
  
  return terms;
}

// Extract personal injury specific terms
function extractPersonalInjuryTerms(content: string): string[] {
  const terms = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes("negligence")) terms.push('"negligence"');
  if (lowerContent.includes("premises liability")) terms.push('"premises liability"');
  if (lowerContent.includes("slip and fall")) terms.push('"slip and fall"');
  if (lowerContent.includes("motor vehicle")) terms.push('"motor vehicle accident"');
  
  return terms;
}

// Extract real estate specific terms
function extractRealEstateTerms(content: string): string[] {
  const terms = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes("real estate")) terms.push('"real estate"');
  if (lowerContent.includes("property")) terms.push('"property"');
  if (lowerContent.includes("deed")) terms.push('"deed"');
  if (lowerContent.includes("landlord")) terms.push('"landlord tenant"');
  
  return terms;
}

// Extract contract specific terms
function extractContractTerms(content: string): string[] {
  const terms = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes("contract")) terms.push('"contract"');
  if (lowerContent.includes("breach")) terms.push('"breach of contract"');
  if (lowerContent.includes("agreement")) terms.push('"agreement"');
  
  return terms;
}

// Extract generic legal terms as fallback
function extractGenericLegalTerms(content: string): string[] {
  const terms = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes("liability")) terms.push('"liability"');
  if (lowerContent.includes("damages")) terms.push('"damages"');
  
  return terms;
}

// Extract case citations
function extractCaseCitations(content: string): string[] {
  const caseCitations = [];
  const casePattern = /([A-Z][a-z]+)\s+v\.\s+([A-Z][a-z]+)/g;
  let match;
  
  while ((match = casePattern.exec(content)) !== null) {
    caseCitations.push(`"${match[1]} v. ${match[2]}"`);
  }
  
  return caseCitations;
}

// Extract statute references
function extractStatuteReferences(content: string): string[] {
  const statutes = [];
  
  // Texas Penal Code patterns
  if (content.includes("42.092")) {
    statutes.push('"Texas Penal Code 42.092"');
  }
  if (content.includes("42.091")) {
    statutes.push('"Texas Penal Code 42.091"');
  }
  
  // DTPA patterns
  if (content.includes("17.46")) {
    statutes.push('"Texas Business Commerce Code 17.46"');
  }
  
  return statutes;
}

// Add case-specific terms with priority for animal protection
export function addExplicitLegalTerms(searchTerms: string, content: string, caseType: string): string {
  console.log(`=== ADDING EXPLICIT LEGAL TERMS ===`);
  console.log(`Original terms: ${searchTerms}`);
  console.log(`Case type: ${caseType}`);
  
  const normalizedType = (caseType || "").toLowerCase().replace(/[-_\s]/g, "");
  
  // For animal protection, be very specific and avoid generic terms
  if (normalizedType.includes("animal") || normalizedType.includes("protection")) {
    const animalTerms = `${searchTerms} "cruelty to animals" "pet care negligence" "animal boarding liability"`;
    console.log(`✅ Enhanced animal protection terms: ${animalTerms}`);
    return animalTerms;
  }
  
  if (normalizedType.includes("consumer") || normalizedType.includes("dtpa") || normalizedType.includes("deceptive")) {
    return `${searchTerms} "DTPA" "consumer protection" "deceptive trade practices" Texas`;
  }
  
  if (normalizedType.includes("personal") || normalizedType.includes("injury")) {
    return `${searchTerms} "personal injury" "negligence" "premises liability" Texas`;
  }
  
  if (normalizedType.includes("contract")) {
    return `${searchTerms} "contract" "breach of contract" "agreement" Texas`;
  }
  
  // Default added terms
  return `${searchTerms} Texas law`;
}
