
/**
 * Common Texas law citation patterns used for detecting legal references in text
 */

// Common Texas law citation patterns
export const CITATION_PATTERNS = [
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
];

// A mapping of known case citations to their direct URLs
export const HARDCODED_URLS: Record<string, string> = {
  "§ 101.021": "https://statutes.capitol.texas.gov/Docs/CP/htm/CP.101.htm",
  "Texas Civil Practice and Remedies Code": "https://statutes.capitol.texas.gov/Docs/CP/htm/CP.75.htm",
  "Wal-Mart Stores, Inc. v. Wright": "https://caselaw.findlaw.com/tx-supreme-court/1372854.html",
  "Wal-Mart Stores, Inc. v. Gonzalez": "https://caselaw.findlaw.com/tx-supreme-court/1031086.html"
};
