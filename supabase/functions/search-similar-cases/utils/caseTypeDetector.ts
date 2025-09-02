// Enhanced case type detection with better premises liability recognition

export function determineFinalCaseType(analysisContent: string, storedCaseType?: string | null): string {
  console.log("=== CASE TYPE DETERMINATION START ===");
  
  const detectedType = detectCaseTypeFromContent(analysisContent);
  console.log(`Detected type from analysis content: ${detectedType}`);
  console.log(`Stored case type: ${storedCaseType}`);
  
  // If we have a confident detection (score > 100), use it
  if (detectedType !== "general") {
    console.log(`=== FINAL RESULT: Using detected ${detectedType} type: ${detectedType} ===`);
    return detectedType;
  }
  
  // Otherwise, use stored case type if available
  if (storedCaseType && storedCaseType !== "general") {
    console.log(`=== FINAL RESULT: Using stored case type: ${storedCaseType} ===`);
    return storedCaseType;
  }
  
  // Final fallback
  console.log(`=== FINAL RESULT: Using fallback general type ===`);
  return "general";
}

function detectCaseTypeFromContent(content: string): string {
  console.log("=== CASE TYPE DETECTION START ===");
  console.log(`Content length: ${content.length}`);
  console.log(`First 500 chars: ${content.substring(0, 500)}`);
  
  if (!content || content.length < 50) {
    return "general";
  }
  
  const lowerContent = content.toLowerCase();
  console.log("=== CASE TYPE DETECTION ANALYSIS ===");
  console.log(`Text length: ${content.length}`);
  console.log(`Sample text: ${lowerContent.substring(0, 200)}`);
  
  const typeScores: { [key: string]: number } = {
    "lemon-law": 0,
    "premises-liability": 0,
    "personal-injury": 0,
    "consumer-protection": 0,
    "contract": 0,
    "employment": 0,
    "property-law": 0,
    "general": 0
  };
  
  // Enhanced lemon law detection (highest priority)
  if (lowerContent.includes("lemon law") || lowerContent.includes("lemon-law")) {
    typeScores["lemon-law"] += 80;
    console.log("🚗 FOUND: Lemon law terms - Adding 80 to lemon-law");
  }
  
  if (lowerContent.includes("vehicle") || lowerContent.includes("motor vehicle") || lowerContent.includes("car") || 
      lowerContent.includes("truck") || lowerContent.includes("automotive")) {
    typeScores["lemon-law"] += 40;
    console.log("🚗 FOUND: Vehicle terms - Adding 40 to lemon-law");
  }
  
  if (lowerContent.includes("warranty") && (lowerContent.includes("vehicle") || lowerContent.includes("car") || 
      lowerContent.includes("motor") || lowerContent.includes("automotive"))) {
    typeScores["lemon-law"] += 45;
    console.log("🚗 FOUND: Vehicle warranty terms - Adding 45 to lemon-law");
  }
  
  if (lowerContent.includes("repair attempts") || lowerContent.includes("defects") || lowerContent.includes("substantial impairment") ||
      lowerContent.includes("reasonable repair") || lowerContent.includes("manufacturer") || lowerContent.includes("dealership")) {
    typeScores["lemon-law"] += 35;
    console.log("🚗 FOUND: Lemon law specific terms - Adding 35 to lemon-law");
  }
  
  if (lowerContent.includes("texas occupations code") && (lowerContent.includes("2301") || lowerContent.includes("motor vehicle"))) {
    typeScores["lemon-law"] += 50;
    console.log("🚗 FOUND: Texas Lemon Law statute - Adding 50 to lemon-law");
  }
  
  if (lowerContent.includes("refund") && lowerContent.includes("replacement") && 
      (lowerContent.includes("vehicle") || lowerContent.includes("car"))) {
    typeScores["lemon-law"] += 30;
    console.log("🚗 FOUND: Lemon law remedies - Adding 30 to lemon-law");
  }
  
  // Enhanced premises liability detection
  if (lowerContent.includes("slip") || lowerContent.includes("fall")) {
    typeScores["premises-liability"] += 40;
    console.log("🏢 FOUND: Slip/fall terms - Adding 40 to premises-liability");
  }
  
  if (lowerContent.includes("floor") || lowerContent.includes("wet") || lowerContent.includes("spill")) {
    typeScores["premises-liability"] += 30;
    console.log("🏢 FOUND: Floor/wet/spill terms - Adding 30 to premises-liability");
  }
  
  if (lowerContent.includes("store") || lowerContent.includes("business") || lowerContent.includes("retail") || 
      lowerContent.includes("premises") || lowerContent.includes("property owner") || lowerContent.includes("invitee")) {
    typeScores["premises-liability"] += 25;
    console.log("🏢 FOUND: Store/business premises - Adding 25 to premises-liability");
  }
  
  if (lowerContent.includes("premises liability") || lowerContent.includes("dangerous condition") || 
      lowerContent.includes("constructive knowledge") || lowerContent.includes("actual knowledge")) {
    typeScores["premises-liability"] += 35;
    console.log("🏢 FOUND: Premises liability terms - Adding 35 to premises-liability");
  }
  
  // Consumer protection detection (but differentiate from lemon law)
  if ((lowerContent.includes("dtpa") || lowerContent.includes("deceptive trade practices")) && 
      !lowerContent.includes("vehicle") && !lowerContent.includes("car") && !lowerContent.includes("motor")) {
    typeScores["consumer-protection"] += 50;
  }
  if (lowerContent.includes("consumer protection") || lowerContent.includes("false advertising")) {
    typeScores["consumer-protection"] += 30;
  }
  
  // Enhanced contract detection with construction-specific terms
  if (lowerContent.includes("breach of contract") || lowerContent.includes("contract violation")) {
    typeScores["contract"] += 40;
    console.log("📋 FOUND: Breach of contract terms - Adding 40 to contract");
  }
  if (lowerContent.includes("express warranty") || lowerContent.includes("warranty breach")) {
    typeScores["contract"] += 35;
    console.log("📋 FOUND: Warranty terms - Adding 35 to contract");
  }
  if (lowerContent.includes("construction contract") || lowerContent.includes("home renovation") || 
      lowerContent.includes("kitchen renovation") || lowerContent.includes("contractor") || 
      lowerContent.includes("construction") || lowerContent.includes("building contract")) {
    typeScores["contract"] += 30;
    console.log("🏗️ FOUND: Construction contract terms - Adding 30 to contract");
  }
  if (lowerContent.includes("material substitution") || lowerContent.includes("inferior materials") || 
      lowerContent.includes("cheaper materials") || lowerContent.includes("specification") || 
      lowerContent.includes("granite countertops") || lowerContent.includes("hardwood cabinets")) {
    typeScores["contract"] += 25;
    console.log("🔧 FOUND: Material/specification terms - Adding 25 to contract");
  }
  if (lowerContent.includes("business & commerce code") || lowerContent.includes("ucc") || 
      lowerContent.includes("§ 2.313") || lowerContent.includes("§ 1.203") || lowerContent.includes("§ 2.714")) {
    typeScores["contract"] += 30;
    console.log("⚖️ FOUND: UCC/Commerce Code terms - Adding 30 to contract");
  }
  if (lowerContent.includes("agreement") || lowerContent.includes("contractual")) {
    typeScores["contract"] += 20;
  }
  
  // Personal injury (general)
  if (lowerContent.includes("personal injury") || lowerContent.includes("negligence")) {
    typeScores["personal-injury"] += 30;
  }
  if (lowerContent.includes("medical malpractice") || lowerContent.includes("car accident")) {
    typeScores["personal-injury"] += 25;
  }
  
  // Employment
  if (lowerContent.includes("wrongful termination") || lowerContent.includes("employment")) {
    typeScores["employment"] += 40;
  }
  
  // Property law
  if (lowerContent.includes("property law") || lowerContent.includes("real estate")) {
    typeScores["property-law"] += 30;
  }
  
  console.log("=== SCORING BREAKDOWN ===");
  Object.entries(typeScores).forEach(([type, score]) => {
    if (score > 0) {
      console.log(`${type}: ${score} points`);
    }
  });
  
  const highestScore = Math.max(...Object.values(typeScores));
  console.log("=== DETECTION RESULT ===");
  console.log(`Highest score: ${highestScore}`);
  
  if (highestScore >= 50) {
    const detectedType = Object.entries(typeScores).find(([_, score]) => score === highestScore)?.[0] || "general";
    console.log(`✅ CONFIDENT DETECTION: ${detectedType} (score: ${highestScore})`);
    console.log(`Detected type: ${detectedType}`);
    return detectedType;
  }
  
  console.log("❓ NO CONFIDENT DETECTION: Using general");
  return "general";
}
