
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
}[]> => {
  try {
    console.log(`Searching for document: "${searchTerm}"`);
    
    // First try to find documents in document_metadata which might have direct PDF URLs
    const { data: metadataResults, error: metadataError } = await supabase
      .from('document_metadata')
      .select('id, title, url')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(3);
    
    if (metadataError) {
      console.error("Error searching document metadata:", metadataError);
    }
    
    // If we found direct metadata with URLs, use those
    if (metadataResults && metadataResults.length > 0) {
      console.log(`Found ${metadataResults.length} direct metadata results with URLs`);
      return metadataResults.map(doc => ({
        id: doc.id,
        title: doc.title || "Texas Law Document",
        url: doc.url
      }));
    }
    
    // Fallback to searching in the documents table
    const { data: documents, error: searchError } = await supabase
      .from('documents')
      .select('id, metadata')
      .textSearch('content', searchTerm, { type: 'plain' })
      .limit(3);

    if (searchError) {
      console.error("Error in text search:", searchError);
      return [];
    }

    console.log(`Found ${documents?.length || 0} documents in content search`);

    // Map the results to the expected format
    return (documents || []).map(doc => {
      const metadata = doc.metadata as DocumentMetadataDetail;
      return {
        id: metadata?.file_id || String(doc.id),
        title: metadata?.title || metadata?.file_title || "Texas Law Document",
        url: metadata?.file_path || null
      };
    });
  } catch (error) {
    console.error("Exception in searchLawDocuments:", error);
    return [];
  }
};
