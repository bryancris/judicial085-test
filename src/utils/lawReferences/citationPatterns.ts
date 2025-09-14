
/**
 * Common Texas law citation patterns used for detecting legal references in text
 */

// Common Texas law citation patterns
export const CITATION_PATTERNS = [
  // Natural language patterns for common legal references (prioritize these)
  /Texas\s+Lemon\s+Law\s*\([^)]*Chapter\s+573[^)]*\)/gi,
  /Magnuson-?Moss\s+Warranty\s+Act\s*\([^)]*Federal[^)]*\)?/gi,
  /Deceptive\s+Trade\s+Practices\s+Act\s*\(DTPA\)/gi,
  /(?:DTPA|Deceptive\s+Trade\s+Practices\s+Act)(?!\s*\()/gi,
  /Implied\s+Warranties?\s*\([^)]*Texas\s+Business[^)]*\)/gi,
  /Express\s+Warranties?\s*\([^)]*Texas\s+Business[^)]*\)/gi,
  /Breach\s+of\s+Warranty\s*\([^)]*\)/gi,
  /Texas\s+Motor\s+Vehicle\s+Commission\s+Code/gi,
  
  // Chapter references in parentheses
  /\(Chapter\s+\d+[^)]*Texas\s+Business[^)]*\)/gi,
  /\(Chapter\s+\d+[^)]*Texas\s+Occupations[^)]*\)/gi,
  /Chapter\s+\d+\s+of\s+(?:the\s+)?Texas\s+(?:Business|Occupations|Civil)/gi,
  
  // Texas Business & Commerce Code (DTPA) sections - prioritize full format
  /Texas\s+Business\s+(?:and|&)\s+Commerce\s+Code\s+(?:Section|§)\s+(\d+\.\d+)/gi,
  // DTPA Section references with full context
  /(?:DTPA\s+)?(?:Section|§)\s+(17\.\d+)/gi,
  // Texas Civil Practice and Remedies Code § 75.001
  /Texas\s+Civil\s+Practice\s+and\s+Remedies\s+Code\s+§\s+(\d+\.\d+)/gi,
  // Section with full number (prevent partial matching)
  /Section\s+(\d+\.\d+)(?!\d)/gi,
  // § with full number (prevent partial matching)
  /§\s+(\d+\.\d+)(?!\d)/gi,
  // Texas Civil Practice & Remedies Code
  /Texas\s+Civil\s+Practice\s+(?:and|&)\s+Remedies\s+Code/gi,
  // Texas Business & Commerce Code
  /Texas\s+Business\s+(?:and|&)\s+Commerce\s+Code/gi,
  // Texas Penal Code Section 123
  /Texas\s+([A-Za-z]+)\s+Code\s+(?:Section|§)\s+(\d+)/gi,
  // Case law citations like *Wal-Mart Stores, Inc. v. Gonzalez*
  /\*([^*]+v\.\s+[^*]+)\*/gi,
  // Wal-Mart Stores, Inc. v. Wright (without asterisks)
  /Wal-Mart\s+Stores,\s+Inc\.\s+v\.\s+Wright/gi,
  // Wal-Mart Stores, Inc. v. Gonzalez (without asterisks)
  /Wal-Mart\s+Stores,\s+Inc\.\s+v\.\s+Gonzalez/gi,
  // Citations with § symbol followed by numbers (like § 101.021)
  /§\s+\d+\.\d+/gi,
  // Case law citations: "Plaintiff v. Defendant" 
  /\b([A-Z][a-zA-Z\s&,.''-]+)\s+v\.\s+([A-Z][a-zA-Z\s&,.''-]+)\b/g,
  // Case citations with full reference: "Case v. Case, 123 F.3d 456 (5th Cir. 2000)"
  /\b([A-Z][a-zA-Z\s&,.''-]+)\s+v\.\s+([A-Z][a-zA-Z\s&,.''-]+),?\s*\d+\s+[A-Za-z\.]+\d*\s+\d+\s*\([^)]+\)/g,
  // Citation only: "123 S.W.2d 456 (Tex. 1985)"
  /\b\d+\s+[A-Za-z\.]+\d*\s+\d+\s*\([^)]+\)/g,
  // Specific Texas Supreme Court citations
  /Logan\s+v\.\s+Mullis/gi,
  /Fless\s+v\.\s+Fless/gi,
];

// A mapping of known case citations to their direct URLs
export const HARDCODED_URLS: Record<string, string> = {
  "§ 101.021": "https://statutes.capitol.texas.gov/Docs/CP/htm/CP.101.htm",
  "Texas Civil Practice and Remedies Code": "https://statutes.capitol.texas.gov/Docs/CP/htm/CP.75.htm",
  "Texas Lemon Law": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.2301.htm",
  "Magnuson-Moss Warranty Act": "https://www.law.cornell.edu/uscode/text/15/2301",
  "Deceptive Trade Practices Act": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.17.htm",
  "DTPA": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.17.htm",
  "Texas Business & Commerce Code": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.17.htm",
  "Texas Motor Vehicle Commission Code": "https://statutes.capitol.texas.gov/Docs/OC/htm/OC.2301.htm",
  "Chapter 573": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.2301.htm",
  "Wal-Mart Stores, Inc. v. Wright": "https://caselaw.findlaw.com/tx-supreme-court/1372854.html",
  "Wal-Mart Stores, Inc. v. Gonzalez": "https://caselaw.findlaw.com/tx-supreme-court/1031086.html"
};
