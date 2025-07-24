
/**
 * Utility functions for handling consumer protection law references
 */

// DTPA section descriptions for better context
export const dtpaSections = {
  "17.41": "Purpose of the DTPA (legislative intent)",
  "17.42": "Waivers: Void",
  "17.43": "Cumulative Remedies",
  "17.44": "Construction and Application of the DTPA",
  "17.45": "Definitions under the DTPA",
  "17.46": "Deceptive Trade Practices Unlawful (the 'laundry list')",
  "17.47": "Restraining Orders",
  "17.48": "Duty of District and County Attorney",
  "17.49": "Exemptions",
  "17.50": "Relief for Consumers",
  "17.505": "Settlement Procedures",
  "17.5051": "Mediation",
  "17.5052": "Offers of Settlement",
  "17.506": "Damages: Defenses",
  "17.55": "Promotional Material",
  "17.555": "Indemnity",
  "17.56": "Venue",
  "17.565": "Limitation",
  "17.57": "Subpoenas",
  "17.58": "Voluntary Compliance",
  "17.59": "Post Judgment Relief",
  "17.60": "Reports and Examinations",
  "17.61": "Civil Investigative Demand",
  "17.62": "Penalties",
  "17.63": "Application of the DTPA"
};

// Common DTPA violations from the "laundry list" in 17.46(b)
export const dtpaViolations = {
  "17.46(b)(1)": "Passing off goods or services as those of another",
  "17.46(b)(2)": "Causing confusion about the source, sponsorship, approval, or certification of goods or services",
  "17.46(b)(3)": "Causing confusion about affiliation, connection, or association with another",
  "17.46(b)(4)": "Using deceptive representations about geographic origin",
  "17.46(b)(5)": "Representing goods or services have characteristics, uses, benefits they do not have",
  "17.46(b)(6)": "Representing goods are original or new if they are deteriorated, reconditioned, or secondhand",
  "17.46(b)(7)": "Representing goods or services are of a particular standard, quality, or grade if they are of another",
  "17.46(b)(8)": "Disparaging goods, services, or business by false or misleading representations",
  "17.46(b)(9)": "Advertising goods or services with intent not to sell them as advertised",
  "17.46(b)(10)": "Advertising with intent not to supply a reasonable demand, for the purpose of bait-and-switch",
  "17.46(b)(11)": "Making false or misleading statements about price reductions",
  "17.46(b)(12)": "Representing that an agreement confers rights which it does not",
  "17.46(b)(13)": "Knowingly making false or misleading statements about the need for parts, replacement, or repair",
  "17.46(b)(14)": "Misrepresenting the authority of a representative to claim special price or advantage",
  "17.46(b)(17)": "Advertising under the guise of obtaining sales personnel when the purpose is to sell to the personnel",
  "17.46(b)(20)": "Selling a warranty without disclosing terms, conditions, and limitations conspicuously",
  "17.46(b)(24)": "Failing to disclose information concerning goods or services known at the time of the transaction"
};

// Home Solicitation Act key provisions
export const homeSolicitationProvisions = {
  "601.002": "Definitions under Home Solicitation Act",
  "601.051": "Cancellation and Refund - Right to Cancel",
  "601.052": "Notice of Cancellation Required",
  "601.053": "Form of Notice of Cancellation",
  "601.103": "Violation of Home Solicitation Act is a deceptive trade practice"
};

// Format a consumer protection statute for display
export function formatConsumerStatute(statute: string): string {
  // Handle DTPA violations format
  if (statute.startsWith("17.46(b)")) {
    const violationNum = statute.match(/\(b\)\((\d+)\)/)?.[1];
    if (violationNum && dtpaViolations[statute]) {
      return `Texas Business & Commerce Code § ${statute} - ${dtpaViolations[statute]}`;
    }
  }
  
  // Handle general DTPA sections
  if (statute.startsWith("17.") && dtpaSections[statute.split("(")[0]]) {
    return `Texas Business & Commerce Code § ${statute} - ${dtpaSections[statute.split("(")[0]]}`;
  }
  
  // Handle Home Solicitation Act
  if (statute.startsWith("601.") && homeSolicitationProvisions[statute]) {
    return `Texas Business & Commerce Code § ${statute} - ${homeSolicitationProvisions[statute]}`;
  }
  
  // Default format
  return `Texas Business & Commerce Code § ${statute}`;
}

// Check if a statute is related to consumer protection
export function isConsumerProtectionStatute(statute: string): boolean {
  return (
    statute.startsWith("17.") || 
    statute.startsWith("601.") || 
    statute.includes("DTPA") ||
    statute.toLowerCase().includes("deceptive")
  );
}

