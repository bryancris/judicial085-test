
// Comprehensive Texas Law Search Service using vector database
import { searchRelevantTexasLaw, extractLegalTopics } from "./comprehensiveTexasLawService.ts";

export async function searchRelevantLaw(factPattern: string, extractedTopics: string[] = []) {
  console.log(`🔍 Searching comprehensive Texas law database for: ${extractedTopics.join(", ")}`);
  
  // If no topics provided, extract them from the fact pattern
  const topics = extractedTopics.length > 0 ? extractedTopics : extractLegalTopics(factPattern);
  
  // Use vector search to find relevant Texas laws
  const relevantLaws = await searchRelevantTexasLaw(factPattern, topics);
  
  console.log(`📚 Found ${relevantLaws.length} relevant Texas law references`);
  return relevantLaws;
}
