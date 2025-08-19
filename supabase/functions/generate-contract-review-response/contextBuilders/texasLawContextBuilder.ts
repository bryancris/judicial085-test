
// Updated context builder for Texas law with vector similarity search
import { supabase } from "../supabaseClient.ts";
import { generateEmbedding } from "../../process-pdf-document/openaiService.ts";

// Define severity levels for contract issues
export const SEVERITY_LEVELS = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW"
};

// Map of contract issues to severity levels
export const ISSUE_SEVERITY_MAP = {
  "choice-of-law": SEVERITY_LEVELS.CRITICAL,
  "non-texas-law": SEVERITY_LEVELS.CRITICAL,
  "security-interest": SEVERITY_LEVELS.HIGH,
  "liquidated-damages": SEVERITY_LEVELS.HIGH,
  "waiver-of-rights": SEVERITY_LEVELS.CRITICAL,
  "limitation-of-liability": SEVERITY_LEVELS.CRITICAL,
  "arbitration": SEVERITY_LEVELS.MEDIUM,
  "venue": SEVERITY_LEVELS.MEDIUM,
  "indemnification": SEVERITY_LEVELS.MEDIUM,
  "confidentiality": SEVERITY_LEVELS.LOW
};

// Contract section types to look for
const CONTRACT_SECTION_TYPES = [
  "choice-of-law", 
  "security-interest", 
  "liquidated-damages", 
  "waiver-of-rights", 
  "limitation-of-liability",
  "arbitration",
  "venue",
  "indemnification",
  "confidentiality"
];

/**
 * Extract contract sections of specific types
 * @param contractText The full contract text
 * @returns Object with section texts by type
 */
