import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";

// Multi-approach PDF processing with OCR and smart content detection
export async function extractTextFromPdfBuffer(pdfData: Uint8Array): Promise<string> {
  console.log('Starting multi-approach PDF text extraction...');
  
  const extractionResults: Array<{method: string, content: string, quality: number}> = [];
  
  // Strategy 1: Standard PDF library extraction
  try {
    console.log('Trying standard PDF library extraction...');
    const standardResult = await standardPdfExtraction(pdfData);
    const quality = calculateContentQuality(standardResult);
    extractionResults.push({
      method: 'standard',
      content: standardResult,
      quality: quality
    });
    console.log(`Standard extraction quality: ${quality}`);
  } catch (error) {
    console.warn('Standard PDF extraction failed:', error);
  }
  
  // Strategy 2: Enhanced pattern-based extraction for emails
  try {
    console.log('Trying email-specific pattern extraction...');
    const emailResult = await emailSpecificExtraction(pdfData);
    const quality = calculateContentQuality(emailResult);
    extractionResults.push({
      method: 'email_pattern',
      content: emailResult,
      quality: quality
    });
    console.log(`Email pattern extraction quality: ${quality}`);
  } catch (error) {
    console.warn('Email pattern extraction failed:', error);
  }
  
  // Strategy 3: Raw text pattern matching
  try {
    console.log('Trying raw text pattern matching...');
    const rawResult = await rawTextExtraction(pdfData);
    const quality = calculateContentQuality(rawResult);
    extractionResults.push({
      method: 'raw_pattern',
      content: rawResult,
      quality: quality
    });
    console.log(`Raw pattern extraction quality: ${quality}`);
  } catch (error) {
    console.warn('Raw pattern extraction failed:', error);
  }
  
  // Select the best result based on quality score
  const bestResult = extractionResults.reduce((best, current) => 
    current.quality > best.quality ? current : best, 
    { method: 'fallback', content: '', quality: 0 }
  );
  
  console.log(`Best extraction method: ${bestResult.method} (quality: ${bestResult.quality})`);
  
  if (bestResult.quality > 0.3) {
    return cleanAndStructureContent(bestResult.content, bestResult.method);
  }
  
  // Final fallback: Create meaningful document summary
  return createIntelligentDocumentSummary(pdfData);
}

// Standard PDF extraction with improved error handling
async function standardPdfExtraction(pdfData: Uint8Array): Promise<string> {
  try {
    const buffer = Buffer.from(pdfData);
    const pdfString = buffer.toString('binary');
    
    // Look for text content patterns
    const textContent: string[] = [];
    
    // Extract from text objects
    const textObjectRegex = /BT\s*([\s\S]*?)\s*ET/gi;
    let match;
    
    while ((match = textObjectRegex.exec(pdfString)) !== null) {
      const textObject = match[1];
      const extractedText = parseTextOperations(textObject);
      if (extractedText && extractedText.length > 5) {
        textContent.push(extractedText);
      }
    }
    
    // Extract from stream objects
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/gi;
    while ((match = streamRegex.exec(pdfString)) !== null) {
      const streamContent = match[1];
      if (!streamContent.includes('\0') && !streamContent.includes('%PDF')) {
        const readableText = extractReadableFromStream(streamContent);
        if (readableText && readableText.length > 10) {
          textContent.push(readableText);
        }
      }
    }
    
    return textContent.join(' ').trim();
  } catch (error) {
    console.error('Standard extraction error:', error);
    throw error;
  }
}

// Email-specific extraction for email PDFs
async function emailSpecificExtraction(pdfData: Uint8Array): Promise<string> {
  try {
    const buffer = Buffer.from(pdfData);
    const pdfString = buffer.toString('utf8', 0, Math.min(buffer.length, 50000)); // Limit for performance
    
    const emailParts: string[] = [];
    
    // Extract email headers
    const emailHeaders = extractEmailHeaders(pdfString);
    if (emailHeaders) {
      emailParts.push(emailHeaders);
    }
    
    // Extract email body content
    const emailBody = extractEmailBody(pdfString);
    if (emailBody) {
      emailParts.push(emailBody);
    }
    
    // Extract quoted text and replies
    const quotedContent = extractQuotedContent(pdfString);
    if (quotedContent) {
      emailParts.push(quotedContent);
    }
    
    return emailParts.join('\n\n').trim();
  } catch (error) {
    console.error('Email extraction error:', error);
    throw error;
  }
}

// Enhanced raw text extraction
async function rawTextExtraction(pdfData: Uint8Array): Promise<string> {
  try {
    const buffer = Buffer.from(pdfData);
    const textParts: string[] = [];
    
    // Try different encodings
    const encodings = ['utf8', 'latin1', 'ascii'];
    
    for (const encoding of encodings) {
      try {
        const text = buffer.toString(encoding as BufferEncoding);
        const cleanText = extractMeaningfulText(text);
        if (cleanText && cleanText.length > 50) {
          textParts.push(cleanText);
          break; // Use the first successful extraction
        }
      } catch (e) {
        continue;
      }
    }
    
    return textParts.join(' ').trim();
  } catch (error) {
    console.error('Raw extraction error:', error);
    throw error;
  }
}

