
import { supabase } from "@/integrations/supabase/client";

// Generate a simple hash for content comparison
export const generateContentHash = (content: string): string => {
  const cleanContent = content.trim().toLowerCase().replace(/\s+/g, ' ');
  let hash = 0;
  for (let i = 0; i < cleanContent.length; i++) {
    const char = cleanContent.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
};

// Check if content already exists in legal analyses with improved logic
export const checkContentDuplicate = async (
  content: string, 
  clientId: string
): Promise<boolean> => {
  try {
    const { data: existingAnalysis, error } = await supabase
      .from("legal_analyses")
      .select("content")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error checking for duplicates:", error);
      return false;
    }

    if (!existingAnalysis || existingAnalysis.length === 0) {
      return false;
    }

    const contentHash = generateContentHash(content);
    const cleanNewContent = content.trim().toLowerCase();
    
    // Check if the exact content or very similar content already exists
    for (const analysis of existingAnalysis) {
      const existingHash = generateContentHash(analysis.content);
      const cleanExistingContent = analysis.content.trim().toLowerCase();
      
      // Check for exact hash match
      if (existingHash === contentHash) {
        console.log("Found exact hash match");
        return true;
      }
      
      // Check if the content is already included in the analysis (substring match)
      if (cleanExistingContent.includes(cleanNewContent) && cleanNewContent.length > 50) {
        console.log("Found substring match for substantial content");
        return true;
      }
      
      if (cleanNewContent.includes(cleanExistingContent) && cleanExistingContent.length > 50) {
        console.log("Found reverse substring match for substantial content");
        return true;
      }

      // Check for similar content patterns (research updates) with improved detection
      if (cleanExistingContent.includes('research update') && cleanNewContent.length > 50) {
        // Extract key legal patterns for comparison
        const existingPatterns = extractLegalPatterns(analysis.content);
        const newPatterns = extractLegalPatterns(content);
        
        // If significant overlap in legal patterns, consider it a duplicate
        const overlap = newPatterns.filter(pattern => 
          existingPatterns.some(existing => 
            existing.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(existing)
          )
        );
        
        if (overlap.length > 0 && overlap.length / Math.max(newPatterns.length, 1) > 0.6) {
          console.log("Found significant legal pattern overlap");
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Error in duplicate check:", error);
    return false;
  }
};

// Extract key legal patterns from content for smarter duplicate detection
export const extractLegalPatterns = (content: string): string[] => {
  const patterns: string[] = [];
  
  // Extract section references
  const sectionMatches = content.match(/§\s*\d+\.\d+/gi);
  if (sectionMatches) {
    patterns.push(...sectionMatches.map(match => match.toLowerCase().trim()));
  }
  
  // Extract code references
  const codeMatches = content.match(/texas\s+business\s+&\s+commerce\s+code[^.]*\./gi);
  if (codeMatches) {
    patterns.push(...codeMatches.map(match => match.toLowerCase().trim()));
  }
  
  // Extract violation patterns
  const violationMatches = content.match(/violation[^.]*\./gi);
  if (violationMatches) {
    patterns.push(...violationMatches.map(match => match.toLowerCase().trim()));
  }
  
  // Extract DTPA references
  const dtpaMatches = content.match(/dtpa[^.]*\./gi);
  if (dtpaMatches) {
    patterns.push(...dtpaMatches.map(match => match.toLowerCase().trim()));
  }
  
  return patterns;
};

// Advanced duplicate detection based on legal patterns
export const checkLegalPatternDuplicate = async (
  content: string, 
  clientId: string
): Promise<boolean> => {
  const newPatterns = extractLegalPatterns(content);
  
  if (newPatterns.length === 0) {
    return false; // No legal patterns to check
  }

  try {
    const { data: existingAnalysis, error } = await supabase
      .from("legal_analyses")
      .select("content")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error || !existingAnalysis || existingAnalysis.length === 0) {
      return false;
    }

    for (const analysis of existingAnalysis) {
      const existingPatterns = extractLegalPatterns(analysis.content);
      
      // Check if significant overlap in legal patterns
      const overlap = newPatterns.filter(pattern => 
        existingPatterns.some(existing => 
          existing.includes(pattern) || pattern.includes(existing)
        )
      );
      
      // If more than 60% of patterns overlap, consider it a duplicate
      if (overlap.length > 0 && overlap.length / newPatterns.length > 0.6) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error in legal pattern duplicate check:", error);
    return false;
  }
};
