
// Enhanced extract legal citations from analysis content
export function extractLegalCitations(content: string): string[] {
  const citations: string[] = [];
  
  console.log("Extracting citations from content preview:", content.substring(0, 500) + "...");
  
  // Enhanced patterns for comprehensive citation extraction
  const patterns = [
    // Texas codes with section numbers (e.g., Texas Business & Commerce Code § 17.46)
    /(Texas\s+[A-Za-z]+(?:\s+[&]?\s*[A-Za-z]+)*\s+Code\s+§\s+\d+\.\d+(?:\([a-z0-9]+\))?)/gi,
    
    // Section references with subsections (e.g., Section 17.46(b), Section 17.50(a)(2))
    /(Section\s+\d+\.\d+(?:\([a-z0-9]+\))?(?:\([a-z0-9]+\))?)/gi,
    
    // Standalone section symbols (e.g., § 17.46, § 17.50(b))
    /(§\s+\d+\.\d+(?:\([a-z0-9]+\))?(?:\([a-z0-9]+\))?)/gi,
    
    // Chapter references (e.g., Chapter 17, Chapter 42)
    /(Chapter\s+\d+)/gi,
    
    // DTPA and specific law names
    /(Texas\s+Deceptive\s+Trade\s+Practices\s+Act|DTPA|Texas\s+Penal\s+Code|Penal\s+Code|Business\s+&\s+Commerce\s+Code)/gi,
    
    // Deceptive Trade Practices-Consumer Protection Act
    /(Deceptive\s+Trade\s+Practices-Consumer\s+Protection\s+Act)/gi,
    
    // Texas Home Solicitation Act
    /(Texas\s+Home\s+Solicitation\s+Act)/gi,
    
    // Texas Debt Collection Act  
    /(Texas\s+Debt\s+Collection\s+Act)/gi,
    
    // Enhanced patterns for specific section formats
    /(Section\s+\d+\.\d+\([a-z]\)(?:\(\d+\))?)/gi, // Section 17.46(a)(1)
    /(§\s+\d+\.\d+\([a-z]\)(?:\(\d+\))?)/gi, // § 17.46(a)(1)
    
    // DTPA specific subsections
    /(Section\s+17\.\d+(?:\([a-z0-9]+\))*)/gi,
    /(§\s+17\.\d+(?:\([a-z0-9]+\))*)/gi,
    
    // Penal Code specific sections
    /(Section\s+42\.\d+(?:\([a-z0-9]+\))*)/gi,
    /(§\s+42\.\d+(?:\([a-z0-9]+\))*)/gi,
    
    // Generic Texas Code references
    /(Texas\s+[A-Za-z\s&]+Code(?:\s+§\s+\d+\.\d+)?)/gi
  ];
  
  // Extract citations using all patterns
  patterns.forEach((pattern, index) => {
    let match;
    const patternRegex = new RegExp(pattern);
    while ((match = patternRegex.exec(content)) !== null) {
      if (match[1] && match[1].trim()) {
        citations.push(match[1].trim());
      }
    }
  });
  
  const uniqueCitations = [...new Set(citations)];
  console.log("Extracted unique citations:", uniqueCitations);
  
  return uniqueCitations;
}
