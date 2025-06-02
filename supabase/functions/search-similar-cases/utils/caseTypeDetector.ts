
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function identifyCaseType(clientId: string): Promise<string> {
  try {
    console.log(`Identifying case type for client ${clientId}`);
    
    // First check if we already have a case type in legal_analyses
    const { data: analyses, error: analysesError } = await supabase
      .from('legal_analyses')
      .select('case_type, content')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (analysesError) {
      console.error("Error fetching analyses:", analysesError);
    } else if (analyses && analyses.length > 0) {
      // Check content for specific case type indicators regardless of the stored case type
      const analysisContent = analyses[0].content || "";
      const detectedTypeFromContent = detectCaseTypeFromText(analysisContent);
      
      // If we detect a specific type from content that's different from stored type,
      // use the content-based detection as it may be more accurate
      if (detectedTypeFromContent !== "general" && detectedTypeFromContent !== analyses[0].case_type) {
        console.log(`Detected more specific case type from analysis content: ${detectedTypeFromContent}`);
        return detectedTypeFromContent;
      }
      
      if (analyses[0].case_type) {
        console.log(`Found existing case type: ${analyses[0].case_type}`);
        return analyses[0].case_type;
      }
    }
    
    // Check cases table for case_type
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('case_type, description')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (casesError) {
      console.error("Error fetching cases:", casesError);
    } else if (cases && cases.length > 0 && cases[0].case_type) {
      console.log(`Found case type in cases table: ${cases[0].case_type}`);
      
      // Also check case description for more specific indicators
      if (cases[0].description) {
        const detectedTypeFromDescription = detectCaseTypeFromText(cases[0].description);
        if (detectedTypeFromDescription !== "general" && detectedTypeFromDescription !== cases[0].case_type) {
          console.log(`Detected more specific case type from case description: ${detectedTypeFromDescription}`);
          return detectedTypeFromDescription;
        }
      }
      
      return cases[0].case_type;
    }
    
    // If we still don't have a case type, check client messages
    const { data: messages, error: messagesError } = await supabase
      .from('client_messages')
      .select('content')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return "general";
    }
    
    if (!messages || messages.length === 0) {
      console.log("No messages found to determine case type");
      return "general";
    }
    
    // Combine all messages to analyze content
    const combinedContent = messages.map(msg => msg.content).join(' ');
    
    // Detect case type from combined message content
    const messageBasedCaseType = detectCaseTypeFromText(combinedContent);
    console.log(`Detected case type from messages: ${messageBasedCaseType}`);
    return messageBasedCaseType;
  } catch (error) {
    console.error("Error identifying case type:", error);
    return "general";
  }
}