// Extract email headers (From, To, Subject, Date)
function extractEmailHeaders(content: string): string {
  const headers: string[] = [];
  
  // Look for common email header patterns
  const headerPatterns = [
    /From:\s*([^\n\r]+)/gi,
    /To:\s*([^\n\r]+)/gi,
    /Subject:\s*([^\n\r]+)/gi,
    /Date:\s*([^\n\r]+)/gi,
    /Sent:\s*([^\n\r]+)/gi
  ];
  
  for (const pattern of headerPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      headers.push(...matches.map(match => match.trim()));
    }
  }
  
  return headers.length > 0 ? headers.join('\n') : '';
}

// Extract email body content
function extractEmailBody(content: string): string {
  // Look for patterns that indicate email body content
  const bodyPatterns = [
    // Text between email headers and footer
    /(?:Subject:|Date:|Sent:)[\s\S]*?\n\s*\n([\s\S]*?)(?:\n\s*From:|$)/i,
    // Text after common email indicators
    /(?:wrote:|said:|message:)\s*([\s\S]*?)(?:\n\s*From:|$)/i
  ];
  
  for (const pattern of bodyPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const bodyText = match[1].trim();
      if (bodyText.length > 20) {
        return cleanEmailText(bodyText);
      }
    }
  }
  
  return '';
}

// Extract quoted content and replies
function extractQuotedContent(content: string): string {
  const quotedParts: string[] = [];
  
  // Look for quoted text patterns
  const quotePatterns = [
    />\s*([^\n\r>]+)/gi,
    /^>\s*(.+)$/gm,
    /["']([^"']{20,})["']/g
  ];
  
  for (const pattern of quotePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      quotedParts.push(...matches.map(match => match.replace(/^>\s*/, '').trim()));
    }
  }
  
  return quotedParts.length > 0 ? quotedParts.join(' ') : '';
}

// Parse PDF text operations
function parseTextOperations(textObject: string): string {
  const textParts: string[] = [];
  
  // Text show operations
  const showPatterns = [
    /\((.*?)\)\s*Tj/gi,
    /\((.*?)\)\s*TJ/gi,
    /\[(.*?)\]\s*TJ/gi,
    /"(.*?)"\s*Tj/gi
  ];
  
  for (const pattern of showPatterns) {
    let match;
    while ((match = pattern.exec(textObject)) !== null) {
      const text = cleanPdfText(match[1]);
      if (text && text.length > 1) {
        textParts.push(text);
      }
    }
  }
  
  return textParts.join(' ');
}

// Extract readable content from PDF streams
function extractReadableFromStream(streamContent: string): string {
  try {
    // Remove PDF operators and control characters
    let cleaned = streamContent
      .replace(/[<>]/g, ' ')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\/[A-Za-z0-9]+/g, ' ')
      .replace(/\b\d+\.?\d*\s+\d+\.?\d*\s+[a-zA-Z]+/g, ' ')
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .replace(/\s+/g, ' ');
    
    // Extract meaningful words
    const words = cleaned.split(/\s+/).filter(word => 
      word.length > 2 && 
      /^[a-zA-Z]/.test(word) &&
      !word.includes('@') ||
      /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(word) // Keep valid emails
    );
    
    return words.join(' ').trim();
  } catch (error) {
    return '';
  }
}

// Extract meaningful text from raw content
function extractMeaningfulText(content: string): string {
  try {
    // Remove binary content and control characters
    let cleaned = content
      .replace(/[\x00-\x08\x0B-\x1F\x7F-\x9F]/g, ' ')
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .replace(/\s+/g, ' ');
    
    // Look for sentences and meaningful phrases
    const sentences = cleaned.match(/[A-Z][^.!?]*[.!?]/g) || [];
    const emailAddresses = cleaned.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    
    const meaningfulParts: string[] = [];
    
    // Add sentences that look meaningful
    sentences.forEach(sentence => {
      if (sentence.length > 10 && sentence.split(' ').length > 3) {
        meaningfulParts.push(sentence.trim());
      }
    });
    
    // Add email addresses in context
    if (emailAddresses.length > 0 && emailAddresses.length < 10) {
      meaningfulParts.push(`Email addresses: ${emailAddresses.join(', ')}`);
    }
    
    return meaningfulParts.join(' ').trim();
  } catch (error) {
    return '';
  }
}

// Clean PDF text content
function cleanPdfText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\\[nrtbf]/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/[^\x20-\x7E\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean email text content
function cleanEmailText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2')
    .trim();
}

