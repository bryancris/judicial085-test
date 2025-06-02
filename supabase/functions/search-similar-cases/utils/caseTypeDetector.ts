
// Enhanced case type detector with improved logic and debugging

export function detectCaseType(content: string): string {
  console.log("=== CASE TYPE DETECTION START ===");
  console.log(`Content length: ${content.length}`);
  console.log(`First 500 chars: ${content.substring(0, 500)}`);
  
  const lowerContent = content.toLowerCase();
  const scores: Record<string, number> = {};

  // Initialize all possible case types
  const caseTypes = [
    'property-law', 'hoa', 'personal-injury', 'consumer-protection', 
    'contract', 'employment', 'family', 'criminal', 'animal-protection'
  ];
  
  caseTypes.forEach(type => scores[type] = 0);

  console.log("=== CASE TYPE DETECTION ANALYSIS ===");
  console.log(`Text length: ${content.length}`);
  console.log(`Sample text: ${lowerContent.substring(0, 300)}`);

  // PRIORITY 1: HOA and Property Law Detection (Highest Priority)
  if (lowerContent.includes("209.006") || lowerContent.includes("209.007")) {
    scores['property-law'] += 50; // Very high score for specific statutes
    scores['hoa'] += 50;
    console.log("🏠 FOUND: Texas Property Code statutes - Adding 50 to property-law and hoa");
  }
  
  if (lowerContent.includes("homeowners") || lowerContent.includes("homeowner")) {
    scores['property-law'] += 30;
    scores['hoa'] += 30;
    console.log("🏠 FOUND: Homeowners terms - Adding 30 to property-law and hoa");
  }
  
  if (lowerContent.includes("hoa") || lowerContent.includes("association")) {
    scores['property-law'] += 25;
    scores['hoa'] += 25;
    console.log("🏠 FOUND: HOA/Association terms - Adding 25 to property-law and hoa");
  }

  if (lowerContent.includes("property code") || lowerContent.includes("texas property")) {
    scores['property-law'] += 20;
    console.log("🏠 FOUND: Property code references - Adding 20 to property-law");
  }

  if (lowerContent.includes("fine") && (lowerContent.includes("notice") || lowerContent.includes("violation"))) {
    scores['property-law'] += 15;
    scores['hoa'] += 15;
    console.log("🏠 FOUND: Fine and notice/violation - Adding 15 to property-law and hoa");
  }

  // PRIORITY 2: Consumer Protection
  if (lowerContent.includes("dtpa") || lowerContent.includes("deceptive trade")) {
    scores['consumer-protection'] += 30;
    console.log("💼 FOUND: DTPA/deceptive trade - Adding 30 to consumer-protection");
  }

  if (lowerContent.includes("17.46") || lowerContent.includes("business commerce code")) {
    scores['consumer-protection'] += 25;
    console.log("💼 FOUND: Business Commerce Code - Adding 25 to consumer-protection");
  }

  // PRIORITY 3: Personal Injury (Only if no property/HOA indicators)
  const hasPropertyIndicators = scores['property-law'] > 0 || scores['hoa'] > 0;
  
  if (!hasPropertyIndicators) {
    if (lowerContent.includes("negligence") || lowerContent.includes("liability")) {
      scores['personal-injury'] += 10; // Lower score to avoid conflicts
      console.log("⚖️ FOUND: Negligence/liability (no property context) - Adding 10 to personal-injury");
    }

    if (lowerContent.includes("injury") || lowerContent.includes("damages")) {
      scores['personal-injury'] += 8;
      console.log("⚖️ FOUND: Injury/damages (no property context) - Adding 8 to personal-injury");
    }
  }

  // PRIORITY 4: Animal Protection (Only with specific animal indicators)
  const animalTerms = ['animal', 'pet', 'dog', 'cat', 'veterinary', 'cruelty'];
  const animalCount = animalTerms.filter(term => lowerContent.includes(term)).length;
  
  // Only consider animal protection if we have multiple animal terms AND specific statutes
  if (animalCount >= 2 && (lowerContent.includes("42.092") || lowerContent.includes("42.091"))) {
    scores['animal-protection'] += animalCount * 5;
    console.log(`🐾 FOUND: ${animalCount} animal terms with animal statutes - Adding ${animalCount * 5} to animal-protection`);
  }

  // Contract Law
  if (lowerContent.includes("contract") || lowerContent.includes("agreement")) {
    scores['contract'] += 15;
    console.log("📄 FOUND: Contract terms - Adding 15 to contract");
  }

  console.log("=== SCORING BREAKDOWN ===");
  Object.entries(scores).forEach(([type, score]) => {
    if (score > 0) {
      console.log(`${type}: ${score} points`);
    }
  });

  // Find the highest scoring type
  const maxScore = Math.max(...Object.values(scores));
  const detectedType = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || "general-legal-matter";
  
  console.log("=== DETECTION RESULT ===");
  console.log(`Highest score: ${maxScore}`);
  console.log(`Detected type: ${detectedType}`);
  
  // Only return confident detections
  if (maxScore >= 15) {
    console.log(`✅ CONFIDENT DETECTION: ${detectedType} (score: ${maxScore})`);
    return detectedType;
  } else {
    console.log(`⚠️ LOW CONFIDENCE: Using general-legal-matter (highest score: ${maxScore})`);
    return "general-legal-matter";
  }
}

// Helper to determine final case type with stored case type override
export function determineFinalCaseType(
  analysisContent: string,
  storedCaseType: string | null,
  detectedType?: string
): string {
  console.log("=== CASE TYPE DETERMINATION START ===");
  
  const aiDetectedType = detectedType || detectCaseType(analysisContent);
  console.log(`Detected type from analysis content: ${aiDetectedType}`);
  console.log(`Stored case type: ${storedCaseType}`);

  // For property law and HOA cases, always prefer the AI detection
  if (aiDetectedType === 'property-law' || aiDetectedType === 'hoa') {
    console.log(`=== FINAL RESULT: Using detected type: ${aiDetectedType} ===`);
    return aiDetectedType;
  }

  // For other cases, use stored type if available and reasonable
  if (storedCaseType && storedCaseType !== 'business' && storedCaseType !== 'general') {
    console.log(`=== FINAL RESULT: Using stored type: ${storedCaseType} ===`);
    return storedCaseType;
  }

  console.log(`=== FINAL RESULT: Using detected type: ${aiDetectedType} ===`);
  return aiDetectedType;
}
