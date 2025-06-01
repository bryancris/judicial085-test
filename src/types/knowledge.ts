
// Type definitions for document data
export interface DocumentMetadata {
  id: string;
  title: string | null;
  url: string | null;
  created_at: string | null;
  schema: string | null;
  case_id?: string | null;
  client_id?: string | null;
  include_in_analysis?: boolean;
}

export interface DocumentContent {
  id: number;
  content: string | null;
  metadata: any; // Using 'any' for metadata since it can have various structures
  embedding?: string | null;
}

// Define a more specific type for document metadata to fix TypeScript errors
export interface DocumentMetadataDetail {
  file_id?: string;
  file_title?: string;
  title?: string;
  file_path?: string;
  created_at?: string;
  case_id?: string;
  client_id?: string;
  include_in_analysis?: boolean;
  [key: string]: any; // Allow for other properties that might exist
}

export interface DocumentWithContent extends DocumentMetadata {
  contents: DocumentContent[];
  fetchError?: string | null; // Track if there was an error fetching content
}

// Interface for document search results
export interface DocumentSearchResult {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string | null;
  metadata: any;
  similarity: number;
  case_id?: string | null;
}

// Interface for case document
export interface CaseDocument extends DocumentWithContent {
  case_id: string;
  case_title?: string;
}
