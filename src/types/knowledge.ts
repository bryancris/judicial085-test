
// Type definitions for document data
export interface DocumentMetadata {
  id: string;
  title: string | null;
  url: string | null;
  created_at: string | null;
  schema: string | null;
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
  [key: string]: any; // Allow for other properties that might exist
}

export interface DocumentWithContent extends DocumentMetadata {
  contents: DocumentContent[];
  fetchError?: string | null; // Track if there was an error fetching content
}
