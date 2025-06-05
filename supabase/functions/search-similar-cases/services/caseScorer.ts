
import { ScoredCase } from "../types/agentTypes.ts";
import { OpenAIAssistantService } from "./openaiAssistantService.ts";

export class CaseScorer {
  private assistantService: OpenAIAssistantService;

  constructor(openaiApiKey: string) {
    this.assistantService = new OpenAIAssistantService(openaiApiKey);
  }

  async scoreCaseRelevance(originalCase: string, foundCases: any[]): Promise<ScoredCase[]> {
    const scoredCases: ScoredCase[] = [];

    for (const foundCase of foundCases.slice(0, 10)) { // Limit to 10 cases for performance
      try {
        const prompt = `Score the relevance of this found case to the original case on a scale of 0-100:

ORIGINAL CASE:
${originalCase.substring(0, 2000)}

FOUND CASE:
Title: ${foundCase.clientName || foundCase.title}
Facts: ${foundCase.relevantFacts}
Outcome: ${foundCase.outcome}
Court: ${foundCase.court}

Provide:
1. A relevance score (0-100)
2. Brief reasoning for the score

SCORING GUIDELINES (UPDATED - MORE LENIENT):
- 70-100: Very similar legal issues and fact patterns
- 50-69: Similar legal concepts with some factual differences
- 30-49: Related legal areas with different facts
- 15-29: Some legal similarity but mostly different
- 0-14: Unrelated cases

Be more generous with scoring - cases dealing with similar legal concepts (like negligence, liability, premises issues) should score at least 30+ even if specific facts differ.

Format: SCORE: [number] REASONING: [explanation]`;

        try {
          const content = await this.assistantService.runAssistantAnalysis(prompt);
          const scoreMatch = content.match(/SCORE:\s*(\d+)/i);
          const reasoningMatch = content.match(/REASONING:\s*(.*?)$/is);
          
          const score = scoreMatch ? parseInt(scoreMatch[1]) : 30; // Default to 30 instead of 40
          const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Score assigned by agent';

          console.log(`📊 Case "${foundCase.clientName}" scored: ${score} - ${reasoning.substring(0, 100)}...`);

          scoredCases.push({
            case: foundCase,
            relevanceScore: score,
            reasoning: reasoning
          });
        } catch (error) {
          console.error(`Error scoring case ${foundCase.clientName}:`, error);
          // Add with default score of 30 instead of 40
          scoredCases.push({
            case: foundCase,
            relevanceScore: 30,
            reasoning: 'Error in scoring - default assigned'
          });
        }
      } catch (error) {
        console.error(`Error processing case ${foundCase.clientName}:`, error);
        scoredCases.push({
          case: foundCase,
          relevanceScore: 30,
          reasoning: 'Error in processing - default assigned'
        });
      }
    }

    // Sort by relevance score descending and log results
    const sortedCases = scoredCases.sort((a, b) => b.relevanceScore - a.relevanceScore);
    console.log(`📊 Scoring complete: ${sortedCases.length} cases scored. Top scores: ${sortedCases.slice(0, 3).map(c => c.relevanceScore).join(', ')}`);
    
    return sortedCases;
  }

  async cleanup(): Promise<void> {
    await this.assistantService.cleanup();
  }
}
