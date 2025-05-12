
// Helper function to extract a section from the analysis content
export function extractSection(content: string, sectionName: string): string {
  if (!content) return '';
  
  const regex = new RegExp(`\\*\\*${sectionName}:\\*\\*([\\s\\S]*?)(?=\\*\\*|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

// Simple function to extract potential named entities
export function extractNamedEntities(text: string): string[] {
  if (!text) return [];
  
  const entities: string[] = [];
  const matches = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g) || [];
  
  // Filter out common irrelevant entities and duplicates
  return [...new Set(matches.filter(entity => 
    entity.length > 5 && 
    !entity.includes("Texas") && 
    !entity.includes("Attorney") &&
    !entity.includes("Court")
  ))];
}
