
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

export interface DocumentWithContent extends DocumentMetadata {
  contents: DocumentContent[];
}
