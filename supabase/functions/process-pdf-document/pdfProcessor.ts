// Extract text from PDF buffer using a Deno-compatible approach
export async function extractTextFromPdfBuffer(pdfData: Uint8Array): Promise<string> {
  try {
    console.log('Starting PDF text extraction...');
    
    // Try to use pdf2pic or a simpler text extraction method
    // For now, let's use a basic approach with pdf-lib which is more Deno-friendly
    const { PDFDocument } = await import('https://cdn.skypack.dev/pdf-lib@1.17.1');
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();
    
    console.log(`PDF loaded successfully with ${pages.length} pages`);
    
    let fullText = '';
    
    // For pdf-lib, we need to use a different approach since it doesn't have built-in text extraction
    // Let's try a workaround using a different library
    try {
      // Use pdf-parse with a fallback approach
      const response = await fetch('https://deno.land/x/pdf_parse@1.0.0/mod.ts');
      if (response.ok) {
        const { default: pdfParse } = await import('https://deno.land/x/pdf_parse@1.0.0/mod.ts');
        const data = await pdfParse(pdfData);
        
        if (data.text && data.text.trim()) {
          const rawText = data.text.trim();
          console.log(`Raw extracted text length: ${rawText.length}`);
          
          // Clean and filter the extracted text
          fullText = cleanExtractedText(rawText);
          
          if (fullText && fullText.length > 50) {
            console.log(`Successfully extracted and cleaned ${fullText.length} characters from ${data.numpages} pages`);
            return fullText;
          }
        }
      }
    } catch (parseError) {
      console.warn('pdf-parse failed, trying alternative approach:', parseError);
    }
    
    // Fallback: Try to extract basic text information from PDF structure
    // This is a very basic approach but should work for simple PDFs
    const pdfBytes = Array.from(pdfData);
    const pdfString = String.fromCharCode(...pdfBytes);
    
    // Look for text content patterns in the PDF
    const textMatches = pdfString.match(/\((.*?)\)/g);
    if (textMatches && textMatches.length > 0) {
      const extractedText = textMatches
        .map(match => match.slice(1, -1)) // Remove parentheses
        .filter(text => text.length > 1 && /[a-zA-Z]/.test(text)) // Filter out non-text
        .join(' ')
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      fullText = cleanExtractedText(extractedText);
    }
    
    if (!fullText || fullText.length < 20) {
      // Try another pattern for text extraction with better filtering
      const streamMatches = pdfString.match(/stream\s*(.*?)\s*endstream/gs);
      if (streamMatches) {
        const textContent = streamMatches
          .map(match => {
            // Extract readable text from stream content
            const content = match.replace(/^stream\s*|\s*endstream$/g, '');
            return content.replace(/[^\x20-\x7E]/g, ' '); // Keep only printable ASCII
          })
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        const cleanedContent = cleanExtractedText(textContent);
        if (cleanedContent.length > fullText.length) {
          fullText = cleanedContent;
        }
      }
    }
    
    if (!fullText || fullText.length < 20) {
      throw new Error('PDF contains no extractable readable text content');
    }
    
    // Final sanitization
    fullText = sanitizeText(fullText);
    
    console.log(`Successfully extracted ${fullText.length} characters using fallback method`);
    return fullText;
    
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    
    if (error.message?.includes('Invalid PDF')) {
      throw new Error('The uploaded file appears to be corrupted or not a valid PDF.');
    } else if (error.message?.includes('Password')) {
      throw new Error('Password-protected PDFs are not supported.');
    } else if (error.message?.includes('no extractable text')) {
      throw new Error('PDF contains no extractable text content. This may be a scanned document or image-based PDF.');
    } else {
      throw new Error('Failed to extract text from PDF file. Please ensure the file is a valid, readable PDF.');
    }
  }
}

