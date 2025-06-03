
/**
 * Mapping service to connect legal citations to Knowledge base PDF documents
 */

export interface KnowledgeBaseLawDocument {
  id: string;
  title: string;
  filename: string;
  url?: string;
  citations: string[];
  searchTerms: string[];
}

// Knowledge base law documents mapping
export const KNOWLEDGE_BASE_LAW_DOCS: KnowledgeBaseLawDocument[] = [
  {
    id: "texas-penal-code",
    title: "Texas Penal Code",
    filename: "PENALCODE.pdf",
    citations: [
      "Texas Penal Code",
      "Penal Code",
      "§ 42.092", 
      "§ 42.091",
      "§ 42.09",
      "Chapter 42"
    ],
    searchTerms: ["animal cruelty", "cruelty to animals", "attack on assistance animal", "disorderly conduct"]
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
      "§ 17.41",
      "§ 17.46", 
      "§ 17.50",
      "§ 17.505",
      "Chapter 17"
    ],
    searchTerms: ["consumer protection", "deceptive trade practices", "false advertising", "misleading practices"]
  },
  {
    id: "texas-civil-practice-remedies-code",
    title: "Texas Civil Practice & Remedies Code", 
    filename: "CIVILPRACTICEANDREMEDIESCODE.pdf",
    citations: [
      "Texas Civil Practice & Remedies Code",
      "Civil Practice & Remedies Code",
      "§ 16.003",
      "§ 33.001",
      "§ 41.001",
      "Chapter 16",
      "Chapter 33",
      "Chapter 41"
    ],
    searchTerms: ["statute of limitations", "proportionate responsibility", "damages", "personal injury"]
  },
  {
    id: "texas-government-code",
    title: "Texas Government Code",
    filename: "GOVERNMENTCODE.pdf", 
    citations: [
      "Texas Government Code",
      "Government Code",
      "§ 311.005",
      "Chapter 311"
    ],
    searchTerms: ["statutory construction", "general definitions"]
  }
];

/**
 * Extract legal citations from analysis content
 */
export const extractLegalCitations = (content: string): string[] => {
  const citations: string[] = [];
  
  // Pattern for Texas codes with section numbers
  const codePattern = /(Texas\s+[A-Za-z]+(?:\s+[&]?\s*[A-Za-z]+)*\s+Code\s+§\s+\d+\.\d+)/gi;
  
  // Pattern for standalone section references
  const sectionPattern = /§\s+\d+\.\d+/gi;
  
  // Pattern for chapter references
  const chapterPattern = /(Chapter\s+\d+)/gi;
  
  // Pattern for specific laws
  const lawPattern = /(Texas\s+Deceptive\s+Trade\s+Practices\s+Act|DTPA|Texas\s+Penal\s+Code|Penal\s+Code)/gi;
  
  let match;
  
  // Extract code citations
  while ((match = codePattern.exec(content)) !== null) {
    citations.push(match[1]);
  }
  
  // Extract section references
  while ((match = sectionPattern.exec(content)) !== null) {
    citations.push(match[0]);
  }
  
  // Extract chapter references
  while ((match = chapterPattern.exec(content)) !== null) {
    citations.push(match[1]);
  }
  
  // Extract law references
  while ((match = lawPattern.exec(content)) !== null) {
    citations.push(match[1]);
  }
  
  return [...new Set(citations)]; // Remove duplicates
};

/**
 * Map citations to knowledge base documents
 */
export const mapCitationsToKnowledgeBase = (citations: string[]): KnowledgeBaseLawDocument[] => {
  const matchedDocs: KnowledgeBaseLawDocument[] = [];
  
  for (const citation of citations) {
    for (const doc of KNOWLEDGE_BASE_LAW_DOCS) {
      // Check if citation matches any of the document's citation patterns
      const isMatch = doc.citations.some(pattern => 
        citation.toLowerCase().includes(pattern.toLowerCase()) ||
        pattern.toLowerCase().includes(citation.toLowerCase())
      );
      
      if (isMatch && !matchedDocs.find(d => d.id === doc.id)) {
        matchedDocs.push(doc);
      }
    }
  }
  
  return matchedDocs;
};

/**
 * Generate direct PDF URLs for law documents from Supabase storage
 */
export const generateDirectPdfUrl = (filename: string): string => {
  // Direct link to PDF in Supabase storage - documents bucket
  return `https://ghpljdgecjmhkwkfctgy.supabase.co/storage/v1/object/public/documents/${filename}`;
};

/**
 * Generate knowledge base URLs for law documents (for internal search use)
 */
export const generateKnowledgeBaseUrl = (filename: string): string => {
  return `/knowledge?search=${encodeURIComponent(filename)}`;
};
