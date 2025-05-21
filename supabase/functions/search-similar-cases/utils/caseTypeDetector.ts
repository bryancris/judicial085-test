
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
  
  // Define pattern matching scores for different case types
  let scores: Record<string, number> = {
    "hoa": 0,
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
  
  // Check for highly specific terms first
  
  // HOA/Property terms
  if (lowerText.includes("hoa") || 
      lowerText.includes("homeowner") ||
      lowerText.includes("property code § 209") ||
      lowerText.includes("209.006") || 
      lowerText.includes("209.007") ||
      lowerText.includes("board meeting")) {
    scores["hoa"] += 10;
  }
  
  // Dog/animal related cases
  if ((lowerText.includes("dog") || lowerText.includes("pet") || lowerText.includes("animal")) && 
      (lowerText.includes("injury") || lowerText.includes("bite") || lowerText.includes("attack"))) {
    scores["negligence"] += 8;
    scores["personal-injury"] += 5;
  }
  
  // Bailment/property cases
  if (lowerText.includes("bailment") || 
     (lowerText.includes("property") && lowerText.includes("stolen")) ||
     (lowerText.includes("vehicle") && lowerText.includes("theft"))) {
    scores["bailment"] += 10;
  }
  
  // DTPA specific references
  if (lowerText.includes("dtpa") || 
      lowerText.includes("deceptive trade") || 
      lowerText.includes("section 17.4")) {
    scores["deceptive-trade"] += 10;
    scores["consumer-protection"] += 8;
  }
  
  // Now score based on more general patterns
  
  // HOA/Property terms
  if (countMatches(lowerText, ["association", "covenant", "restriction", "deed", "board", "bylaw", "fine", "common area", "property code"])) {
    scores["hoa"] += countMatches(lowerText, ["association", "covenant", "restriction", "deed", "board", "bylaw", "fine", "common area", "property code"]);
  }
  
  // Consumer protection terms
  if (countMatches(lowerText, ["consumer", "warranty", "false advertising", "misleading", "protection", "dtpa", "product", "service", "representation"])) {
    scores["consumer-protection"] += countMatches(lowerText, ["consumer", "warranty", "false advertising", "misleading", "protection", "dtpa", "product", "service", "representation"]);
  }
  
  // Personal injury terms
  if (countMatches(lowerText, ["injury", "accident", "negligence", "hurt", "damage", "slip and fall", "pain", "medical", "wrongful death"])) {
    scores["personal-injury"] += countMatches(lowerText, ["injury", "accident", "negligence", "hurt", "damage", "slip and fall", "pain", "medical", "wrongful death"]);
  }
  
  // Real estate terms
  if (countMatches(lowerText, ["real estate", "property", "land", "title", "deed", "lease", "landlord", "tenant", "eviction", "foreclosure"])) {
    scores["real-estate"] += countMatches(lowerText, ["real estate", "property", "land", "title", "deed", "lease", "landlord", "tenant", "eviction", "foreclosure"]);
  }
  
  // Contract terms
  if (countMatches(lowerText, ["contract", "agreement", "breach", "terms", "consideration", "void", "enforceable", "specific performance"])) {
    scores["contract"] += countMatches(lowerText, ["contract", "agreement", "breach", "terms", "consideration", "void", "enforceable", "specific performance"]);
  }
  
  // Family law terms
  if (countMatches(lowerText, ["divorce", "custody", "child support", "alimony", "spousal support", "visitation", "conservatorship", "adoption", "family"])) {
    scores["family"] += countMatches(lowerText, ["divorce", "custody", "child support", "alimony", "spousal support", "visitation", "conservatorship", "adoption", "family"]);
  }
  
  // Criminal law terms
  if (countMatches(lowerText, ["criminal", "misdemeanor", "felony", "arrest", "charge", "defendant", "guilty", "innocent", "plea", "bail"])) {
    scores["criminal"] += countMatches(lowerText, ["criminal", "misdemeanor", "felony", "arrest", "charge", "defendant", "guilty", "innocent", "plea", "bail"]);
  }
  
  // Product liability terms
  if (countMatches(lowerText, ["product", "defect", "dangerous", "manufacturer", "failure", "recall", "warning", "design"])) {
    scores["product-liability"] += countMatches(lowerText, ["product", "defect", "dangerous", "manufacturer", "failure", "recall", "warning", "design"]);
  }
  
  // Check for specific phrases that strongly indicate case types
  if (lowerText.includes("slip and fall") || lowerText.includes("premises liability")) {
    scores["personal-injury"] += 8;
  }
  
  if (lowerText.includes("car accident") || lowerText.includes("motor vehicle")) {
    scores["personal-injury"] += 8;
  }
  
  if (lowerText.includes("medical malpractice") || lowerText.includes("hospital")) {
    scores["personal-injury"] += 8;
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
  
  // Only return a specific case type if the score is significant
  if (highestScore >= 3) {
    return detectedType;
  }
  
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
