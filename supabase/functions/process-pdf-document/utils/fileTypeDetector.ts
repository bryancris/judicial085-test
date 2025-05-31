
// File type detection utility

export function detectFileType(fileName: string, mimeType?: string, fileData?: Uint8Array): string {
  // Check by MIME type first
  if (mimeType) {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return 'docx';
    if (mimeType.includes('text/plain')) return 'txt';
  }
  
  // Check by file extension
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension === 'pdf') return 'pdf';
  if (extension === 'docx') return 'docx';
  if (extension === 'txt') return 'txt';
  
  // Check by file signature (magic bytes)
  if (fileData && fileData.length > 4) {
    const signature = Array.from(fileData.slice(0, 8))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (signature.startsWith('25504446')) return 'pdf'; // %PDF
    if (signature.startsWith('504b0304')) return 'docx'; // ZIP signature (DOCX is ZIP-based)
  }
  
  // Default fallback
  console.warn(`⚠️ Could not detect file type for ${fileName}, defaulting to PDF`);
  return 'pdf';
}
