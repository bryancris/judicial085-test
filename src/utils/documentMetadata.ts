
// Document metadata utilities
export const getMetadataProperty = (metadata: any, key: string): any => {
  if (!metadata || typeof metadata !== 'object') return null;
  return metadata[key] || null;
};

export const isPdfDocument = (metadata: any, title?: string): boolean => {
  // Check title for .pdf extension (most reliable)
  if (title && typeof title === 'string' && title.toLowerCase().endsWith('.pdf')) {
    return true;
  }
  
  // Check various metadata indicators
  const blobType = getMetadataProperty(metadata, 'blobType');
  const fileType = getMetadataProperty(metadata, 'file_type');
  const isPdfFlag = getMetadataProperty(metadata, 'isPdfDocument');
  const source = getMetadataProperty(metadata, 'source');
  
  // Check for PDF indicators in metadata
  if (blobType === 'application/pdf' || 
      fileType === 'pdf' || 
      isPdfFlag === true ||
      (source && source.includes('pdf'))) {
    return true;
  }
  
  return false;
};

export const generatePdfUrl = (metadata: any): string | null => {
  const fileId = getMetadataProperty(metadata, 'file_id');
  if (fileId && typeof fileId === 'string') {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }
  
  // Check for existing URL
  const existingUrl = getMetadataProperty(metadata, 'pdfUrl') || 
                     getMetadataProperty(metadata, 'pdf_url') ||
                     getMetadataProperty(metadata, 'url');
  
  return existingUrl || null;
};
