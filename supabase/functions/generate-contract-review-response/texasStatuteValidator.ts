
import { supabase } from "./supabaseClient.ts";

interface StatuteCitation {
  raw: string;          // The raw citation text
  code: string;         // e.g. "Texas Business & Commerce Code"
  section: string;      // e.g. "17.42"
  displayName: string;  // Formatted display name
}

interface ValidationResult {
  citation: StatuteCitation;
  isValid: boolean;
  confidence: number;   // 0-1 confidence score
  suggestion?: string;  // Suggested correction if invalid
  referenceUrl?: string; // Link to the full statute text if available
}

/**
 * Parse a citation string into structured data
 * @param citationText Raw citation text
 * @returns Structured citation object or null if not a valid format
 */
export function parseStatuteCitation(citationText: string): StatuteCitation | null {
  // Common Texas code citations
  const texasCodePattern = /(?:Texas\s+)?((?:[A-Za-z]+\s+)+(?:&\s+)?(?:[A-Za-z]+\s+)*Code)\s+(?:§|Section)\s+(\d+(?:\.\d+)?)(?:\(([a-z0-9]+)\))?/i;
  const dtpaPattern = /Texas\s+Deceptive\s+Trade\s+Practices\s+Act|DTPA\s+(?:§|Section)\s+(\d+(?:\.\d+)?)(?:\(([a-z0-9]+)\))?/i;
  
  let match = texasCodePattern.exec(citationText);
  if (match) {
    return {
      raw: citationText,
      code: match[1].trim(),
      section: match[2] + (match[3] ? `(${match[3]})` : ""),
      displayName: `${match[1]} § ${match[2]}${match[3] ? `(${match[3]})` : ""}`
    };
  }
  
  match = dtpaPattern.exec(citationText);
  if (match && match[1]) {
    return {
      raw: citationText,
      code: "Texas Deceptive Trade Practices Act",
      section: match[1] + (match[2] ? `(${match[2]})` : ""),
      displayName: `DTPA § ${match[1]}${match[2] ? `(${match[2]})` : ""}`
    };
  }
  
  return null;
}

/**
 * Extract all potential statute citations from text
 * @param text The content to analyze for citations
 * @returns Array of citation strings
 */
export function extractStatuteCitations(text: string): string[] {
  if (!text) return [];
  
  const citations: string[] = [];
  
  // Texas statutes pattern
  const texasStatutePattern = /(Texas\s+[A-Za-z]+(?:\s+[&]?\s*[A-Za-z]+)*\s+Code\s+§\s+\d+\.\d+(?:\(\w+\))?)/g;
  
  // DTPA references with section
  const dtpaPattern = /(Texas\s+Deceptive\s+Trade\s+Practices\s+Act|DTPA)\s+(?:§|Section)\s+(\d+\.\d+(?:\(\w+\))?)/gi;
  
  // Extract statute references
  let match;
  while ((match = texasStatutePattern.exec(text)) !== null) {
    citations.push(match[1]);
  }
  
  // Extract DTPA references
  while ((match = dtpaPattern.exec(text)) !== null) {
    citations.push(`${match[1]} § ${match[2]}`);
  }
  
  // Remove duplicates
  return [...new Set(citations)];
}

/**
 * Validate a single statute citation against the database
 * @param citation The citation to validate
 * @returns Validation result with confidence score
 */
export async function validateStatuteCitation(citation: StatuteCitation): Promise<ValidationResult> {
  try {
    // Search for the citation in our vector database
    const searchQuery = `${citation.code} ${citation.section}`;
    
    // Try exact matching first
    const { data: exactMatches, error: exactError } = await supabase
      .from('documents')
      .select('id, content, metadata')
      .textSearch('content', `'${citation.displayName}'`, { type: 'plain' })
      .limit(1);
      
    if (exactMatches && exactMatches.length > 0) {
      return {
        citation,
        isValid: true,
        confidence: 1.0,
        referenceUrl: exactMatches[0].metadata?.url || null
      };
    }
    
    // Try fuzzy matching if exact match fails
    const { data: fuzzyMatches, error: fuzzyError } = await supabase
      .from('documents')
      .select('id, content, metadata')
      .textSearch('content', searchQuery, { type: 'plain' })
      .limit(3);
      
    if (fuzzyError) {
      console.error("Error searching documents:", fuzzyError);
      return { citation, isValid: false, confidence: 0 };
    }
    
    if (!fuzzyMatches || fuzzyMatches.length === 0) {
      // No matches found
      return { 
        citation, 
        isValid: false, 
        confidence: 0,
        suggestion: findClosestStatute(citation)
      };
    }
    
    // Calculate confidence based on match quality
    // Simple heuristic: if the content contains both code and section, higher confidence
    const bestMatch = fuzzyMatches[0];
    const content = bestMatch.content?.toLowerCase() || "";
    const codePresent = content.includes(citation.code.toLowerCase());
    const sectionPresent = content.includes(citation.section.toLowerCase());
    
    let confidence = 0;
    if (codePresent && sectionPresent) confidence = 0.9;
    else if (codePresent) confidence = 0.6;
    else if (sectionPresent) confidence = 0.5;
    else confidence = 0.3;
    
    return {
      citation,
      isValid: confidence > 0.5, // Consider valid if confidence is high enough
      confidence,
      referenceUrl: bestMatch.metadata?.url || null
    };
  } catch (error) {
    console.error("Error validating citation:", error);
    return { citation, isValid: false, confidence: 0 };
  }
}