async function extractContractSections(contractText: string): Promise<Record<string, string>> {
  const sections: Record<string, string> = {};
  
  // Section patterns to identify
  const sectionPatterns = {
    "choice-of-law": /(?:governing\s+law|choice\s+of\s+law|applicable\s+law|law\s+govern)(?:.{1,500}?)((?:laws\s+of|governed\s+by).{1,100}?(?:Delaware|New\s+York|California|Florida|Texas))/is,
    "security-interest": /(?:security\s+interest|collateral|pledge|lien)(?:.{1,500}?)(?:all\s+assets|all\s+property|all\s+inventory|all\s+equipment|all\s+accounts)/is,
    "liquidated-damages": /(?:liquidated\s+damages|penalty|damages\s+clause)(?:.{1,500}?)(?:\d+%|percent|times the|multiply|double|triple)/is,
    "waiver-of-rights": /(?:waiver\s+of|waive|right\s+to)(?:.{1,500}?)(?:jury\s+trial|class\s+action|dtpa|deceptive\s+trade|right\s+to\s+sue|consumer\s+rights)/is,
    "limitation-of-liability": /(?:limit\s+of\s+liability|limitation\s+of\s+liability|no\s+liability|not\s+be\s+liable)(?:.{1,500}?)(?:negligence|gross\s+negligence|intentional|misconduct|consequential\s+damages)/is,
    "arbitration": /(?:arbitrat|dispute\s+resolution|resolve\s+disputes)(?:.{1,500}?)(?:aaa|jams|binding|final|arbitrator|arbitration\s+association)/is,
    "venue": /(?:venue|forum|jurisdiction|court)(?:.{1,500}?)(?:county|district|federal|state|court\s+of)/is,
    "indemnification": /(?:indemnif|hold\s+harmless|defend)(?:.{1,500}?)(?:claims|losses|damages|attorneys[']?\s+fees|costs|expenses)/is,
    "confidentiality": /(?:confidential|non[-\s]?disclosure|confide|secret)(?:.{1,500}?)(?:information|data|material|trade\s+secret|proprietary)/is
  };
  
  // Extract sections
  for (const [sectionType, pattern] of Object.entries(sectionPatterns)) {
    const match = contractText.match(pattern);
    if (match && match[1]) {
      sections[sectionType] = match[0].slice(0, 1000); // Limit to 1000 chars per section
    } else if (match) {
      sections[sectionType] = match[0].slice(0, 1000);
    }
  }
  
  return sections;
}

/**
 * Get relevant Texas laws for a contract section using vector similarity search
 * @param sectionType The type of contract section
 * @param sectionText The text content of the section
 * @returns Relevant laws with confidence scores for potential violations
 */
async function getRelevantTexasLaws(sectionType: string, sectionText: string): Promise<string> {
  try {
    // Generate search query based on section type and content for semantic matching
    let searchQuery = "";
    
    switch (sectionType) {
      case "choice-of-law":
        searchQuery = `Texas choice of law provision jurisdiction conflicts foreign law governing law clause ${sectionText.slice(0, 200)}`;
        break;
      case "security-interest":
        searchQuery = `Texas security interest UCC collateral description requirements all assets property ${sectionText.slice(0, 200)}`;
        break;
      case "liquidated-damages":
        searchQuery = `Texas liquidated damages penalty reasonable estimate actual damages compensation ${sectionText.slice(0, 200)}`;
        break;
      case "waiver-of-rights":
        searchQuery = `Texas DTPA waiver consumer rights protection statutes jury trial class action ${sectionText.slice(0, 200)}`;
        break;
      case "limitation-of-liability":
        searchQuery = `Texas limitation of liability gross negligence intentional conduct misconduct ${sectionText.slice(0, 200)}`;
        break;
      case "arbitration":
        searchQuery = `Texas arbitration agreement enforceability requirements binding dispute resolution ${sectionText.slice(0, 200)}`;
        break;
      case "venue":
        searchQuery = `Texas venue provision forum selection clause enforceability jurisdiction court ${sectionText.slice(0, 200)}`;
        break;
      case "indemnification":
        searchQuery = `Texas indemnification clause fair notice conspicuousness express negligence doctrine ${sectionText.slice(0, 200)}`;
        break;
      case "confidentiality":
        searchQuery = `Texas confidentiality agreement trade secret protection non-disclosure ${sectionText.slice(0, 200)}`;
        break;
      default:
        searchQuery = `Texas contract law ${sectionType} ${sectionText.slice(0, 200)}`;
    }
    
    console.log(`Generating embedding for: ${searchQuery.slice(0, 100)}... (section: ${sectionType})`);
    
    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error("OpenAI API key not found");
      return getDefaultTexasLaws(sectionType);
    }
    
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(searchQuery, openaiApiKey);
    
    console.log(`Searching vector DB with embedding for section: ${sectionType}`);
    
    // Search the vector database for relevant laws using semantic similarity
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7, // Lower threshold for more comprehensive results
      match_count: 5,       // Get more results for better analysis
      filter: {} // Could filter by metadata if needed
    });
    
    if (error) {
      console.error("Error searching documents with vector similarity:", error);
      return getDefaultTexasLaws(sectionType);
    }
    
    if (!documents || documents.length === 0) {
      console.log(`No vector matches found for ${sectionType}, using default laws`);
      return getDefaultTexasLaws(sectionType);
    }
    
    console.log(`Found ${documents.length} vector matches for ${sectionType}`);
    
    // Format the results with confidence scores for potential violations
    let relevantLaws = `## Texas Law References for ${formatSectionType(sectionType)}\n\n`;
    
    documents.forEach((doc: any, index: number) => {
      const content = doc.content || "";
      const similarity = doc.similarity || 0;
      const citation = extractLawReference(content, sectionType);
      
      // Determine violation confidence based on similarity and content analysis
      const violationConfidence = determineViolationConfidence(sectionText, content, similarity, sectionType);
      
      relevantLaws += `### ${citation || "Texas Contract Law"} (Match: ${(similarity * 100).toFixed(1)}%)\n`;
      
      if (violationConfidence.isViolation) {
        relevantLaws += `🚨 **POTENTIAL VIOLATION** (Confidence: ${violationConfidence.confidence}%)\n`;
        relevantLaws += `**Issue**: ${violationConfidence.reason}\n\n`;
      }
      
      // Extract relevant snippet
      const relevantSnippet = extractRelevantSnippet(content, sectionType, searchQuery);
      relevantLaws += `${relevantSnippet}\n\n`;
    });
    
    return relevantLaws;
  } catch (error) {
    console.error("Error getting relevant Texas laws with vector search:", error);
    return getDefaultTexasLaws(sectionType);
  }
}

