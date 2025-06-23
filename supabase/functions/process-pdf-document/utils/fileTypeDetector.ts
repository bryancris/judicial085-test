// File type detection utility

export function detectFileType(fileName: string, mimeType?: string, fileData?: Uint8Array): string {
  console.log(`🔍 Detecting file type for: ${fileName}`);
  console.log(`  - MIME type: ${mimeType || 'not provided'}`);
  
  // Check by MIME type first (most reliable)
  if (mimeType) {
    if (mimeType.includes('pdf')) {
      console.log('  - Detected as PDF from MIME type');
      return 'pdf';
    }
    if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
      console.log('  - Detected as DOCX from MIME type');
      return 'docx';
    }
    if (mimeType.includes('text/plain')) {
      console.log('  - Detected as TXT from MIME type');
      return 'txt';
    }
  }
  
  // Check by file extension (fallback)
  const extension = fileName.toLowerCase().split('.').pop();
  console.log(`  - File extension: ${extension}`);
  
  if (extension === 'pdf') {
    console.log('  - Detected as PDF from extension');
    return 'pdf';
  }
  if (extension === 'docx') {
    console.log('  - Detected as DOCX from extension');
    return 'docx';
  }
  if (extension === 'txt') {
    console.log('  - Detected as TXT from extension');
    return 'txt';
  }
  
  // Check by file signature (magic bytes) as last resort
  if (fileData && fileData.length > 8) {
    const signature = Array.from(fileData.slice(0, 8))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log(`  - File signature: ${signature}`);
    
    if (signature.startsWith('25504446')) { // %PDF
      console.log('  - Detected as PDF from file signature');
      return 'pdf';
    }
    if (signature.startsWith('504b0304')) { // ZIP signature (DOCX is ZIP-based)
      console.log('  - Detected as DOCX from file signature (ZIP-based)');
      return 'docx';
    }
  }
  
  // Default fallback based on context
  console.warn(`⚠️ Could not reliably detect file type for ${fileName}`);
  
  // If filename suggests Word document, default to docx
  if (fileName.toLowerCase().includes('doc') || fileName.toLowerCase().includes('word')) {
    console.log('  - Defaulting to DOCX based on filename context');
    return 'docx';
  }
  
  // Otherwise default to PDF
  console.log('  - Defaulting to PDF');
  return 'pdf';
}