// Extract DTPA references from text
export function extractDTPAReferences(text: string): string[] {
  const dtpaPattern = /(?:§|sec\.?|section)\s*17\.\d+(?:\([a-z]\)(?:\(\d+\))?)?/gi;
  const matches = text.match(dtpaPattern) || [];
  
  return matches.map(m => {
    const cleaned = m.replace(/(?:§|sec\.?|section)\s*/i, '').trim();
    return cleaned;
  });
}

// Key DTPA cases
export const dtpaCaseLaw = [
  {
    caseName: "Riverside National Bank v. Lewis",
    citation: "603 S.W.2d 169 (Tex. 1980)",
    summary: "Defined who qualifies as a 'consumer' under the DTPA"
  },
  {
    caseName: "Spradling v. Williams",
    citation: "566 S.W.2d 561 (Tex. 1978)",
    summary: "Established treble damages for deceptive practices"
  },
  {
    caseName: "Woods v. Littleton",
    citation: "554 S.W.2d 662 (Tex. 1977)",
    summary: "Defined 'knowingly' under the DTPA"
  },
  {
    caseName: "Cameron v. Terrell & Garrett, Inc.",
    citation: "618 S.W.2d 535 (Tex. 1981)",
    summary: "Consumer doesn't need privity with the defendant to sue under DTPA"
  },
  {
    caseName: "PPG Industries, Inc. v. JMB/Houston Centers",
    citation: "146 S.W.3d 79 (Tex. 2004)",
    summary: "DTPA claims generally cannot be assigned to other parties"
  }
];

/**
 * Formats a citation to include full context and description
 * @param citation The raw citation text
 * @returns Formatted citation with context
 */
export const formatCitationWithContext = (citation: string): string => {
  // Handle bare "50" - convert to full DTPA section reference
  if (citation.trim() === "50") {
    return "§ 17.50 (Relief for Consumers)";
  }
  
  // Handle partial section numbers that should be DTPA sections
  const partialMatch = citation.match(/^\s*(\d+)\s*$/);
  if (partialMatch && partialMatch[1] && ["50", "505", "501"].includes(partialMatch[1])) {
    const sectionNum = partialMatch[1];
    if (dtpaSections[`17.${sectionNum}`]) {
      return `§ 17.${sectionNum} (${dtpaSections[`17.${sectionNum}`]})`;
    }
  }
  
  // Add context to DTPA sections
  Object.entries(dtpaSections).forEach(([section, description]) => {
    const patterns = [
      new RegExp(`^\\s*§?\\s*${section}\\s*$`, 'i'),
      new RegExp(`^\\s*Section\\s*${section}\\s*$`, 'i'),
      new RegExp(`^\\s*${section}\\s*$`, 'i')
    ];
    
    patterns.forEach(pattern => {
      if (pattern.test(citation)) {
        citation = `§ ${section} (${description})`;
      }
    });
  });
  
  return citation;
};

// Process analysis content to enhance consumer protection references
export function enhanceConsumerProtectionAnalysis(content: string): string {
  let enhanced = content;
  
  // First, fix any bare numbers that should be DTPA sections
  enhanced = enhanced.replace(/\b(\d{2,3})\b/g, (match, num) => {
    if (["50", "501", "505"].includes(num)) {
      const fullSection = `17.${num}`;
      if (dtpaSections[fullSection]) {
        return `§ ${fullSection} (${dtpaSections[fullSection]})`;
      }
    }
    return match;
  });
  
  // Enhance DTPA citations with description where possible
  Object.keys(dtpaSections).forEach(section => {
    const regex = new RegExp(`(§|sec\\.?|section)\\s*${section.replace('.', '\\.')}\\b(?!\\s*\\([^)]*\\))`, 'gi');
    enhanced = enhanced.replace(regex, `$1 ${section} (${dtpaSections[section]})`);
  });
  
  // Enhance laundry list violations with descriptions
  Object.keys(dtpaViolations).forEach(violation => {
    const baseViolation = violation.replace(/\(b\)\(\d+\)/, '(b)');
    const violationNumber = violation.match(/\(b\)\((\d+)\)/)?.[1];
    
    if (violationNumber) {
      const regex = new RegExp(`(§|sec\\.?|section)\\s*17\\.46\\(b\\)\\(${violationNumber}\\)\\b`, 'gi');
      enhanced = enhanced.replace(regex, `$1 17.46(b)(${violationNumber}) (${dtpaViolations[violation]})`);
    }
  });
  
  return enhanced;
}