/**
 * Determine if there's a potential statute violation and confidence level
 */
function determineViolationConfidence(
  contractText: string, 
  statuteText: string, 
  similarity: number, 
  sectionType: string
): { isViolation: boolean; confidence: number; reason: string } {
  const lowerContractText = contractText.toLowerCase();
  const lowerStatuteText = statuteText.toLowerCase();
  
  let confidence = 0;
  let reasons: string[] = [];
  
  // High similarity indicates relevant statute
  if (similarity > 0.8) {
    confidence += 30;
  } else if (similarity > 0.7) {
    confidence += 20;
  }
  
  // Section-specific violation patterns
  switch (sectionType) {
    case "choice-of-law":
      if (lowerContractText.includes("delaware") || lowerContractText.includes("new york") || 
          lowerContractText.includes("california")) {
        confidence += 40;
        reasons.push("Non-Texas governing law clause may violate Texas public policy");
      }
      break;
      
    case "security-interest":
      if (lowerContractText.includes("all assets") || lowerContractText.includes("all property")) {
        confidence += 50;
        reasons.push("Overly broad collateral description violates UCC requirements");
      }
      break;
      
    case "liquidated-damages":
      if (lowerContractText.match(/\d+%|percent|times|double|triple/)) {
        confidence += 45;
        reasons.push("Liquidated damages may constitute unenforceable penalty");
      }
      break;
      
    case "waiver-of-rights":
      if (lowerContractText.includes("dtpa") || lowerContractText.includes("deceptive trade") ||
          lowerContractText.includes("consumer rights")) {
        confidence += 60;
        reasons.push("DTPA waiver likely unenforceable under Texas law");
      }
      break;
      
    case "limitation-of-liability":
      if (lowerContractText.includes("gross negligence") || lowerContractText.includes("intentional")) {
        confidence += 55;
        reasons.push("Limitation of liability for gross negligence violates public policy");
      }
      break;
  }
  
  // Check for statute-specific violations in the matched law
  if (lowerStatuteText.includes("void") || lowerStatuteText.includes("unenforceable") ||
      lowerStatuteText.includes("against public policy")) {
    confidence += 25;
    reasons.push("Statute indicates provision may be void or unenforceable");
  }
  
  return {
    isViolation: confidence >= 40, // Threshold for flagging potential violations
    confidence: Math.min(confidence, 95), // Cap at 95%
    reason: reasons.join("; ") || "Potential conflict with Texas statute requirements"
  };
}

/**
 * Extract a relevant snippet from document content
 */
function extractRelevantSnippet(content: string, sectionType: string, keywords: string): string {
  if (!content) return "No content available.";
  
  // Split into sentences
  const sentences = content.replace(/([.?!])\s+/g, "$1|").split("|");
  
  // Find most relevant sentences based on keywords
  const keywordArr = keywords.toLowerCase().split(/\s+/);
  const sectionTypeWords = sectionType.replace(/-/g, ' ').toLowerCase().split(/\s+/);
  
  // Score each sentence based on keyword matches
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase();
    
    let score = 0;
    // Score for section type words
    sectionTypeWords.forEach(word => {
      if (lowerSentence.includes(word)) score += 2;
    });
    
    // Score for keywords
    keywordArr.forEach(word => {
      if (word.length > 3 && lowerSentence.includes(word)) score += 1;
    });
    
    return { sentence, score };
  });
  
  // Sort by score and take top sentences
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.sentence)
    // Put back in original order
    .sort((a, b) => {
      return sentences.indexOf(a) - sentences.indexOf(b);
    });
  
  return topSentences.join(' ');
}

/**
 * Extract a law reference from content
 * @param content The content to search for references
 * @param sectionType The type of section
 * @returns A formatted law reference if found
 */