/**
 * Find the closest matching statute to an invalid citation
 * @param citation The invalid citation
 * @returns Suggestion string or undefined if no close match
 */
function findClosestStatute(citation: StatuteCitation): string | undefined {
  // This is a simplified version - in production, this would query similar statutes
  // For now, we'll just suggest common codes based on the invalid one
  
  const commonCodes: Record<string, string[]> = {
    "Business": ["Texas Business & Commerce Code", "Texas Business Organizations Code"],
    "Civil": ["Texas Civil Practice & Remedies Code", "Texas Civil Statutes"],
    "Family": ["Texas Family Code"],
    "Property": ["Texas Property Code"],
    "Insurance": ["Texas Insurance Code"]
  };
  
  // Look for word matches in the code
  for (const [key, possibleCodes] of Object.entries(commonCodes)) {
    if (citation.code.includes(key)) {
      return `Did you mean one of these: ${possibleCodes.join(", ")}?`;
    }
  }
  
  return undefined;
}

/**
 * Validate all statute citations in a text
 * @param text Text containing citations to validate
 * @returns Array of validation results for all found citations
 */
export async function validateAllCitations(text: string): Promise<ValidationResult[]> {
  // Extract citations
  const citations = extractStatuteCitations(text);
  
  // Parse and validate each citation
  const validationResults: ValidationResult[] = [];
  
  for (const citationText of citations) {
    const parsed = parseStatuteCitation(citationText);
    if (parsed) {
      const result = await validateStatuteCitation(parsed);
      validationResults.push(result);
    }
  }
  
  return validationResults;
}

/**
 * Enhance text by marking validated citations
 * @param text Original text
 * @param validationResults Validation results for citations
 * @returns Enhanced text with validation markers
 */
export function enhanceTextWithValidation(text: string, validationResults: ValidationResult[]): string {
  let enhancedText = text;
  
  // Process in reverse order to prevent modifying string positions
  const sortedResults = [...validationResults].sort((a, b) => 
    enhancedText.lastIndexOf(b.citation.raw) - enhancedText.lastIndexOf(a.citation.raw));
  
  for (const result of sortedResults) {
    const { citation, isValid, confidence, referenceUrl } = result;
    const { raw } = citation;
    
    // Skip if citation not found in text
    const position = enhancedText.indexOf(raw);
    if (position === -1) continue;
    
    let replacement = raw;
    
    // Add validation markers
    if (isValid) {
      // Valid citation with reference URL
      if (referenceUrl) {
        replacement = `<span class="valid-citation" data-confidence="${confidence.toFixed(2)}" data-url="${referenceUrl}">${raw}</span>`;
      } else {
        replacement = `<span class="valid-citation" data-confidence="${confidence.toFixed(2)}">${raw}</span>`;
      }
    } else {
      // Invalid citation
      replacement = `<span class="invalid-citation" data-confidence="${confidence.toFixed(2)}">${raw}</span>`;
    }
    
    // Replace in text
    enhancedText = enhancedText.replace(raw, replacement);
  }
  
  return enhancedText;
}

/**
 * Get validation CSS classes for the UI
 */
export function getValidationStyles(): string {
  return `
.valid-citation {
  color: #166534;
  border-bottom: 1px solid #16a34a;
  background-color: rgba(22, 163, 74, 0.1);
  padding: 0 2px;
}

.invalid-citation {
  color: #991b1b;
  border-bottom: 1px dotted #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
  padding: 0 2px;
  text-decoration: line-through;
}
  `;
}
