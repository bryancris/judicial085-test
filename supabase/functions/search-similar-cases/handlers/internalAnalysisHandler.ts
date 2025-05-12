
import { supabase } from "../index.ts";
import { extractSection } from "./clientSearchHandler.ts";

// Simple text similarity function based on word overlap
export function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Extract relevant facts from the analysis content
export function extractRelevantFacts(content: string): string {
  if (!content) return "No relevant facts available";
  
  const preliminaryAnalysis = extractSection(content, 'PRELIMINARY ANALYSIS');
  // Take the first 200 characters as a summary
  return preliminaryAnalysis.length > 200 
    ? preliminaryAnalysis.substring(0, 200) + '...'
    : preliminaryAnalysis || "No relevant facts available";
}

// Extract outcome prediction from the analysis content
export function extractOutcomePrediction(content: string): string {
  if (!content) return "No outcome prediction available";
  
  // Look for sentences containing outcome predictions
  const sentences = content.split(/\.\s+/);
  
  const outcomeKeywords = [
    'likely outcome', 'probability', 'chances', 'likelihood', 
    'favorable', 'unfavorable', 'success', 'prevail', 'win', 'lose'
  ];
  
  const outcomeSentences = sentences.filter(sentence => 
    outcomeKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
  );
  
  if (outcomeSentences.length > 0) {
    return outcomeSentences[0].trim() + '.';
  }
  
  // Default outcome if no prediction found
  return "No specific outcome prediction available.";
}

// Process internal analyses to find similar cases
export async function processInternalAnalyses(otherAnalyses: any[], currentSearchDocument: string): Promise<any[]> {
  // Group analyses by client and take the most recent one for each
  const latestAnalysesByClient = otherAnalyses.reduce((acc, analysis) => {
    if (!acc[analysis.client_id] || new Date(analysis.created_at) > new Date(acc[analysis.client_id].created_at)) {
      acc[analysis.client_id] = analysis;
    }
    return acc;
  }, {});

  // For each client, calculate similarity score
  return await Promise.all(
    Object.values(latestAnalysesByClient).map(async (analysis: any) => {
      const relevantLaw = extractSection(analysis.content, 'RELEVANT TEXAS LAW');
      const preliminaryAnalysis = extractSection(analysis.content, 'PRELIMINARY ANALYSIS');
      const issues = extractSection(analysis.content, 'POTENTIAL LEGAL ISSUES');

      const searchDocument = [relevantLaw, preliminaryAnalysis, issues].join(' ');
      
      // Calculate similarity score (simple text-based similarity for now)
      const similarityScore = calculateSimilarity(currentSearchDocument, searchDocument);

      // Get the client details
      const { data: otherClient } = await supabase
        .from('clients')
        .select('first_name, last_name')
        .eq('id', analysis.client_id)
        .single();

      // Get potential outcome prediction from the analysis
      const outcomeText = extractOutcomePrediction(analysis.content);
      
      return {
        source: "internal",
        clientId: analysis.client_id,
        clientName: otherClient ? `${otherClient.first_name} ${otherClient.last_name}` : 'Unknown Client',
        similarity: similarityScore,
        relevantFacts: extractRelevantFacts(analysis.content),
        outcome: outcomeText,
        court: "N/A",
        citation: "Client Case",
        dateDecided: new Date(analysis.created_at).toLocaleDateString(),
        url: null
      };
    })
  );
}
