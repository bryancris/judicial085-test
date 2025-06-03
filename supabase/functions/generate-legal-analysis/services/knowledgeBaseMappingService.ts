
// Knowledge base law documents mapping for citation extraction
const KNOWLEDGE_BASE_LAW_DOCS = [
  {
    id: "texas-penal-code",
    title: "Texas Penal Code",
    filename: "PENALCODE.pdf",
    citations: ["Texas Penal Code", "Penal Code", "§ 42.092", "§ 42.091", "§ 42.09", "Chapter 42", "Section 42.092", "Section 42.091"],
    searchTerms: ["animal cruelty", "cruelty to animals", "attack on assistance animal"]
  },
  {
    id: "texas-business-commerce-code", 
    title: "Texas Business & Commerce Code",
    filename: "BUSINESSANDCOMMERCECODE.pdf",
    citations: [
      "Texas Business & Commerce Code", 
      "Business & Commerce Code", 
      "DTPA", 
      "Texas Deceptive Trade Practices Act", 
      "Deceptive Trade Practices-Consumer Protection Act",
      "§ 17.41", "§ 17.46", "§ 17.50", "§ 17.505", "§ 17.63",
      "Section 17.41", "Section 17.46", "Section 17.50", "Section 17.505", "Section 17.63",
      "Section 17.46(a)", "Section 17.46(b)", "Section 17.46(b)(24)",
      "Section 17.50(a)", "Section 17.50(a)(2)", "Section 17.50(a)(3)",
      "Section 17.50(b)", "Section 17.50(b)(1)", "Section 17.50(d)",
      "Chapter 17", "Chapter 601", "§ 601.001"
    ],
    searchTerms: ["consumer protection", "deceptive trade practices", "false advertising"]
  },
  {
    id: "texas-civil-practice-remedies-code",
    title: "Texas Civil Practice & Remedies Code",
    filename: "CIVILPRACTICEANDREMEDIESCODE.pdf", 
    citations: [
      "Texas Civil Practice & Remedies Code", 
      "Civil Practice & Remedies Code", 
      "§ 16.003", "§ 33.001", "§ 41.001",
      "Section 16.003", "Section 33.001", "Section 41.001",
      "Chapter 16", "Chapter 33", "Chapter 41"
    ],
    searchTerms: ["statute of limitations", "proportionate responsibility", "damages"]
  }
];

// Enhanced map citations to knowledge base documents with direct PDF URLs
export function mapCitationsToKnowledgeBase(citations: string[]): any[] {
  const matchedDocs: any[] = [];
  
  console.log("Mapping citations to knowledge base:", citations);
  
  for (const citation of citations) {
    console.log("Processing citation:", citation);
    
    for (const doc of KNOWLEDGE_BASE_LAW_DOCS) {
      // Enhanced matching logic
      const isMatch = doc.citations.some(pattern => {
        const citationLower = citation.toLowerCase();
        const patternLower = pattern.toLowerCase();
        
        // Exact match
        if (citationLower === patternLower) return true;
        
        // Citation contains pattern
        if (citationLower.includes(patternLower)) return true;
        
        // Pattern contains citation (for broader matches)
        if (patternLower.includes(citationLower) && citationLower.length > 5) return true;
        
        // Special DTPA matching
        if ((citationLower.includes('dtpa') || citationLower.includes('deceptive trade')) && 
            (patternLower.includes('dtpa') || patternLower.includes('deceptive trade'))) return true;
            
        // Business & Commerce Code matching for section references
        if (citationLower.match(/section\s+17\./i) && patternLower.includes('business')) return true;
        if (citationLower.match(/§\s+17\./i) && patternLower.includes('business')) return true;
        
        // Penal Code matching for section references  
        if (citationLower.match(/section\s+42\./i) && patternLower.includes('penal')) return true;
        if (citationLower.match(/§\s+42\./i) && patternLower.includes('penal')) return true;
        
        // Enhanced DTPA section matching
        if (citationLower.match(/section\s+17\.\d+/i) && doc.id === 'texas-business-commerce-code') return true;
        if (citationLower.match(/§\s+17\.\d+/i) && doc.id === 'texas-business-commerce-code') return true;
        
        // Enhanced Penal Code section matching
        if (citationLower.match(/section\s+42\.\d+/i) && doc.id === 'texas-penal-code') return true;
        if (citationLower.match(/§\s+42\.\d+/i) && doc.id === 'texas-penal-code') return true;
        
        return false;
      });
      
      if (isMatch && !matchedDocs.find(d => d.id === doc.id)) {
        const mappedDoc = {
          id: doc.id,
          title: doc.title,
          url: `https://ghpljdgecjmhkwkfctgy.supabase.co/storage/v1/object/public/documents/${doc.filename}`,
          content: `Click to view the full ${doc.title} document.`
        };
        
        console.log("Matched citation to document:", { citation, doc: mappedDoc.title });
        matchedDocs.push(mappedDoc);
      }
    }
  }
  
  console.log("Final matched documents:", matchedDocs.map(doc => doc.title));
  return matchedDocs;
}
