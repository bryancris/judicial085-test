
// Enhanced case type detector with improved logic and debugging

export function detectCaseType(content: string): string {
  console.log("=== CASE TYPE DETECTION START ===");
  console.log(`Content length: ${content.length}`);
  console.log(`First 500 chars: ${content.substring(0, 500)}`);
  
  const lowerContent = content.toLowerCase();
  const scores: Record<string, number> = {};

  // Initialize all possible case types
  const caseTypes = [
    'premises-liability', 'property-law', 'hoa', 'personal-injury', 'consumer-protection', 
    'contract', 'employment', 'family', 'criminal', 'animal-protection'
  ];
  
  caseTypes.forEach(type => scores[type] = 0);

  console.log("=== CASE TYPE DETECTION ANALYSIS ===");
  console.log(`Text length: ${content.length}`);
  console.log(`Sample text: ${lowerContent.substring(0, 300)}`);

  // PRIORITY 1: Premises Liability Detection (NEW - Highest Priority for slip/fall)
  if (lowerContent.includes("slip") || lowerContent.includes("fall") || lowerContent.includes("fell")) {
    scores['premises-liability'] += 40;
    console.log("🏢 FOUND: Slip/fall terms - Adding 40 to premises-liability");
  }
  
  if (lowerContent.includes("floor") || lowerContent.includes("wet") || lowerContent.includes("spill")) {
    scores['premises-liability'] += 30;
    console.log("🏢 FOUND: Floor/wet/spill terms - Adding 30 to premises-liability");
  }
  
  if (lowerContent.includes("store") || lowerContent.includes("business premises")) {
    scores['premises-liability'] += 25;
    console.log("🏢 FOUND: Store/business premises - Adding 25 to premises-liability");
  }
  
  if (lowerContent.includes("premises liability") || lowerContent.includes("property owner")) {
    scores['premises-liability'] += 35;
    console.log("🏢 FOUND: Premises liability terms - Adding 35 to premises-liability");
  }

  // PRIORITY 2: HOA and Property Law Detection
  if (lowerContent.includes("209.006") || lowerContent.includes("209.007")) {
    scores['property-law'] += 50;
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

  // PRIORITY 3: Consumer Protection
  if (lowerContent.includes("dtpa") || lowerContent.includes("deceptive trade")) {
    scores['consumer-protection'] += 30;
    console.log("💼 FOUND: DTPA/deceptive trade - Adding 30 to consumer-protection");
  }

  if (lowerContent.includes("17.46") || lowerContent.includes("business commerce code")) {
    scores['consumer-protection'] += 25;
    console.log("💼 FOUND: Business Commerce Code - Adding 25 to consumer-protection");
  }

  // PRIORITY 4: Personal Injury (Only if no premises liability indicators)
  const hasPremisesIndicators = scores['premises-liability'] > 0;
  
  if (!hasPremisesIndicators) {
    if (lowerContent.includes("negligence") && !lowerContent.includes("premises")) {
      scores['personal-injury'] += 15;
      console.log("⚖️ FOUND: Negligence (no premises context) - Adding 15 to personal-injury");
    }

    if (lowerContent.includes("injury") || lowerContent.includes("damages")) {
      scores['personal-injury'] += 10;
      console.log("⚖️ FOUND: Injury/damages (no premises context) - Adding 10 to personal-injury");
    }
  }

  // PRIORITY 5: Animal Protection
  const animalTerms = ['animal', 'pet', 'dog', 'cat', 'veterinary', 'cruelty'];
  const animalCount = animalTerms.filter(term => lowerContent.includes(term)).length;
  
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
  const detectedType = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || "general";
  
  console.log("=== DETECTION RESULT ===");
  console.log(`Highest score: ${maxScore}`);
  console.log(`Detected type: ${detectedType}`);
  
  // Only return confident detections
  if (maxScore >= 15) {
    console.log(`✅ CONFIDENT DETECTION: ${detectedType} (score: ${maxScore})`);
    return detectedType;
  } else {
    console.log(`⚠️ LOW CONFIDENCE: Using general (highest score: ${maxScore})`);
    return "general";
  }
}

// Add the missing export that was causing the boot failure
export function detectCaseTypeFromText(content: string): string {
  return detectCaseType(content);
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

  // For premises liability cases, always prefer the AI detection
  if (aiDetectedType === 'premises-liability') {
    console.log(`=== FINAL RESULT: Using detected premises liability type: ${aiDetectedType} ===`);
    return aiDetectedType;
  }

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
