
import { extractNamedEntities } from "./textUtils.ts";

// Generate search terms for CourtListener API based on legal analysis and case type
export function generateSearchTerms(
  relevantLaw: string, 
  legalIssues: string, 
  preliminaryAnalysis: string,
  caseType: string
): string {
  // Default search terms if sections are empty
  if (!relevantLaw && !legalIssues && !preliminaryAnalysis) {
    return "liability negligence damages";
  }
  
  // Extract potential statutes
  const statuteMatches = relevantLaw.match(/([A-Z][\w\s]+Code\s+§+\s*\d+[\w\.\-]*)/g) || [];
  
  // Check for HOA-related content specifically
  const isHoaCase = [relevantLaw, legalIssues, preliminaryAnalysis].some(text => {
    const lowerText = (text || "").toLowerCase();
    return lowerText.includes("hoa") || 
           lowerText.includes("homeowner") || 
           lowerText.includes("property code § 209") ||
           lowerText.includes("property code section 209");
  });
  
  // Extract key legal terms
  const legalTerms = new Set<string>();
  
  // Add case type specific terms
  if (caseType === "bailment") {
    legalTerms.add("bailment");
    legalTerms.add("bailee");
    legalTerms.add("property");
    legalTerms.add("vehicle theft");
    legalTerms.add("duty of care");
  } else if (caseType === "premises-liability") {
    legalTerms.add("slip and fall");
    legalTerms.add("premises liability");
    legalTerms.add("dangerous condition");
  } else if (caseType === "motor-vehicle-accident") {
    legalTerms.add("motor vehicle accident");
    legalTerms.add("collision");
    legalTerms.add("automobile negligence");
  } else if (caseType === "medical-malpractice") {
    legalTerms.add("medical malpractice");
    legalTerms.add("doctor negligence");
    legalTerms.add("standard of care");
  } else if (caseType === "product-liability") {
    legalTerms.add("product liability");
    legalTerms.add("defective product");
    legalTerms.add("manufacturer liability");
  } else if (caseType === "contract-dispute") {
    legalTerms.add("breach of contract");
    legalTerms.add("contract dispute");
    legalTerms.add("contract terms");
  } else if (caseType === "employment") {
    legalTerms.add("employment dispute");
    legalTerms.add("wrongful termination");
    legalTerms.add("workplace discrimination");
  } else if (caseType === "real-estate" || isHoaCase) {
    // Add HOA-specific terms if this appears to be an HOA case
    legalTerms.add("homeowners association");
    legalTerms.add("HOA");
    legalTerms.add("property code 209");
    legalTerms.add("Texas Property Code");
    legalTerms.add("board meeting");
    legalTerms.add("covenant");
    legalTerms.add("fine");
    legalTerms.add("notice requirement");
  }
  
  // If we detected an HOA case but didn't add the terms yet
  if (isHoaCase) {
    legalTerms.add("homeowners association");
    legalTerms.add("HOA");
    legalTerms.add("property code 209");
    legalTerms.add("Texas Property Code");
    legalTerms.add("board meeting");
  }
  
  // Always add negligence as it's common across many case types
  // But for HOA cases, prioritize specific terms
  if (!isHoaCase) {
    legalTerms.add("negligence");
    legalTerms.add("damages");
  }
  
  // Process relevant law for legal terms
  const lawWords = relevantLaw.split(/\W+/);
  for (let i = 0; i < lawWords.length - 1; i++) {
    if (lawWords[i].length > 3 && lawWords[i][0].toUpperCase() === lawWords[i][0]) {
      const term = lawWords[i] + ' ' + lawWords[i+1];
      if (term.length > 7) legalTerms.add(term);
    }
  }
  
  // Process legal issues for additional terms
  const issueWords = legalIssues.split(/\W+/);
  for (let i = 0; i < issueWords.length - 1; i++) {
    if (issueWords[i].length > 4) {
      const term = issueWords[i] + ' ' + issueWords[i+1];
      if (term.length > 7) legalTerms.add(term);
    }
  }
  
  // Extract named entities that might be relevant
  extractNamedEntities(preliminaryAnalysis).forEach(entity => {
    legalTerms.add(entity);
  });
  
  // Combine statutes and best legal terms
  const statutes = statuteMatches.slice(0, 2).join(' ');
  const bestTerms = Array.from(legalTerms).slice(0, 5).join(' ');
  
  const combinedTerms = `${statutes} ${bestTerms}`.trim();
  return combinedTerms.length > 0 ? combinedTerms : "liability negligence damages";
}

// Add explicit legal terms to improve search results based on case type
export function addExplicitLegalTerms(searchTerms: string, caseText: string, caseType: string): string {
  let enhancedTerms = searchTerms;
  
  // Check for HOA terms in the case text
  const isHoaCase = caseText.toLowerCase().includes("hoa") || 
                   caseText.toLowerCase().includes("homeowner") ||
                   caseText.toLowerCase().includes("property code § 209") ||
                   caseText.includes("209.006") ||
                   caseText.includes("209.007");
  
  // Add case-type specific terms
  if (isHoaCase || caseType === "real-estate" || caseType === "hoa") {
    enhancedTerms = `${enhancedTerms} "homeowners association" "HOA" "property code" "board meeting" "due process" notice 209.006 209.007 fines bylaws covenant`;
  }
  else if (caseType === "bailment") {
    enhancedTerms = `${enhancedTerms} "bailment" "bailee" "property" "duty of care" vehicle valuable theft stolen`;
  } 
  else if (caseType === "premises-liability") {
    enhancedTerms = `${enhancedTerms} "slip and fall" "premises liability" negligence duty dangerous condition owner occupier hazard unsafe`;
  }
  else if (caseType === "motor-vehicle-accident") {
    enhancedTerms = `${enhancedTerms} "motor vehicle" "car accident" collision automobile traffic negligence driver`;
  }
  else if (caseType === "medical-malpractice") {
    enhancedTerms = `${enhancedTerms} "medical malpractice" "standard of care" doctor hospital treatment negligence patient`;
  }
  else if (caseType === "product-liability") {
    enhancedTerms = `${enhancedTerms} "product liability" defective manufacturer warranty unsafe consumer`;
  }
  else if (caseType === "contract-dispute") {
    enhancedTerms = `${enhancedTerms} "breach of contract" agreement terms violation damages performance`;
  }
  else if (caseType === "employment") {
    enhancedTerms = `${enhancedTerms} "wrongful termination" discrimination harassment workplace employer employee`;
  }
  else {
    // Generic terms for other case types
    enhancedTerms = `${enhancedTerms} liability negligence damages duty breach`;
  }
  
  return enhancedTerms;
}
