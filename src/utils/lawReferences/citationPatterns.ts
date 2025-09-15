
/**
 * Common Texas law citation patterns used for detecting legal references in text
 */

// Common Texas law citation patterns - Ordered by specificity (parenthetical citations ONLY)
export const CITATION_PATTERNS = [
  // ONLY Parenthetical citations - Handle both raw text and HTML-encoded versions
  /\(Tex\.\s*Bus\.\s*&amp;\s*Com\.\s*Code\s*§\s*(\d+\.\d+)(?:\s*et\s*seq\.)?\)/gi, // HTML encoded &
  /\(Tex\.\s*Bus\.\s*&\s*Com\.\s*Code\s*§\s*(\d+\.\d+)(?:\s*et\s*seq\.)?\)/gi, // Regular &
  /\(Tex\.\s*Bus\.\s*&amp;\s*Com\.\s*Code\s*Chapter\s*(\d+)\)/gi,
  /\(Tex\.\s*Bus\.\s*&\s*Com\.\s*Code\s*Chapter\s*(\d+)\)/gi,
  /\(Tex\.\s*Civ\.\s*Prac\.\s*&amp;\s*Rem\.\s*Code\s*Chapter\s*(\d+)\)/gi,
  /\(Tex\.\s*Civ\.\s*Prac\.\s*&\s*Rem\.\s*Code\s*Chapter\s*(\d+)\)/gi,
  /\(Tex\.\s*Civ\.\s*Prac\.\s*&amp;\s*Rem\.\s*Code\s*§\s*(\d+\.\d+)\)/gi,
  /\(Tex\.\s*Civ\.\s*Prac\.\s*&\s*Rem\.\s*Code\s*§\s*(\d+\.\d+)\)/gi,
  /\(Tex\.\s*Gov&#x27;t\s*Code\s*§\s*(\d+\.\d+)\)/gi, // HTML encoded apostrophe
  /\(Tex\.\s*Gov't\s*Code\s*§\s*(\d+\.\d+)\)/gi, // Regular apostrophe
  /\(Tex\.\s*Occ\.\s*Code\s*§\s*(\d+\.\d+)\)/gi,
  
  // Parenthetical case law citations
  /\*([^*]+v\.\s+[^*]+)\*/gi, // Case citations in asterisks
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
  "Tex. Bus. & Com. Code": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.17.htm",
  "Texas Motor Vehicle Commission Code": "https://statutes.capitol.texas.gov/Docs/OC/htm/OC.2301.htm",
  "Chapter 573": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.2301.htm",
  "Chapter 541": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.541.htm",
  "§ 541.001": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.541.htm",
  "§ 541.002": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.541.htm",
  "§ 541.003": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.541.htm",
  "Wal-Mart Stores, Inc. v. Wright": "https://caselaw.findlaw.com/tx-supreme-court/1372854.html",
  "Wal-Mart Stores, Inc. v. Gonzalez": "https://caselaw.findlaw.com/tx-supreme-court/1031086.html"
};
