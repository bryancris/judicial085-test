// Comprehensive Texas Law Vector Search Service
// Provides access to the full Texas law database for legal analysis

import { supabase } from "../supabaseClient.ts";

// Local embedding generation function
async function generateEmbedding(text: string, openaiApiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error: ${response.statusText} - ${errorData}`);
  }
  
  const data = await response.json();
  
  if (!data.data || data.data.length === 0) {
    throw new Error('No embedding data received from OpenAI');
  }
  
  return data.data[0].embedding;
}

/**
 * Extract relevant law reference from content
 */
function extractLawReference(content: string): string | null {
  // Look for Texas statute references
  const texasStatutePattern = /Texas\s+(?:Business & Commerce|Civil Practice & Remedies|Penal|Government|Property|Family|Occupations|Labor|Insurance|Health & Safety|Education|Election|Finance|Human Resources|Local Government|Natural Resources|Parks & Wildlife|Special District|Transportation|Utilities|Water)?\s*Code[\s\S]*?(?:Chapter|§|Section)\s*[\d.]+/i;
  const match = content.match(texasStatutePattern);
  
  if (match) {
    return match[0].trim();
  }
  
  // Look for other legal references
  const generalPattern = /(?:Chapter|§|Section)\s*[\d.]+/i;
  const generalMatch = content.match(generalPattern);
  
  return generalMatch ? generalMatch[0].trim() : null;
}

/**
 * Extract relevant snippet from law content
 */
function extractRelevantSnippet(content: string, searchTerms: string): string {
  if (!content) return "";
  
  // Try to find most relevant section by looking for search terms
  const terms = searchTerms.toLowerCase().split(/\s+/).filter(term => term.length > 3);
  
  if (terms.length === 0) {
    return content.slice(0, 800) + (content.length > 800 ? "..." : "");
  }
  
  // Find the paragraph that contains the most search terms
  const paragraphs = content.split(/\n\s*\n/);
  let bestParagraph = "";
  let maxMatches = 0;
  
  for (const paragraph of paragraphs) {
    const lowerParagraph = paragraph.toLowerCase();
    const matches = terms.filter(term => lowerParagraph.includes(term)).length;
    
    if (matches > maxMatches) {
      maxMatches = matches;
      bestParagraph = paragraph;
    }
  }
  
  if (bestParagraph) {
    return bestParagraph.slice(0, 800) + (bestParagraph.length > 800 ? "..." : "");
  }
  
  return content.slice(0, 800) + (content.length > 800 ? "..." : "");
}

/**
 * Build search query from fact pattern and legal topics
 */
function buildSearchQuery(factPattern: string, extractedTopics: string[]): string {
  // Combine fact pattern with legal topics to create comprehensive search
  const factSnippet = factPattern.slice(0, 300); // Limit fact pattern length
  const topicsString = extractedTopics.join(" ");
  
  return `Texas law ${topicsString} ${factSnippet}`.trim();
}

/**
 * Get relevant Texas laws using vector similarity search
 */
export async function searchRelevantTexasLaw(
  factPattern: string, 
  extractedTopics: string[] = [],
  matchCount: number = 8,
  matchThreshold: number = 0.7
): Promise<any[]> {
  try {
    console.log(`🔍 Searching Texas law database for: ${extractedTopics.join(", ")}`);
    
    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error("OpenAI API key not found for vector search");
      return [];
    }
    
    // Build comprehensive search query
    const searchQuery = buildSearchQuery(factPattern, extractedTopics);
    console.log(`📝 Search query: ${searchQuery.slice(0, 150)}...`);
    
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(searchQuery, openaiApiKey);
    
    // Search the vector database for relevant laws
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter: {} // Could add filters for specific types of law if needed
    });
    
    if (error) {
      console.error("❌ Error searching documents with vector similarity:", error);
      return [];
    }
    
    if (!documents || documents.length === 0) {
      console.log(`⚠️ No vector matches found for topics: ${extractedTopics.join(", ")}`);
      return [];
    }
    
    console.log(`✅ Found ${documents.length} relevant Texas law documents`);
    
    // Format the results for legal analysis
    const formattedResults = documents.map((doc: any, index: number) => {
      const content = doc.content || "";
      const similarity = doc.similarity || 0;
      const citation = extractLawReference(content);
      const snippet = extractRelevantSnippet(content, searchQuery);
      
      return {
        id: `vector-law-${index + 1}`,
        title: citation || `Texas Law Reference ${index + 1}`,
        url: null,
        content: snippet,
        similarity: similarity,
        metadata: {
          source: "vector_search",
          similarity_score: similarity,
          search_terms: extractedTopics
        }
      };
    });
    
    // Log the citations found
    const citations = formattedResults
      .map(r => r.title)
      .filter(t => t !== null);
    console.log(`📚 Law citations found: ${citations.join(", ")}`);
    
    return formattedResults;
    
  } catch (error) {
    console.error("❌ Error in comprehensive Texas law search:", error);
    return [];
  }
}

/**
 * Enhanced legal topic extraction from fact pattern
 */
export function extractLegalTopics(factPattern: string): string[] {
  const topics = [];
  const lowerFacts = factPattern.toLowerCase();
  
  // Contract and Commercial Law
  if (lowerFacts.includes("contract") || lowerFacts.includes("agreement") || lowerFacts.includes("breach")) {
    topics.push("contract law", "breach of contract", "commercial law");
  }
  
  // Tort Law
  if (lowerFacts.includes("injury") || lowerFacts.includes("negligence") || lowerFacts.includes("accident")) {
    topics.push("tort law", "negligence", "personal injury");
  }
  
  // Property Law
  if (lowerFacts.includes("property") || lowerFacts.includes("premises") || lowerFacts.includes("real estate")) {
    topics.push("property law", "premises liability", "real estate");
  }
  
  // Consumer Protection
  if (lowerFacts.includes("consumer") || lowerFacts.includes("deceptive") || lowerFacts.includes("trade practices")) {
    topics.push("consumer protection", "DTPA", "deceptive trade practices");
  }
  
  // Vehicle/Lemon Law
  if (lowerFacts.includes("vehicle") || lowerFacts.includes("car") || lowerFacts.includes("truck") || 
      lowerFacts.includes("lemon") || lowerFacts.includes("warranty") || lowerFacts.includes("repair")) {
    topics.push("lemon law", "vehicle warranty", "Occupations Code 2301", "motor vehicle");
  }
  
  // Employment Law
  if (lowerFacts.includes("employee") || lowerFacts.includes("workplace") || lowerFacts.includes("discrimination")) {
    topics.push("employment law", "labor law", "workplace");
  }
  
  // Family Law
  if (lowerFacts.includes("divorce") || lowerFacts.includes("custody") || lowerFacts.includes("marriage")) {
    topics.push("family law", "divorce", "child custody");
  }
  
  // Criminal Law
  if (lowerFacts.includes("criminal") || lowerFacts.includes("charge") || lowerFacts.includes("arrest")) {
    topics.push("criminal law", "penal code");
  }
  
  // Insurance Law
  if (lowerFacts.includes("insurance") || lowerFacts.includes("claim") || lowerFacts.includes("coverage")) {
    topics.push("insurance law", "insurance claim", "coverage");
  }
  
  // Default to general topics if no specific matches
  if (topics.length === 0) {
    topics.push("Texas law", "civil law", "legal analysis");
  }
  
  console.log(`🏷️ Extracted legal topics: ${topics.join(", ")}`);
  return topics;
}