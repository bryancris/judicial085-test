
/**
 * Texas Law Context Builder
 * Provides specific Texas law context for contract review
 */

import { getRelevantTexasLaws } from "../texasLawUtils.ts";

// Critical contract sections to analyze under Texas law
const CRITICAL_CONTRACT_SECTIONS = [
  { name: "choice-of-law", keywords: ["choice of law", "govern", "jurisdiction", "delaware", "governing law"] },
  { name: "security-interest", keywords: ["security interest", "collateral", "secure", "secured", "security"] },
  { name: "liquidated-damages", keywords: ["liquidated damage", "penalty", "forfeiture", "150%", "liquidate"] },
  { name: "waiver", keywords: ["waiver", "waive", "disclaim", "disclaimer"] },
  { name: "limitation-of-liability", keywords: ["limitation of liability", "limit liability", "cap on damages"] }
];

// Severity levels for contract issues
export const SEVERITY_LEVELS = {
  CRITICAL: "CRITICAL", // Provisions likely void or illegal under Texas law
  HIGH: "HIGH",         // Provisions likely unenforceable or difficult to enforce
  MEDIUM: "MEDIUM",     // Provisions that may be problematic or require modification
  LOW: "LOW"            // Minor concerns that should be addressed but not deal-breakers
};

// Map of common contract issues to their severity and relevant Texas law
export const ISSUE_SEVERITY_MAP = {
  "non-texas-choice-of-law": {
    severity: SEVERITY_LEVELS.CRITICAL,
    lawReference: "Texas Business & Commerce Code § 1.301; Texas courts generally reject choice of law provisions that violate fundamental Texas policy."
  },
  "overly-broad-security-interest": {
    severity: SEVERITY_LEVELS.HIGH,
    lawReference: "Texas Business & Commerce Code § 9.203; Security interests must be properly described and not overreaching."
  },
  "excessive-liquidated-damages": {
    severity: SEVERITY_LEVELS.HIGH,
    lawReference: "Texas Civil Practice & Remedies Code § 41.008; Excessive liquidated damages may be considered unenforceable penalties."
  },
  "waiver-of-consumer-rights": {
    severity: SEVERITY_LEVELS.CRITICAL,
    lawReference: "Texas Deceptive Trade Practices Act (DTPA), Texas Business & Commerce Code § 17.42; Consumer rights cannot be waived."
  }
};

// Known relevant Texas cases for common contract issues
export const RELEVANT_TEXAS_CASES = {
  "choice-of-law": [
    "In re AutoNation, Inc., 228 S.W.3d 663 (Tex. 2007) - Texas courts respect choice of law provisions except when they violate fundamental Texas policy.",
    "DeSantis v. Wackenhut Corp., 793 S.W.2d 670 (Tex. 1990) - Texas has a fundamental interest in regulating agreements within its borders."
  ],
  "liquidated-damages": [
    "FPL Energy v. TXU Portfolio Mgmt. Co., 426 S.W.3d 59 (Tex. 2014) - Liquidated damages must be reasonable forecast of harm, not a penalty.",
    "Phillips v. Phillips, 820 S.W.2d 785 (Tex. 1991) - Liquidated damages provisions that operate as penalties are unenforceable."
  ],
  "security-interest": [
    "Wal-Mart Stores, Inc. v. Gonzalez, 968 S.W.2d 934 (Tex. 1998) - Overly broad security interests may be unreasonable."
  ]
};

/**
 * Build Texas law context for contract analysis
 * @param contractText The contract text to analyze
 * @returns A context string with relevant Texas law
 */
export const buildTexasLawContext = async (contractText: string) => {
  try {
    let texasLawContext = "\n\n## TEXAS LAW CONTEXT\n";
    
    // Identify critical sections in the contract
    const identifiedSections = identifyCriticalSections(contractText);
    
    if (identifiedSections.length > 0) {
      texasLawContext += `\nPotentially problematic sections identified in this contract:\n`;
      
      for (const section of identifiedSections) {
        texasLawContext += `- ${section.name.toUpperCase()}: Found in contract\n`;
        
        // Get relevant Texas law for this section
        const relevantLaws = await getRelevantTexasLaws(section.name, section.matchedText);
        
        if (relevantLaws && relevantLaws.length > 0) {
          texasLawContext += `  RELEVANT TEXAS LAW: ${relevantLaws[0].reference}\n`;
          
          // Add relevant case if available
          if (RELEVANT_TEXAS_CASES[section.name]) {
            texasLawContext += `  RELEVANT TEXAS CASE: ${RELEVANT_TEXAS_CASES[section.name][0]}\n`;
          }
        }
      }
    }
    
    // Add general Texas contract law principles
    texasLawContext += `
\n### CRITICAL TEXAS CONTRACT LAW PRINCIPLES
1. CHOICE OF LAW: Texas has strong public policy favoring application of Texas law to contracts performed in Texas. Non-Texas choice of law provisions may be unenforceable if they violate Texas public policy.
2. SECURITY INTERESTS: Under Texas UCC Article 9, security interests must be reasonable and specifically describe collateral. Overly broad security interests covering "all assets" may be problematic.
3. LIQUIDATED DAMAGES: Texas courts will not enforce liquidated damages that operate as a penalty. Damages exceeding 100% of contract value are often viewed as punitive.
4. CONSUMER PROTECTION: The Texas Deceptive Trade Practices Act (DTPA) provides strong consumer protections that cannot be waived in most circumstances.
5. WARRANTY DISCLAIMERS: Must be conspicuous and meet UCC requirements under Texas Business & Commerce Code § 2.316.`;

    return texasLawContext;
  } catch (error) {
    console.error("Error building Texas law context:", error);
    return "\n\n## TEXAS LAW CONTEXT\nError retrieving Texas law context.";
  }
};

/**
 * Identify critical sections in contract text
 * @param contractText The contract text to analyze
 * @returns Array of identified sections with matched text
 */
const identifyCriticalSections = (contractText: string) => {
  const identifiedSections = [];
  const lowerCaseText = contractText.toLowerCase();
  
  for (const section of CRITICAL_CONTRACT_SECTIONS) {
    for (const keyword of section.keywords) {
      if (lowerCaseText.includes(keyword.toLowerCase())) {
        // Extract the sentence containing the keyword
        const sentences = extractSentencesWithKeyword(contractText, keyword);
        if (sentences.length > 0) {
          identifiedSections.push({
            name: section.name,
            matchedText: sentences[0]
          });
          break;
        }
      }
    }
  }
  
  return identifiedSections;
};

/**
 * Extract sentences containing a keyword
 * @param text The text to search
 * @param keyword The keyword to find
 * @returns Array of sentences containing the keyword
 */
const extractSentencesWithKeyword = (text: string, keyword: string) => {
  const sentences = text.split(/[.!?]\s+/);
  return sentences.filter(sentence => 
    sentence.toLowerCase().includes(keyword.toLowerCase())
  );
};
