import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function identifyCaseType(clientId: string): Promise<string> {
  try {
    console.log(`=== CASE TYPE DETECTION START for client ${clientId} ===`);
    
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
      const analysisContent = analyses[0].content || "";
      console.log(`=== ANALYSIS CONTENT PREVIEW ===`);
      console.log(`Content length: ${analysisContent.length}`);
      console.log(`First 500 chars: ${analysisContent.substring(0, 500)}`);
      console.log(`=== END CONTENT PREVIEW ===`);
      
      // Always re-detect from content to ensure accuracy
      const detectedTypeFromContent = detectCaseTypeFromText(analysisContent);
      console.log(`Detected type from analysis content: ${detectedTypeFromContent}`);
      console.log(`Stored case type: ${analyses[0].case_type}`);
      
      if (detectedTypeFromContent !== "general") {
        console.log(`=== FINAL RESULT: Using detected type: ${detectedTypeFromContent} ===`);
        return detectedTypeFromContent;
      }
      
      if (analyses[0].case_type) {
        console.log(`=== FINAL RESULT: Using stored type: ${analyses[0].case_type} ===`);
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
    console.log(`=== MESSAGES CONTENT PREVIEW ===`);
    console.log(`Combined content length: ${combinedContent.length}`);
    console.log(`First 300 chars: ${combinedContent.substring(0, 300)}`);
    
    // Detect case type from combined message content
    const messageBasedCaseType = detectCaseTypeFromText(combinedContent);
    console.log(`=== FINAL RESULT: Detected from messages: ${messageBasedCaseType} ===`);
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
  console.log(`=== CASE TYPE DETECTION ANALYSIS ===`);
  console.log(`Text length: ${text.length}`);
  console.log(`Sample text: ${lowerText.substring(0, 300)}...`);
  
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
  
  // HIGHEST PRIORITY: Specific statute references (should strongly indicate animal protection)
  if (lowerText.includes("§ 42.092") || lowerText.includes("42.092")) {
    scores["animal-protection"] += 50;
    console.log("🎯 FOUND: Texas Penal Code 42.092 - Adding 50 points to animal-protection");
  }
  if (lowerText.includes("42.091") || lowerText.includes("§ 42.091")) {
    scores["animal-protection"] += 45;
    console.log("🎯 FOUND: Texas Penal Code 42.091 - Adding 45 points to animal-protection");
  }
  
  // VERY HIGH PRIORITY: Business name that's animal-related
  if (lowerText.includes("dogtopia")) {
    scores["animal-protection"] += 40;
    console.log("🎯 FOUND: Dogtopia business name - Adding 40 points to animal-protection");
  }
  
  // HIGH PRIORITY: Direct animal cruelty terms
  if (lowerText.includes("animal cruelty")) {
    scores["animal-protection"] += 35;
    console.log("🎯 FOUND: 'animal cruelty' - Adding 35 points to animal-protection");
  }
  if (lowerText.includes("animal abuse")) {
    scores["animal-protection"] += 35;
    console.log("🎯 FOUND: 'animal abuse' - Adding 35 points to animal-protection");
  }
  if (lowerText.includes("animal neglect")) {
    scores["animal-protection"] += 35;
    console.log("🎯 FOUND: 'animal neglect' - Adding 35 points to animal-protection");
  }
  
  // MEDIUM-HIGH PRIORITY: Pet care business context
  if (lowerText.includes("pet boarding") || lowerText.includes("pet daycare")) {
    scores["animal-protection"] += 30;
    console.log("🎯 FOUND: Pet boarding/daycare - Adding 30 points to animal-protection");
  }
  if (lowerText.includes("heat exposure") && lowerText.includes("animal")) {
    scores["animal-protection"] += 25;
    console.log("🎯 FOUND: Heat exposure + animal - Adding 25 points to animal-protection");
  }
  
  // Consumer Protection/DTPA terms
  if (lowerText.includes("dtpa") || lowerText.includes("deceptive trade")) {
    scores["consumer-protection"] += 15;
    scores["deceptive-trade"] += 12;
    console.log("📋 FOUND: DTPA/deceptive trade - Adding points to consumer protection");
  }
  
  // General animal terms (only add if no specific terms found yet)
  const animalTerms = ["animal", "pet", "dog", "cat", "boarding", "veterinary"];
  const animalCount = countMatches(lowerText, animalTerms);
  if (animalCount > 0) {
    const animalPoints = animalCount * 8;
    scores["animal-protection"] += animalPoints;
    console.log(`🐾 FOUND: ${animalCount} general animal terms - Adding ${animalPoints} to animal-protection`);
  }
  
  // Personal injury terms - but heavily penalized if animal terms present
  const personalInjuryTerms = ["injury", "accident", "negligence", "hurt", "damage", "pain", "medical"];
  const personalInjuryCount = countMatches(lowerText, personalInjuryTerms);
  if (personalInjuryCount > 0 && scores["animal-protection"] < 10) {
    const injuryPoints = personalInjuryCount * 2;
    scores["personal-injury"] += injuryPoints;
    console.log(`⚖️ FOUND: ${personalInjuryCount} personal injury terms (animal score low) - Adding ${injuryPoints} to personal-injury`);
  } else if (personalInjuryCount > 0) {
    console.log(`⚖️ FOUND: ${personalInjuryCount} personal injury terms but animal-protection score is ${scores["animal-protection"]} - NOT adding to personal-injury`);
  }
  
  // Log all scores for debugging
  console.log("=== SCORING BREAKDOWN ===");
  for (const [caseType, score] of Object.entries(scores)) {
    if (score > 0) {
      console.log(`${caseType}: ${score} points`);
    }
  }
  
  // Find the highest scoring case type
  let highestScore = 0;
  let detectedType = "general";
  
  for (const [caseType, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      detectedType = caseType;
    }
  }
  
  console.log(`=== DETECTION RESULT ===`);
  console.log(`Highest score: ${highestScore}`);
  console.log(`Detected type: ${detectedType}`);
  
  // Lower threshold for better detection
  if (highestScore >= 5) {
    console.log(`✅ CONFIDENT DETECTION: ${detectedType} (score: ${highestScore})`);
    return detectedType;
  }
  
  console.log(`❌ NO CONFIDENT DETECTION: Defaulting to general (highest score: ${highestScore})`);
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