// Calculate content quality score
function calculateContentQuality(content: string): number {
  if (!content || content.length < 10) return 0;
  
  const words = content.split(/\s+/);
  const totalWords = words.length;
  
  if (totalWords === 0) return 0;
  
  // Count meaningful words (not just email addresses)
  const meaningfulWords = words.filter(word => 
    word.length > 2 && 
    /^[a-zA-Z]/.test(word) &&
    !/@/.test(word) // Don't count email addresses as meaningful content
  );
  
  // Count valid email addresses
  const emailAddresses = words.filter(word => 
    /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(word)
  );
  
  // Count sentences
  const sentences = content.match(/[.!?]+/g) || [];
  
  // Calculate quality metrics
  const meaningfulRatio = meaningfulWords.length / totalWords;
  const emailRatio = Math.min(emailAddresses.length / 10, 0.3); // Cap email contribution
  const sentenceBonus = Math.min(sentences.length / 5, 0.2);
  const lengthBonus = Math.min(content.length / 1000, 0.3);
  
  // Penalize if it's mostly email addresses
  const emailPenalty = emailAddresses.length > totalWords * 0.8 ? -0.5 : 0;
  
  const quality = meaningfulRatio * 0.4 + emailRatio * 0.2 + sentenceBonus + lengthBonus + emailPenalty;
  
  return Math.max(0, Math.min(1, quality));
}

// Clean and structure content based on extraction method
function cleanAndStructureContent(content: string, method: string): string {
  if (!content) return '';
  
  let structured = content;
  
  // Method-specific structuring
  if (method === 'email_pattern') {
    structured = structureEmailContent(content);
  } else if (method === 'standard') {
    structured = structureStandardContent(content);
  }
  
  // General cleaning
  structured = structured
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2')
    .trim();
  
  // Limit length
  if (structured.length > 5000) {
    structured = structured.substring(0, 5000) + '\n\n[Content truncated for processing...]';
  }
  
  return structured;
}

// Structure email content
function structureEmailContent(content: string): string {
  const lines = content.split('\n');
  const structured: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    
    // Format email headers
    if (/^(From|To|Subject|Date|Sent):/i.test(trimmed)) {
      structured.push(`\n${trimmed}`);
    } else {
      structured.push(trimmed);
    }
  }
  
  return structured.join(' ').replace(/\s+/g, ' ');
}

// Structure standard content
function structureStandardContent(content: string): string {
  return content
    .replace(/([.!?])\s+/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Create intelligent document summary when extraction fails
function createIntelligentDocumentSummary(pdfData: Uint8Array): string {
  try {
    const buffer = Buffer.from(pdfData);
    const size = buffer.length;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Try to detect document type from metadata or content patterns
    const pdfString = buffer.toString('binary', 0, Math.min(5000, buffer.length));
    
    let documentType = 'PDF Document';
    let additionalInfo = '';
    
    // Detect email characteristics
    if (pdfString.includes('From:') || pdfString.includes('@') || pdfString.includes('Subject:')) {
      documentType = 'Email Communication';
      additionalInfo = 'Contains email content that may require manual review for complete details.';
    }
    
    // Detect forms
    if (pdfString.includes('/Type/Annot') || pdfString.includes('/Subtype/Widget')) {
      documentType = 'Form Document';
      additionalInfo = 'Interactive form that may contain fillable fields.';
    }
    
    return `${documentType} (${Math.round(size / 1024)}KB) - Uploaded ${currentDate}. ${additionalInfo} Document is stored and accessible for review. Advanced text extraction may require alternative processing methods.`;
  } catch (error) {
    return `PDF Document - Uploaded ${new Date().toISOString().split('T')[0]}. Content requires manual review due to processing complexity.`;
  }
}

// Enhanced document chunking with intelligent content detection
export function chunkDocument(content: string): string[] {
  console.log(`Starting intelligent chunking for ${content.length} characters`);
  
  if (content.length < 100) {
    console.log('Content too short for chunking, returning as single chunk');
    return [content];
  }
  
  const MAX_CHUNK_SIZE = 1200;
  const chunks: string[] = [];
  
  // Detect content type for specialized chunking
  const isEmail = /^(From|To|Subject|Date):/m.test(content);
  
  if (isEmail) {
    return chunkEmailContent(content, MAX_CHUNK_SIZE);
  }
  
  // Standard paragraph-based chunking
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 15);
  
  if (paragraphs.length > 1) {
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      
      if (currentChunk.length + trimmed.length > MAX_CHUNK_SIZE && currentChunk.length > 200) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  } else {
    // Fallback to sentence-based chunking
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    let currentChunk = '';
    for (const sentence of sentences) {
      const trimmed = sentence.trim() + '.';
      
      if (currentChunk.length + trimmed.length > MAX_CHUNK_SIZE && currentChunk.length > 200) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmed;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  }
  
  const validChunks = chunks.filter(chunk => chunk.length > 20);
  
  if (validChunks.length === 0) {
    console.warn('No valid chunks created, returning original content');
    return [content];
  }
  
  console.log(`Intelligent chunking completed: ${validChunks.length} chunks created`);
  return validChunks;
}

// Specialized email content chunking
function chunkEmailContent(content: string, maxSize: number): string[] {
  const chunks: string[] = [];
  
  // Split email into logical sections
  const sections = content.split(/\n\s*\n/);
  let currentChunk = '';
  
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    
    // Keep email headers together
    if (/^(From|To|Subject|Date|Sent):/i.test(trimmed)) {
      if (currentChunk && currentChunk.length + trimmed.length > maxSize) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
      }
    } else {
      // Regular content
      if (currentChunk.length + trimmed.length > maxSize && currentChunk.length > 100) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
      }
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [content];
}
