
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { AgentAnalysis, ScoredCase } from "../types/agentTypes.ts";
import { OpenAIAssistantService } from "./openaiAssistantService.ts";
import { AnalysisParser } from "./analysisParser.ts";
import { CaseScorer } from "./caseScorer.ts";

export class LegalCaseAgent {
  private assistantService: OpenAIAssistantService;
  private caseScorer: CaseScorer;

  constructor(openaiApiKey: string) {
    this.assistantService = new OpenAIAssistantService(openaiApiKey);
    this.caseScorer = new CaseScorer(openaiApiKey);
  }

  async analyzeCaseForSimilarity(caseContent: string, caseType?: string): Promise<AgentAnalysis> {
    const prompt = `Please analyze this case content for similarity searching:

CASE TYPE: ${caseType || 'Unknown'}

CASE CONTENT:
${caseContent}

I need you to generate BROADER, more practical search terms that will find relevant cases. Focus on:

1. Extract the main legal concepts using terms practicing attorneys would search for
2. Identify the core factual scenario (e.g., if someone slipped and fell, focus on "slip and fall" and "premises liability")
3. List relevant statutes mentioned
4. Generate 3-5 PRACTICAL search queries that cast a wider net

IMPORTANT: For premises liability cases involving slips, falls, or store incidents, make sure to include terms like:
- "slip and fall"
- "premises liability" 
- "negligence"
- "store liability"
- "dangerous condition"

CRITICAL: Format your response EXACTLY like this (no bullets, no numbers, no markdown):

Legal Concepts: premises liability, negligence, dangerous condition, duty of care
Key Facts: slip and fall, wet floor, store premises, customer injury
Relevant Statutes: Texas Civil Practice Remedies Code 75.002
Search Queries: premises liability Texas, slip and fall negligence, store liability dangerous condition, premises duty care Texas, negligence wet floor liability
Case Theory: Premises liability case involving store owner duty to maintain safe conditions

Focus on practical terminology that will find cases with similar legal issues, even if the specific facts vary.`;

    const content = await this.assistantService.runAssistantAnalysis(prompt);
    console.log('✅ Received assistant response');
    console.log('🔍 Agent Analysis:', content.substring(0, 500) + '...');
    
    // Parse the agent's response to extract structured data
    return AnalysisParser.parseAgentAnalysis(content, caseContent, caseType);
  }

  async scoreCaseRelevance(originalCase: string, foundCases: any[]): Promise<ScoredCase[]> {
    return await this.caseScorer.scoreCaseRelevance(originalCase, foundCases);
  }

  async cleanup(): Promise<void> {
    await this.assistantService.cleanup();
    await this.caseScorer.cleanup();
  }
}