// Extract the case type directly from text content with improved detection patterns
export function detectCaseTypeFromText(text: string): string {
  if (!text) return "general";
  
  const lowerText = text.toLowerCase();
  console.log(`Analyzing text for case type detection: ${lowerText.substring(0, 200)}...`);
  
  // Define pattern matching scores for different case types
  let scores: Record<string, number> = {
    "animal-protection": 0,
    "consumer-protection": 0,
    "personal-injury": 0,
    "real-estate": 0,
    "contract": 0,
    "family": 0,
    "criminal": 0,
    "deceptive-trade": 0,
    "bailment": 0,
    "negligence": 0,
    "product-liability": 0
  };
  
  // Animal Protection - HIGHEST PRIORITY PATTERNS with significantly increased weights
  if (lowerText.includes("§ 42.092") || 
      lowerText.includes("42.092") || 
      lowerText.includes("42.091") ||
      (lowerText.includes("texas penal code") && (lowerText.includes("42.09") || lowerText.includes("animal")))) {
    scores["animal-protection"] += 30; // Increased from 25
    console.log("Found Texas Penal Code animal cruelty statute - adding 30 points to animal-protection");
  }
  
  // Business-specific animal care indicators - VERY HIGH PRIORITY
  if (lowerText.includes("dogtopia")) {
    scores["animal-protection"] += 25; // Increased from 20
    console.log("Found 'Dogtopia' - adding 25 points to animal-protection");
  }
  
  // Heat exposure + animal combination - HIGH PRIORITY
  if (lowerText.includes("heat exposure") && lowerText.includes("animal")) {
    scores["animal-protection"] += 20; // Increased from 15
    console.log("Found 'heat exposure' + 'animal' - adding 20 points to animal-protection");
  }
  
  // Strong animal protection indicators - HIGH PRIORITY
  if ((lowerText.includes("animal") && (lowerText.includes("cruelty") || lowerText.includes("abuse") || lowerText.includes("neglect"))) ||
      (lowerText.includes("pet") && (lowerText.includes("boarding") || lowerText.includes("care") || lowerText.includes("death"))) ||
      lowerText.includes("animal care") ||
      (lowerText.includes("heat exposure") && lowerText.includes("dog"))) {
    scores["animal-protection"] += 18; // Increased from 15
    console.log("Found strong animal protection indicators - adding 18 points to animal-protection");
  }
  
  // Consumer Protection - DTPA specific
  if (lowerText.includes("dtpa") || 
      lowerText.includes("deceptive trade") || 
      lowerText.includes("section 17.4") ||
      lowerText.includes("§ 17.46")) {
    scores["consumer-protection"] += 12;
    scores["deceptive-trade"] += 10;
    console.log("Found DTPA references - adding points to consumer-protection");
  }
  
  // Bailment/property cases
  if (lowerText.includes("bailment") || 
     (lowerText.includes("property") && lowerText.includes("stolen")) ||
     (lowerText.includes("vehicle") && lowerText.includes("theft"))) {
    scores["bailment"] += 10;
  }
  
  // General animal protection terms (increased weight)
  const animalTerms = ["animal", "pet", "dog", "cat", "boarding", "veterinary"];
  const animalCount = countMatches(lowerText, animalTerms);
  if (animalCount > 0) {
    scores["animal-protection"] += animalCount * 4; // Increased multiplier from 3
    console.log(`Found ${animalCount} general animal terms - adding ${animalCount * 4} to animal-protection`);
  }
  
  // Personal injury terms - but HEAVILY penalized if animal terms present
  const personalInjuryTerms = ["injury", "accident", "negligence", "hurt", "damage", "pain", "medical", "wrongful death"];
  const personalInjuryScore = countMatches(lowerText, personalInjuryTerms);
  if (personalInjuryScore > 0) {
    // Only add personal injury score if animal protection score is very low
    if (scores["animal-protection"] < 5) {
      scores["personal-injury"] += personalInjuryScore * 2; // Reduced weight from 3
      console.log(`Found personal injury terms but animal-protection score is ${scores["animal-protection"]} - adding ${personalInjuryScore * 2} to personal-injury`);
    } else {
      console.log(`Found personal injury terms but animal-protection score is ${scores["animal-protection"]} - NOT adding to personal-injury`);
    }
  }
  
  // Consumer protection terms
  const consumerTerms = ["consumer", "warranty", "false advertising", "misleading", "protection", "service", "representation", "misrepresentation"];
  const consumerCount = countMatches(lowerText, consumerTerms);
  if (consumerCount > 0) {
    scores["consumer-protection"] += consumerCount;
  }
  
  // Real estate terms
  const realEstateTerms = ["real estate", "property", "land", "title", "deed", "lease", "landlord", "tenant", "eviction", "foreclosure"];
  const realEstateCount = countMatches(lowerText, realEstateTerms);
  if (realEstateCount > 0) {
    scores["real-estate"] += realEstateCount;
  }
  
  // Contract terms
  const contractTerms = ["contract", "agreement", "breach", "terms", "consideration", "void", "enforceable", "specific performance"];
  const contractCount = countMatches(lowerText, contractTerms);
  if (contractCount > 0) {
    scores["contract"] += contractCount;
  }
  
  // Family law terms
  const familyTerms = ["divorce", "custody", "child support", "alimony", "spousal support", "visitation", "conservatorship", "adoption", "family"];
  const familyCount = countMatches(lowerText, familyTerms);
  if (familyCount > 0) {
    scores["family"] += familyCount;
  }
  
  // Criminal law terms
  const criminalTerms = ["criminal", "misdemeanor", "felony", "arrest", "charge", "defendant", "guilty", "innocent", "plea", "bail"];
  const criminalCount = countMatches(lowerText, criminalTerms);
  if (criminalCount > 0) {
    scores["criminal"] += criminalCount;
  }
  
  // Product liability terms
  const productTerms = ["product", "defect", "dangerous", "manufacturer", "failure", "recall", "warning", "design"];
  const productCount = countMatches(lowerText, productTerms);
  if (productCount > 0) {
    scores["product-liability"] += productCount;
  }
  
  // Find the highest scoring case type
  let highestScore = 0;
  let detectedType = "general";
  
  for (const [caseType, score] of Object.entries(scores)) {
    console.log(`Case type ${caseType}: score ${score}`);
    if (score > highestScore) {
      highestScore = score;
      detectedType = caseType;
    }
  }
  
  // Lower the threshold to detect specific case types more easily
  if (highestScore >= 2) { // Keep threshold low
    console.log(`Detected case type: ${detectedType} with score: ${highestScore}`);
    return detectedType;
  }
  
  console.log(`No specific case type detected (highest score: ${highestScore}), defaulting to general`);
  return "general";
}

// Helper function to count matches of terms in text
function countMatches(text: string, terms: string[]): number {
  let count = 0;
  for (const term of terms) {
    if (text.includes(term)) {
      count++;
    }
  }
  return count;
}
