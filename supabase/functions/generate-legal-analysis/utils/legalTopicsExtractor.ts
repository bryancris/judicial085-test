
export interface LegalContext {
  topics: string[];
  statutes: string[];
  cases: string[];
}

// Enhanced function to extract key legal topics from conversation with improved consumer protection coverage
export function extractLegalTopics(conversation: Array<{ content: string }>): LegalContext {
  const combinedText = conversation.map(msg => msg.content).join(" ");
  
  // Enhanced list of potential legal topics with specific focus on premises liability, consumer protection and other areas
  const legalTopics = [
    // General legal topics
    "personal injury", "premises liability", "negligence", "tort", 
    "civil practice", "CPRC", "family law", "divorce", "custody", 
    "property division", "criminal", "DUI", "DWI", "theft", 
    "assault", "battery", "contract", "breach", "damages", 
    "real estate", "landlord tenant", "eviction", "workers compensation",
    "employment", "discrimination", "estate planning", "probate", "will", 
    "trust", "guardianship", "business formation", "LLC", "corporation",
    "insurance", "malpractice", "wrongful death", "product liability",
    
    // Enhanced premises liability topics
    "slip and fall", "slip", "fall", "premises", "hazardous condition",
    "unsafe condition", "invitee", "business premises", "duty of care",
    "store liability", "retail", "floor", "wet", "spill", "hazard",
    "dangerous condition", "constructive knowledge", "actual knowledge",
    
    // Enhanced consumer protection topics
    "deceptive trade practices", "DTPA", "consumer protection", 
    "false advertising", "warranty", "misleading", "door-to-door", 
    "home solicitation", "cooling off period", "right to cancel",
    "debt collection", "usury", "predatory lending", "loan", "finance charge",
    "consumer fraud", "bait and switch", "unfair practices", "misrepresentation",
    
    // Animal protection topics
    "animal cruelty", "animal abuse", "pet", "dog", "cat", "boarding",
    "veterinary malpractice", "animal neglect", "animal care", "pet boarding"
  ];
  
  // Find which topics are mentioned in the conversation
  const mentionedTopics = legalTopics.filter(topic => 
    combinedText.toLowerCase().includes(topic.toLowerCase())
  );
  
  // Extract consumer protection statute references like "Section 17.46" (DTPA)
  const dtpaStatutePattern = /\b(section|§)\s*(17\.\d+)\b|\bDTPA\b|Bus\.\s*(&|and)\s*Com\.\s*Code/gi;
  const dtpaStatutes = (combinedText.match(dtpaStatutePattern) || []).map(s => 
    s.replace(/^(section|§)\s*/i, '')
  );
  
  // Extract animal cruelty statute references like "42.092"
  const animalStatutePattern = /\b(section|§)\s*(42\.09\d*)\b|penal\s*code\s*(42\.09\d*)/gi;
  const animalStatutes = (combinedText.match(animalStatutePattern) || []).map(s => 
    s.replace(/^(section|§)\s*/i, '').replace(/penal\s*code\s*/i, '')
  );
  
  // Extract general statute references like "Section 101.021"
  const statutePattern = /\b(section|§)\s*\d+(\.\d+)*\b/gi;
  const potentialStatutes = combinedText.match(statutePattern) || [];
  
  // Extract case names like "Roe v. Wade"
  const casePattern = /\b[A-Z][a-z]+\s+v\.?\s+[A-Z][a-z]+\b/g;
  const potentialCases = combinedText.match(casePattern) || [];
  
  return {
    topics: mentionedTopics,
    statutes: [...new Set([...dtpaStatutes, ...animalStatutes, ...potentialStatutes.map(s => s.replace(/^(section|§)\s*/i, ''))])],
    cases: potentialCases
  };
}

// Enhanced function to detect case type for specialized prompt enhancement
export function detectCaseType(legalContext: LegalContext): string {
  const consumerTopics = [
    "deceptive trade practices", "dtpa", "consumer protection", 
    "false advertising", "warranty", "misleading", "door-to-door", 
    "home solicitation", "cooling off", "right to cancel", "17.46", 
    "consumer fraud", "bait and switch", "unfair practices", "misrepresentation"
  ];
  
  const premisesTopics = [
    "premises liability", "slip", "fall", "premises", "negligence",
    "unsafe condition", "hazardous condition", "invitee", "business premises",
    "duty of care", "store", "retail", "floor", "wet", "spill", "hazard"
  ];
  
  const animalTopics = [
    "animal cruelty", "animal abuse", "pet", "dog", "cat", "boarding",
    "veterinary malpractice", "animal neglect", "42.092", "dogtopia"
  ];
  
  // Convert topics to lowercase for case-insensitive comparison
  const lowerTopics = legalContext.topics.map(t => t.toLowerCase());
  const combinedText = legalContext.topics.join(" ").toLowerCase();
  
  // Check for premises liability cases first (highest priority for slip and fall)
  const hasPremisesTopic = premisesTopics.some(topic => 
    lowerTopics.includes(topic.toLowerCase()) || combinedText.includes(topic)
  );
  
  // Check if any consumer protection topics are mentioned
  const hasConsumerTopic = consumerTopics.some(topic => 
    lowerTopics.includes(topic.toLowerCase()) || combinedText.includes(topic)
  );
  
  // Check if any animal protection topics are mentioned
  const hasAnimalTopic = animalTopics.some(topic => 
    lowerTopics.includes(topic.toLowerCase()) || combinedText.includes(topic)
  );
  
  // Check if any statutes mention relevant sections
  const hasDTPAStatute = legalContext.statutes.some(statute => 
    statute.startsWith("17.4") || statute.includes("DTPA")
  );
  
  const hasAnimalStatute = legalContext.statutes.some(statute => 
    statute.startsWith("42.09")
  );
  
  // Prioritize premises liability detection for slip and fall cases
  if (hasPremisesTopic) {
    return "premises-liability";
  }
  
  if (hasConsumerTopic || hasDTPAStatute) {
    return "consumer-protection";
  }
  
  if (hasAnimalTopic || hasAnimalStatute) {
    return "animal-protection";
  }
  
  return "general";
}
