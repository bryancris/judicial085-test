
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

// A mapping of parenthetical citations to their direct URLs (ONLY full parenthetical patterns)
export const HARDCODED_URLS: Record<string, string> = {
  // Only map complete parenthetical citations to prevent over-hyperlinking
  "(Tex. Bus. & Com. Code § 541.001)": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.541.htm",
  "(Tex. Bus. & Com. Code § 541.002)": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.541.htm",
  "(Tex. Bus. & Com. Code § 541.003)": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.541.htm",
  "(Tex. Bus. & Com. Code Chapter 541)": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.541.htm",
  "(Tex. Bus. & Com. Code Chapter 2)": "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.2.htm",
  "(Tex. Civ. Prac. & Rem. Code § 101.021)": "https://statutes.capitol.texas.gov/Docs/CP/htm/CP.101.htm",
  "(Tex. Civ. Prac. & Rem. Code Chapter 41)": "https://statutes.capitol.texas.gov/Docs/CP/htm/CP.41.htm",
  "(Tex. Occ. Code Chapter 2301)": "https://statutes.capitol.texas.gov/Docs/OC/htm/OC.2301.htm",
  "*Wal-Mart Stores, Inc. v. Wright*": "https://caselaw.findlaw.com/tx-supreme-court/1372854.html",
  "*Wal-Mart Stores, Inc. v. Gonzalez*": "https://caselaw.findlaw.com/tx-supreme-court/1031086.html"
};