function extractLawReference(content: string, sectionType: string): string | null {
  if (!content) return null;
  
  // Look for patterns like "Section 123.45" or "§ 123.45"
  const sectionMatch = content.match(/Section\s+(\d+\.\d+)|§\s*(\d+\.\d+)/i);
  if (sectionMatch) {
    const section = sectionMatch[1] || sectionMatch[2];
    
    // Map section type to likely code
    const codeMap: Record<string, string> = {
      "choice-of-law": "Texas Business & Commerce Code",
      "security-interest": "Texas Business & Commerce Code",
      "liquidated-damages": "Texas Civil Practice & Remedies Code",
      "waiver-of-rights": "Texas Business & Commerce Code",
      "limitation-of-liability": "Texas Civil Practice & Remedies Code",
      "arbitration": "Texas Civil Practice & Remedies Code",
      "venue": "Texas Civil Practice & Remedies Code",
      "indemnification": "Texas Business & Commerce Code",
      "confidentiality": "Texas Business & Commerce Code"
    };
    
    const code = codeMap[sectionType] || "Texas Code";
    return `${code} § ${section}`;
  }
  
  // Look for DTPA references
  if (content.toLowerCase().includes("deceptive trade practices act") || 
      content.toLowerCase().includes("dtpa")) {
    const dtpaMatch = content.match(/(?:Section|§)\s*(\d+\.\d+)/i);
    if (dtpaMatch && dtpaMatch[1]) {
      return `Texas Deceptive Trade Practices Act § ${dtpaMatch[1]}`;
    }
    return "Texas Deceptive Trade Practices Act";
  }
  
  return null;
}

/**
 * Format section type for display
 */
