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
    
    // For HOA cases, use specialized HOA search strategy
    if (detectHOACase(content, caseType)) {
      const hoaSpecificTerms = generateHOASearchTerms(content);
      console.log(`=== HOA SEARCH TERMS ===`);
      console.log(`Generated terms: ${hoaSpecificTerms}`);
      return hoaSpecificTerms;
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

// Detect HOA cases from content and case type
function detectHOACase(content: string, caseType: string): boolean {
  const lowerContent = content.toLowerCase();
  const lowerCaseType = caseType.toLowerCase();
  
  const hoaIndicators = [
    'hoa', 'homeowners association', 'homeowner association',
    'cc&r', 'restrictive covenant', 'deed restriction',
    'commercial vehicle', 'hoa board', 'property restriction',
    'selective enforcement', 'covenant enforcement'
  ];
  
  return hoaIndicators.some(indicator => 
    lowerContent.includes(indicator) || lowerCaseType.includes(indicator)
  );
}

// Specialized search term generation for HOA cases
function generateHOASearchTerms(content: string): string {
  const lowerContent = content.toLowerCase();
  const searchTerms: string[] = [];
  
  console.log("🏘️ Generating HOA-specific search terms...");
  
  // PRIORITY 1: Core HOA enforcement terms
  searchTerms.push('"HOA selective enforcement"');
  searchTerms.push('"homeowners association"');
  
  // PRIORITY 2: Legal concept terms
  if (lowerContent.includes("selective") || lowerContent.includes("enforcement")) {
    searchTerms.push('"selective enforcement"');
    searchTerms.push('"discriminatory enforcement"');
    console.log("✅ Added selective enforcement terms");
  }
  
  // PRIORITY 3: Property Code references
  if (lowerContent.includes("property code") || lowerContent.includes("202") || lowerContent.includes("204")) {
    searchTerms.push('"Texas Property Code 202"');
    searchTerms.push('"Texas Property Code 204"');
    console.log("✅ Added Property Code terms");
  }
  
  // PRIORITY 4: Restrictive covenant terms
  if (lowerContent.includes("cc&r") || lowerContent.includes("covenant") || lowerContent.includes("restriction")) {
    searchTerms.push('"restrictive covenants"');
    searchTerms.push('"CC&R enforcement"');
    console.log("✅ Added covenant terms");
  }
  
  // PRIORITY 5: Commercial vehicle specific terms
  if (lowerContent.includes("vehicle") || lowerContent.includes("commercial")) {
    searchTerms.push('"commercial vehicle restriction"');
    searchTerms.push('"HOA vehicle policy"');
    console.log("✅ Added vehicle restriction terms");
  }
  
  // PRIORITY 6: Legal defense terms
  if (lowerContent.includes("waiver") || lowerContent.includes("estoppel")) {
    searchTerms.push('"waiver estoppel"');
    searchTerms.push('"HOA waiver defense"');
    console.log("✅ Added legal defense terms");
  }
  
  // PRIORITY 7: Board authority and conflicts
  if (lowerContent.includes("board") || lowerContent.includes("conflict")) {
    searchTerms.push('"HOA board authority"');
    searchTerms.push('"conflict of interest"');
    console.log("✅ Added board authority terms");
  }
  
  // Add Texas for jurisdiction
  searchTerms.push("Texas");
  
  // If we don't have enough specific terms, add fallback HOA terms
  if (searchTerms.length < 4) {
    console.log("⚠️ Not enough specific terms, adding fallback HOA terms");
    searchTerms.push('"deed restrictions"');
    searchTerms.push('"homeowner rights"');
    searchTerms.push('"HOA enforcement"');
  }
  
  // Limit to most important terms for focused search
  const finalTerms = searchTerms.slice(0, 7);
  console.log(`🏘️ Final HOA search terms: ${finalTerms.join(' ')}`);
  
  return finalTerms.join(' ');
}

// Get default search terms based on case type when no content available
function getDefaultSearchTermsForCaseType(caseType: string): string {
  console.log(`Getting default search terms for case type: ${caseType}`);
  
  switch (caseType) {
    case "animal-protection":
      return '"Texas Penal Code 42.092" "animal cruelty" "pet boarding negligence" Texas';
    case "hoa":
    case "homeowners":
    case "hoa-enforcement":
      return '"HOA selective enforcement" "restrictive covenants" "Texas Property Code 202" Texas';
    case "consumer-protection":
      return '"DTPA" "deceptive trade practices" "consumer protection" Texas';
    case "personal-injury":
    case "premises-liability":
      return '"premises liability" "slip and fall" "negligence" Texas';
    case "general":
      return '"premises liability" "negligence" "liability" Texas';
    default:
      return `${caseType} liability negligence Texas`;
  }
}

// Extract key phrases from case content with case-type specific logic
function extractKeyPhrases(content: string, caseType: string): string {
  const lowerContent = content.toLowerCase();
  
  // Detect premises liability/slip and fall cases first
  const detectedType = detectSpecificCaseType(content, caseType);
  console.log(`🔍 Detected specific case type: ${detectedType}`);
  
  // Start with case-specific terms based on detected type
  let caseSpecificTerms: string[] = [];
  
  if (detectedType === "premises-liability") {
    caseSpecificTerms = extractPremisesLiabilityTerms(content);
  } else if (caseType === "consumer-protection" || caseType === "deceptive-trade") {
    caseSpecificTerms = extractConsumerProtectionTerms(content);
  } else if (caseType === "personal-injury") {
    caseSpecificTerms = extractPersonalInjuryTerms(content);
  } else if (caseType === "real-estate") {
    caseSpecificTerms = extractRealEstateTerms(content);
  } else if (caseType === "contract") {
    caseSpecificTerms = extractContractTerms(content);
  } else {
    // For "general" cases, try to detect what type they really are
    caseSpecificTerms = extractGeneralCaseTerms(content);
  }
  
  // Extract statute references
  const statuteReferences = extractStatuteReferences(content);
  
  // Combine all terms, prioritizing broader legal concepts
  let allTerms = [...caseSpecificTerms, ...statuteReferences];
  
  // Add Texas for jurisdiction
  allTerms.push("Texas");
  
  // Remove duplicates and limit to most important terms
  const uniqueTerms = [...new Set(allTerms)];
  
  // Return top 5 terms for effective search (broader search)
  const finalTerms = uniqueTerms.slice(0, 5).join(" ");
  console.log(`🎯 Final search terms for ${detectedType}: ${finalTerms}`);
  return finalTerms;
}

// Detect specific case types from content
function detectSpecificCaseType(content: string, originalType: string): string {
  const lowerContent = content.toLowerCase();
  
  // Check for premises liability indicators
  if (lowerContent.includes("slip") || lowerContent.includes("fall") || 
      lowerContent.includes("fell") || lowerContent.includes("floor") ||
      lowerContent.includes("wet") || lowerContent.includes("spill") ||
      lowerContent.includes("store") || lowerContent.includes("premises") ||
      lowerContent.includes("property owner") || lowerContent.includes("negligence")) {
    return "premises-liability";
  }
  
  return originalType;
}

// Extract premises liability specific terms (NEW - for slip and fall cases)
function extractPremisesLiabilityTerms(content: string): string[] {
  const terms = [];
  const lowerContent = content.toLowerCase();
  
  // Core premises liability terms
  terms.push('"premises liability"');
  
  if (lowerContent.includes("slip") || lowerContent.includes("fall") || lowerContent.includes("fell")) {
    terms.push('"slip and fall"');
  }
  
  if (lowerContent.includes("negligence")) {
    terms.push('"negligence"');
  }
  
  if (lowerContent.includes("store") || lowerContent.includes("business")) {
    terms.push('"business premises"');
  }
  
  if (lowerContent.includes("wet") || lowerContent.includes("spill")) {
    terms.push('"dangerous condition"');
  }
  
  // Always include general liability for broader search
  terms.push('"liability"');
  
  console.log(`✅ Generated premises liability terms: ${terms.join(', ')}`);
  return terms;
}

// Extract general case terms (improved for "general" case types)
function extractGeneralCaseTerms(content: string): string[] {
  const terms = [];
  const lowerContent = content.toLowerCase();
  
  // Check for premises liability first
  if (lowerContent.includes("slip") || lowerContent.includes("fall") || 
      lowerContent.includes("premises") || lowerContent.includes("floor")) {
    terms.push('"premises liability"');
    terms.push('"slip and fall"');
  }
  
  // General liability terms
  if (lowerContent.includes("negligence")) {
    terms.push('"negligence"');
  }
  
  if (lowerContent.includes("liability")) {
    terms.push('"liability"');
  }
  
  if (lowerContent.includes("damages")) {
    terms.push('"damages"');
  }
  
  // If no specific terms found, add broad legal terms
  if (terms.length === 0) {
    terms.push('"negligence"');
    terms.push('"liability"');
  }
  
  console.log(`✅ Generated general case terms: ${terms.join(', ')}`);
  return terms;
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
  
  // Civil Practice and Remedies Code
  if (content.includes("75.002")) {
    statutes.push('"Texas Civil Practice Remedies Code 75.002"');
  }
  
  return statutes;
}

// Add case-specific terms with priority for specific case types
export function addExplicitLegalTerms(searchTerms: string, content: string, caseType: string): string {
  console.log(`=== ADDING EXPLICIT LEGAL TERMS ===`);
  console.log(`Original terms: ${searchTerms}`);
  console.log(`Case type: ${caseType}`);
  
  const normalizedType = (caseType || "").toLowerCase().replace(/[-_\s]/g, "");
  const lowerContent = content.toLowerCase();
  
  // For HOA cases, add specific HOA legal terms
  if (normalizedType.includes("hoa") || normalizedType.includes("homeowner") || 
      lowerContent.includes("hoa") || lowerContent.includes("homeowner") ||
      lowerContent.includes("cc&r") || lowerContent.includes("restrictive covenant")) {
    const hoaTerms = `${searchTerms} "HOA selective enforcement" "restrictive covenants" "Texas Property Code 202" "waiver estoppel"`;
    console.log(`✅ Enhanced HOA terms: ${hoaTerms}`);
    return hoaTerms;
  }
  
  // For premises liability/slip and fall cases
  if (normalizedType.includes("general") || normalizedType.includes("premises") || 
      lowerContent.includes("slip") || lowerContent.includes("fall")) {
    const premisesTerms = `${searchTerms} "premises liability" "slip and fall" "negligence" Texas`;
    console.log(`✅ Enhanced premises liability terms: ${premisesTerms}`);
    return premisesTerms;
  }
  
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
  return `${searchTerms} Texas law liability`;
}
