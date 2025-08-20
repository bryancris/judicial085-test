import { DocumentWithContent } from "@/types/knowledge";

export type DocumentType = 'pdf' | 'docx' | 'text' | 'unknown';

/**
 * Utility function to detect document type from various sources
 */
export const getDocumentType = (document: DocumentWithContent): DocumentType => {
  // Check metadata file type first
  const metadata = document.contents?.[0]?.metadata;
  if (metadata?.fileType === 'pdf' || metadata?.isPdfDocument) {
    return 'pdf';
  }
  if (metadata?.fileType === 'docx') {
    return 'docx';
  }
  
  // Check URL/title extension
  const url = document.url || document.title || '';
  if (url.toLowerCase().endsWith('.pdf')) {
    return 'pdf';
  }
  if (url.toLowerCase().endsWith('.docx') || url.toLowerCase().endsWith('.doc')) {
    return 'docx';
  }
  
  // Check processing notes for Mammoth.js (Word processor signature)
  const processingNotes = metadata?.processingNotes || '';
  if (processingNotes.includes('Mammoth.js extraction') || processingNotes.includes('Word document')) {
    return 'docx';
  }
  
  // Check if we have structured content (likely text document)
  const content = document.contents?.[0]?.content;
  if (content && content.length > 0) {
    return 'text';
  }
  
  return 'unknown';
};

/**
 * Get appropriate file type badge text
 */
export const getDocumentBadgeText = (docType: DocumentType): string => {
  switch (docType) {
    case 'pdf': return 'PDF';
    case 'docx': return 'DOCX';
    case 'text': return 'Text';
    default: return 'Document';
  }
};

/**
 * Get appropriate action button text
 */
export const getDocumentActionText = (docType: DocumentType): string => {
  switch (docType) {
    case 'pdf': return 'View PDF';
    case 'docx': return 'Download Document';
    default: return 'View Document';
  }
};

/**
 * Check if document can be viewed inline (PDFs) or needs to be downloaded
 */
export const canViewInline = (docType: DocumentType): boolean => {
  return docType === 'pdf';
};