function formatSectionType(sectionType: string): string {
  return sectionType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get default Texas laws when database search fails
 * @param sectionType The type of contract section
 * @returns Default law text for the section type
 */
function getDefaultTexasLaws(sectionType: string): string {
  const defaultLaws: Record<string, string> = {
    "choice-of-law": 
      "## Texas Law References for Choice of Law\n\n" +
      "### Texas Business & Commerce Code § 1.301\n" +
      "Texas courts generally reject choice of law provisions that attempt to avoid fundamental Texas policy. " +
      "While parties may choose the law of another jurisdiction, Texas courts will not enforce such provisions " +
      "when they contradict Texas public policy, especially when the contract has significant connections to Texas.",
      
    "security-interest":
      "## Texas Law References for Security Interest\n\n" +
      "### Texas Business & Commerce Code § 9.108\n" +
      "Security interests must specifically describe collateral. A description of collateral as 'all assets' " +
      "or 'all personal property' is insufficient. The UCC requires reasonable identification of the collateral " +
      "for a security interest to be enforceable under Texas law.",
      
    "liquidated-damages":
      "## Texas Law References for Liquidated Damages\n\n" +
      "### Texas Civil Practice & Remedies Code § 41.008\n" +
      "Liquidated damages that operate as a penalty are unenforceable under Texas law. For a liquidated damages " +
      "provision to be enforceable, the harm caused by the breach must be difficult to estimate, and the amount " +
      "of liquidated damages must be a reasonable forecast of just compensation.",
      
    "waiver-of-rights":
      "## Texas Law References for Waiver of Rights\n\n" +
      "### Texas Business & Commerce Code § 17.42\n" +
      "Waivers of Texas Deceptive Trade Practices Act protections are generally void. The DTPA explicitly " +
      "states that consumer rights under the act cannot be waived except in specific circumstances with precise " +
      "statutory language and independent representation.",
      
    "limitation-of-liability":
      "## Texas Law References for Limitation of Liability\n\n" +
      "### Texas Civil Practice & Remedies Code § 41.003\n" +
      "Limitations on liability for gross negligence or intentional misconduct are void as against public policy. " +
      "While parties may limit liability for ordinary negligence, Texas courts will not enforce provisions that " +
      "attempt to limit liability for more serious forms of misconduct.",
      
    "arbitration":
      "## Texas Law References for Arbitration\n\n" +
      "### Texas Civil Practice & Remedies Code § 171.001\n" +
      "Arbitration agreements are generally enforceable in Texas, but must meet specific requirements. The agreement " +
      "must be in writing, signed by both parties, and clearly express an intent to arbitrate disputes. Courts may " +
      "invalidate arbitration provisions that are unconscionable or illusory.",
      
    "venue":
      "## Texas Law References for Venue\n\n" +
      "### Texas Civil Practice & Remedies Code § 15.020\n" +
      "Venue provisions are generally enforceable if the contract involves $1 million or more. For smaller contracts, " +
      "Texas courts may disregard venue provisions that are unfair or inconvenient, particularly for consumers.",
      
    "indemnification":
      "## Texas Law References for Indemnification\n\n" +
      "### Texas Business & Commerce Code § 2.719\n" +
      "Indemnification clauses must satisfy the express negligence doctrine and fair notice requirements. A party " +
      "seeking to be indemnified for its own negligence must expressly state this in clear and unambiguous terms that " +
      "are prominently displayed in the agreement.",
      
    "confidentiality":
      "## Texas Law References for Confidentiality\n\n" +
      "### Texas Civil Practice & Remedies Code § 134A.002\n" +
      "Texas law protects trade secrets and confidential information when reasonable measures are taken to maintain " +
      "secrecy. Confidentiality agreements are enforceable when they have reasonable scope, duration, and geographic " +
      "limitations, and protect legitimate business interests."
  };
  
  return defaultLaws[sectionType] || 
    `## Texas Law References\n\nTexas contract law requires fair and reasonable terms that do not violate public policy.`;
}

/**
 * Build Texas law context for contract review
 * @param contractText The contract text to analyze
 * @returns Context text with relevant Texas law information
 */
export async function buildTexasLawContext(contractText: string): Promise<string> {
  try {
    console.log("Building Texas law context for contract review");
    let contextText = "\n\n## RELEVANT TEXAS LAW CONTEXT FOR CONTRACT REVIEW\n\n";
    
    // Extract contract sections by type
    const contractSections = await extractContractSections(contractText);
    console.log(`Extracted ${Object.keys(contractSections).length} contract sections for analysis`);
    
    // For each section type, get relevant Texas laws
    const sectionTypes = Object.keys(contractSections);
    if (sectionTypes.length === 0) {
      // If no specific sections found, use default context
      contextText += "No specific contract sections were identified for detailed analysis. ";
      contextText += "Applying general Texas contract law principles.\n\n";
      
      // Add default Texas law references
      CONTRACT_SECTION_TYPES.forEach(sectionType => {
        contextText += getDefaultTexasLaws(sectionType) + "\n\n";
      });
    } else {
      // Add detected sections with relevant laws
      for (const sectionType of sectionTypes) {
        const sectionText = contractSections[sectionType];
        const severity = ISSUE_SEVERITY_MAP[sectionType as keyof typeof ISSUE_SEVERITY_MAP] || SEVERITY_LEVELS.MEDIUM;
        
        contextText += `### DETECTED ${severity} ISSUE: ${formatSectionType(sectionType)}\n\n`;
        contextText += `CONTRACT TEXT: "${sectionText}"\n\n`;
        
        // Get relevant Texas laws for this section
        const relevantLaws = await getRelevantTexasLaws(sectionType, sectionText);
        contextText += relevantLaws + "\n\n";
      }
      
      // Add guidance on any missing important sections
      const missingSectionTypes = CONTRACT_SECTION_TYPES.filter(type => !sectionTypes.includes(type));
      if (missingSectionTypes.length > 0) {
        contextText += "### Additional Contract Elements to Review\n\n";
        contextText += "The following important contract elements were not clearly detected in the provided text, ";
        contextText += "but should still be reviewed according to Texas law:\n\n";
        
        for (const missingSectionType of missingSectionTypes.slice(0, 3)) { // Limit to 3 missing sections
          contextText += `- ${formatSectionType(missingSectionType)}: `;
          contextText += getDefaultTexasLaws(missingSectionType).split("\n\n")[1] || "";
          contextText += "\n";
        }
        
        contextText += "\n";
      }
    }
    
    return contextText;
  } catch (error) {
    console.error("Error building Texas law context:", error);
    return "\n\n## TEXAS LAW CONTEXT\n\nError retrieving Texas law context. Applying general contract principles.\n\n";
  }
}
