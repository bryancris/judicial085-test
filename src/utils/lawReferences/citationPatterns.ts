
/**
 * Common Texas law citation patterns used for detecting legal references in text
 */

// Common Texas law citation patterns - Ordered by specificity (most specific first)
export const CITATION_PATTERNS = [
  // Complete legal concepts with full context (highest priority)
  /Texas\s+Lemon\s+Law\s*\([^)]*Chapter\s+573[^)]*Texas\s+Business[^)]*\)/gi,
  /Implied\s+Warranties?\s*\([^)]*Texas\s+Business\s+(?:&|and)\s+Commerce\s+Code[^)]*\)/gi,
  /Express\s+Warranties?\s*\([^)]*Texas\s+Business\s+(?:&|and)\s+Commerce\s+Code[^)]*\)/gi,
  /Breach\s+of\s+Warranty\s*\([^)]*Texas\s+Business[^)]*\)/gi,
  /Deceptive\s+Trade\s+Practices\s+Act\s*\([^)]*DTPA[^)]*\)/gi,
  
  // Texas codes with sections (medium priority)
  /Texas\s+Business\s+(?:and|&)\s+Commerce\s+Code\s+(?:Section|§)\s+(\d+\.\d+)/gi,
  /Texas\s+Civil\s+Practice\s+and\s+Remedies\s+Code\s+§\s+(\d+\.\d+)/gi,
  
  // General legal references (lower priority)
  /Texas\s+Lemon\s+Law/gi,
  /Magnuson-?Moss\s+Warranty\s+Act/gi,
  /Deceptive\s+Trade\s+Practices\s+Act|DTPA(?!\s*\()/gi,
  /Texas\s+Motor\s+Vehicle\s+Commission\s+Code/gi,
  /Texas\s+Business\s+(?:&|and)\s+Commerce\s+Code/gi,
  /Texas\s+Civil\s+Practice\s+(?:and|&)\s+Remedies\s+Code/gi,
  
  // Case law citations (specific cases first)
  /Wal-Mart\s+Stores,\s+Inc\.\s+v\.\s+Wright/gi,
  /Wal-Mart\s+Stores,\s+Inc\.\s+v\.\s+Gonzalez/gi,
  /\*([^*]+v\.\s+[^*]+)\*/gi, // Case citations in asterisks
  /\b([A-Z][a-zA-Z\s&,.''-]+)\s+v\.\s+([A-Z][a-zA-Z\s&,.''-]+),?\s*\d+\s+[A-Za-z\.]+\d*\s+\d+\s*\([^)]+\)/g, // Full case citations
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
