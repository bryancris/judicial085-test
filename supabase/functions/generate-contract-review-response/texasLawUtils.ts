
/**
 * Texas Law Utilities
 * Functions for retrieving relevant Texas laws from the vector database
 */

import { supabase } from "./supabaseClient.ts";

/**
 * Get relevant Texas laws based on contract section and text
 * @param sectionType The type of contract section (e.g., "choice-of-law")
 * @param sectionText The text of the contract section
 * @returns Array of relevant Texas laws
 */
export const getRelevantTexasLaws = async (sectionType: string, sectionText: string): Promise<any[]> => {
  try {
    // Map section types to search queries
    const searchQueries: Record<string, string> = {
      "choice-of-law": "Texas choice of law contract provision",
      "security-interest": "Texas security interest collateral requirements",
      "liquidated-damages": "Texas liquidated damages penalty contract law",
      "waiver": "Texas waiver of rights contract law",
      "limitation-of-liability": "Texas limitation of liability contract law"
    };
    
    const searchQuery = searchQueries[sectionType] || sectionType;
    
    // Search for documents in the vector database
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, content, metadata')
      .textSearch('content', searchQuery, { type: 'plain' })
      .limit(3);
    
    if (error) {
      console.error("Error searching documents:", error);
      return getDefaultTexasLaws(sectionType);
    }
    
    if (!documents || documents.length === 0) {
      return getDefaultTexasLaws(sectionType);
    }
    
    // Format the results
    return documents.map(doc => ({
      id: doc.id,
      content: doc.content,
      reference: extractLawReference(doc.content, sectionType) || "Texas law reference",
      metadata: doc.metadata
    }));
  } catch (error) {
    console.error("Error in getRelevantTexasLaws:", error);
    return getDefaultTexasLaws(sectionType);
  }
};

/**
 * Extract a law reference from content
 * @param content The content to search for references
 * @param sectionType The type of section
 * @returns A formatted law reference if found
 */
const extractLawReference = (content: string, sectionType: string): string | null => {
  if (!content) return null;
  
  // Look for patterns like "Section 123.45" or "§ 123.45"
  const sectionMatch = content.match(/Section\s+(\d+\.\d+)|§\s*(\d+\.\d+)/i);
  if (sectionMatch) {
    const section = sectionMatch[1] || sectionMatch[2];
    
    // Map section type to likely code
    const codeMap: Record<string, string> = {
      "choice-of-law": "Texas Business & Commerce Code",
      "security-interest": "Texas Business & Commerce Code",
      "liquidated-damages": "Texas Civil Practice & Remedies Code",
      "waiver": "Texas Business & Commerce Code",
      "limitation-of-liability": "Texas Business & Commerce Code"
    };
    
    const code = codeMap[sectionType] || "Texas Code";
    return `${code} § ${section}`;
  }
  
  return null;
};

/**
 * Get default Texas laws when database search fails
 * @param sectionType The type of contract section
 * @returns Array with default law reference
 */
const getDefaultTexasLaws = (sectionType: string): any[] => {
  const defaultLaws: Record<string, any> = {
    "choice-of-law": {
      reference: "Texas Business & Commerce Code § 1.301",
      content: "Texas courts generally reject choice of law provisions that attempt to avoid fundamental Texas policy."
    },
    "security-interest": {
      reference: "Texas Business & Commerce Code § 9.203",
      content: "Security interests must specifically describe collateral. Overly broad security interests may be unenforceable."
    },
    "liquidated-damages": {
      reference: "Texas Civil Practice & Remedies Code § 41.008",
      content: "Liquidated damages that operate as a penalty are unenforceable under Texas law."
    },
    "waiver": {
      reference: "Texas Business & Commerce Code § 17.42",
      content: "Waivers of Texas Deceptive Trade Practices Act protections are generally void."
    },
    "limitation-of-liability": {
      reference: "Texas Civil Practice & Remedies Code § 41.003",
      content: "Limitations on liability for gross negligence or intentional misconduct are void as against public policy."
    }
  };
  
  const defaultLaw = defaultLaws[sectionType] || {
    reference: "Texas Business & Commerce Code",
    content: "Texas contract law requires fair and reasonable terms."
  };
  
  return [defaultLaw];
};
