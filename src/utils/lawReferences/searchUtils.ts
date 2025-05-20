
/**
 * Utility functions for searching law documents in the vector database
 */

import { supabase } from "@/integrations/supabase/client";
import { DocumentMetadataDetail } from "@/types/knowledge";

/**
 * Search for law documents in the vector database
 * @param searchTerm The search term to query
 * @returns Promise with the search results
 */
export const searchLawDocuments = async (searchTerm: string): Promise<{
  id: string;
  title: string | null;
  url: string | null;
  content?: string | null;
}[]> => {
  try {
    console.log(`Searching for document: "${searchTerm}"`);
    
    // First try to find documents in document_metadata which might have direct PDF URLs
    const { data: metadataResults, error: metadataError } = await supabase
      .from('document_metadata')
      .select('id, title, url')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(5);
    
    if (metadataError) {
      console.error("Error searching document metadata:", metadataError);
    }
    
    // If we found direct metadata with URLs, use those
    if (metadataResults && metadataResults.length > 0) {
      console.log(`Found ${metadataResults.length} direct metadata results with URLs`);
      return metadataResults.map(doc => ({
        id: doc.id,
        title: doc.title || "Texas Law Document",
        url: doc.url,
        content: null
      }));
    }
    
    // Fallback to searching in the documents table
    const { data: documents, error: searchError } = await supabase
      .from('documents')
      .select('id, content, metadata')
      .textSearch('content', searchTerm, { type: 'plain' })
      .limit(5);

    if (searchError) {
      console.error("Error in text search:", searchError);
      return [];
    }

    console.log(`Found ${documents?.length || 0} documents in content search`);

    // Map the results to the expected format
    return (documents || []).map(doc => {
      const metadata = doc.metadata as DocumentMetadataDetail;
      const content = doc.content || null;
      // Extract a snippet if the content is long
      const snippet = content && content.length > 300 
        ? content.substring(0, 300) + "..." 
        : content;
      
      return {
        id: metadata?.file_id || String(doc.id),
        title: metadata?.title || metadata?.file_title || "Texas Law Document",
        url: metadata?.file_path || null,
        content: snippet
      };
    });
  } catch (error) {
    console.error("Exception in searchLawDocuments:", error);
    return [];
  }
};

/**
 * Extract potential legal topics from a text
 * @param text The text to analyze
 * @returns Array of potential legal topics
 */
export const extractLegalTopics = (text: string): string[] => {
  // List of potential legal topics to check for in Texas law context
  const legalTopics = [
    "personal injury", "premises liability", "negligence", "tort", 
    "civil practice", "CPRC", "family law", "divorce", "custody", 
    "property division", "criminal", "DUI", "DWI", "theft", 
    "assault", "battery", "contract", "breach", "damages", 
    "real estate", "landlord tenant", "eviction", "workers compensation",
    "employment", "discrimination", "estate planning", "probate", "will", 
    "trust", "guardianship", "business formation", "LLC", "corporation",
    "insurance", "malpractice", "wrongful death", "product liability",
    "homeowners association", "HOA", "property code", "bylaws", "community rules",
    "covenant", "deed restriction", "board meeting", "open meeting", "assessment",
    "due process", "fines", "notice requirement", "property code 209", "209.006", "209.007"
  ];
  
  // Convert to lowercase for case-insensitive matching
  const lowercaseText = text.toLowerCase();
  
  // Find which topics are mentioned in the text
  return legalTopics.filter(topic => 
    lowercaseText.includes(topic.toLowerCase())
  );
};

/**
 * Extract potential statute references from text
 * @param text The text to analyze
 * @returns Array of potential statute references
 */
export const extractStatuteReferences = (text: string): string[] => {
  // Extract potential statute references like "Section 101.021" or "§ 209.006"
  const statutePattern = /\b(section|§)\s*\d+(\.\d+)*\b/gi;
  const matches = text.match(statutePattern) || [];
  
  // Look specifically for Property Code references common in HOA cases
  const propCodePattern = /\bproperty\s+code\s+(?:section\s+)?(\d+(\.\d+)*)\b/gi;
  const propCodeMatches = [];
  let match;
  
  while ((match = propCodePattern.exec(text)) !== null) {
    propCodeMatches.push(match[1]);
  }
  
  // Clean up the references (remove "Section" prefix)
  return [...matches.map(s => s.replace(/^(section|§)\s*/i, '')), ...propCodeMatches];
};

/**
 * Extract potential case names from text
 * @param text The text to analyze
 * @returns Array of potential case names
 */
export const extractCaseNames = (text: string): string[] => {
  // Extract case names like "Roe v. Wade"
  const casePattern = /\b[A-Z][a-z]+\s+v\.?\s+[A-Z][a-z]+\b/g;
  return text.match(casePattern) || [];
};

/**
 * Check if text is related to HOA/Property Code cases
 * @param text The text to analyze
 * @returns boolean indicating if this is an HOA case
 */
export const isHOARelated = (text: string): boolean => {
  const hoaKeywords = [
    "homeowners association", "property owners association", "hoa", "poa",
    "deed restriction", "restrictive covenant", "property code 209", "209.006",
    "209.007", "board meeting", "community rules", "property code chapter 209"
  ];
  
  const lowerText = text.toLowerCase();
  return hoaKeywords.some(keyword => lowerText.includes(keyword));
};