// Clean extracted text to remove technical metadata and encoded content
function cleanExtractedText(rawText: string): string {
  if (!rawText) return '';
  
  console.log('Cleaning extracted text...');
  
  // Remove common PDF metadata patterns
  let cleanText = rawText
    // Remove Mozilla/browser user agent strings
    .replace(/Mozilla\/[\d.]+\s*\\[^\\]*\\[^\\]*\s*/gi, '')
    // Remove email metadata patterns
    .replace(/mailto:[^\s]+/gi, '')
    // Remove node references (like node00065288 node00065289)
    .replace(/node\d{8,}\s*/gi, '')
    // Remove URLs and technical identifiers
    .replace(/https?:\/\/[^\s]+/gi, '')
    // Remove encoded strings with lots of special characters
    .replace(/[^\w\s.,!?;:()\-'"]+/g, ' ')
    // Remove strings that are mostly numbers and special characters
    .replace(/\b[\d\W]{10,}\b/g, ' ')
    // Remove single characters surrounded by spaces (artifacts)
    .replace(/\s[a-zA-Z]\s/g, ' ')
    // Remove excessive punctuation
    .replace(/[.,;:!?]{3,}/g, '. ')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  // Filter out lines that are mostly technical garbage
  const lines = cleanText.split(/[\r\n]+/);
  const meaningfulLines = lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed.length < 3) return false;
    
    // Skip lines that are mostly special characters or numbers
    const alphaCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    const totalChars = trimmed.length;
    
    // Keep lines that are at least 30% alphabetic characters
    return alphaCount / totalChars >= 0.3;
  });
  
  cleanText = meaningfulLines.join(' ').trim();
  
  // If we still have very little meaningful content, try a different approach
  if (cleanText.length < 50) {
    // Look for email-like patterns in the original text
    const emailPatterns = rawText.match(/(?:from|to|subject|date)[:\s]+([^\n\r]+)/gi);
    if (emailPatterns && emailPatterns.length > 0) {
      cleanText = emailPatterns.join(' ').replace(/[^\w\s.,!?;:()\-'"]/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }
  
  console.log(`Text cleaning: ${rawText.length} -> ${cleanText.length} characters`);
  
  return cleanText;
}

// Sanitize text to remove problematic Unicode characters
function sanitizeText(text: string): string {
  return text
    // Replace null bytes and other control characters
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
    // Replace problematic Unicode characters that might cause issues
    .replace(/[\uFEFF\uFFFE\uFFFF]/g, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Estimate token count (rough approximation: 1 token ≈ 4 characters)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

// Improved chunking with character-based splitting and overlap
export function chunkDocument(content: string): string[] {
  // Target chunk size in characters (aiming for ~600-800 tokens max)
  const MAX_CHUNK_CHARS = 2400; // ~600 tokens
  const OVERLAP_CHARS = 200;    // ~50 tokens overlap
  const MIN_CHUNK_CHARS = 100;  // Minimum viable chunk size
  
  console.log(`Starting chunking for ${content.length} characters`);
  
  // Sanitize content first
  content = sanitizeText(content);
  
  const chunks: string[] = [];
  
  // First try paragraph-based chunking for better semantic boundaries
  const paragraphs = content.split(/\n\s*\n/);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;
    
    // If this paragraph alone is too large, we need to split it
    if (trimmedParagraph.length > MAX_CHUNK_CHARS) {
      // Save current chunk if it has content
      if (currentChunk.trim()) {
        const sanitizedChunk = sanitizeText(currentChunk.trim());
        chunks.push(sanitizedChunk);
        console.log(`Created chunk ${chunks.length} with ${sanitizedChunk.length} chars (~${estimateTokenCount(sanitizedChunk)} tokens)`);
      }
      
      // Split the large paragraph into smaller chunks
      const subChunks = splitLargeParagraph(trimmedParagraph, MAX_CHUNK_CHARS, OVERLAP_CHARS);
      chunks.push(...subChunks);
      currentChunk = '';
      continue;
    }
    
    // Check if adding this paragraph would exceed the limit
    const potentialChunk = currentChunk ? currentChunk + '\n\n' + trimmedParagraph : trimmedParagraph;
    
    if (potentialChunk.length > MAX_CHUNK_CHARS && currentChunk.length > MIN_CHUNK_CHARS) {
      // Save current chunk and start new one with overlap
      const sanitizedChunk = sanitizeText(currentChunk.trim());
      chunks.push(sanitizedChunk);
      console.log(`Created chunk ${chunks.length} with ${sanitizedChunk.length} chars (~${estimateTokenCount(sanitizedChunk)} tokens)`);
      
      // Start new chunk with overlap from the end of the previous chunk
      const overlapText = getOverlapText(currentChunk, OVERLAP_CHARS);
      currentChunk = overlapText ? overlapText + '\n\n' + trimmedParagraph : trimmedParagraph;
    } else {
      currentChunk = potentialChunk;
    }
  }
  
  // Add the final chunk if it has content
  if (currentChunk.trim() && currentChunk.length >= MIN_CHUNK_CHARS) {
    const sanitizedChunk = sanitizeText(currentChunk.trim());
    chunks.push(sanitizedChunk);
    console.log(`Created final chunk ${chunks.length} with ${sanitizedChunk.length} chars (~${estimateTokenCount(sanitizedChunk)} tokens)`);
  }
  
  // Fallback: if we couldn't create good chunks, use character-based splitting
  if (chunks.length === 0) {
    console.warn('Paragraph-based chunking failed, falling back to character-based chunking');
    return characterBasedChunking(content, MAX_CHUNK_CHARS, OVERLAP_CHARS);
  }
  
  // Validate all chunks are within token limits and properly sanitized
  const validatedChunks = chunks
    .map(chunk => sanitizeText(chunk))
    .filter(chunk => {
      const tokenCount = estimateTokenCount(chunk);
      if (tokenCount > 800) {
        console.warn(`Chunk too large (${tokenCount} tokens), skipping`);
        return false;
      }
      return chunk.length > 0;
    });
  
  console.log(`Successfully created ${validatedChunks.length} chunks`);
  return validatedChunks;
}

// Split a large paragraph into smaller chunks
function splitLargeParagraph(paragraph: string, maxChars: number, overlapChars: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < paragraph.length) {
    let end = start + maxChars;
    
    // If we're not at the end, try to find a good breaking point
    if (end < paragraph.length) {
      // Look for sentence endings first
      const sentenceEnd = paragraph.lastIndexOf('.', end);
      const questionEnd = paragraph.lastIndexOf('?', end);
      const exclamationEnd = paragraph.lastIndexOf('!', end);
      
      const bestSentenceEnd = Math.max(sentenceEnd, questionEnd, exclamationEnd);
      
      if (bestSentenceEnd > start + (maxChars * 0.5)) {
        end = bestSentenceEnd + 1;
      } else {
        // Look for word boundaries
        const spaceIndex = paragraph.lastIndexOf(' ', end);
        if (spaceIndex > start + (maxChars * 0.5)) {
          end = spaceIndex;
        }
      }
    }
    
    const chunk = sanitizeText(paragraph.slice(start, end).trim());
    if (chunk) {
      chunks.push(chunk);
      console.log(`Created sub-chunk with ${chunk.length} chars (~${estimateTokenCount(chunk)} tokens)`);
    }
    
    // Move start position with overlap
    start = Math.max(start + 1, end - overlapChars);
  }
  
  return chunks;
}

// Get overlap text from the end of a chunk
function getOverlapText(text: string, overlapChars: number): string {
  if (text.length <= overlapChars) return text;
  
  const overlapStart = text.length - overlapChars;
  // Try to start at a word boundary
  const spaceIndex = text.indexOf(' ', overlapStart);
  const actualStart = spaceIndex !== -1 ? spaceIndex + 1 : overlapStart;
  
  return text.slice(actualStart);
}

// Character-based chunking as fallback
function characterBasedChunking(content: string, maxChars: number, overlapChars: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < content.length) {
    let end = Math.min(start + maxChars, content.length);
    
    // Try to end at a word boundary if not at the end
    if (end < content.length) {
      const spaceIndex = content.lastIndexOf(' ', end);
      if (spaceIndex > start + (maxChars * 0.5)) {
        end = spaceIndex;
      }
    }
    
    const chunk = sanitizeText(content.slice(start, end).trim());
    if (chunk) {
      chunks.push(chunk);
      console.log(`Created fallback chunk with ${chunk.length} chars (~${estimateTokenCount(chunk)} tokens)`);
    }
    
    start = Math.max(start + 1, end - overlapChars);
  }
  
  return chunks;
}
