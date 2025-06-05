
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
    const prompt = `Please analyze this case content for similarity searching. Generate BROADER search terms that will find relevant cases in legal databases.

CASE TYPE: ${caseType || 'Unknown'}

CASE CONTENT:
${caseContent}

For this analysis, I need you to focus on generating search terms that practicing attorneys would use to find similar cases. 

IMPORTANT GUIDELINES:
1. For premises liability cases involving slips/falls: Include terms like "premises liability", "slip and fall", "negligence", "dangerous condition", "invitee", "business premises"
2. Use broader legal concepts rather than very specific facts
3. Include relevant Texas statutes and common case citations
4. Generate 5-7 practical search queries that cast a wider net
5. Focus on legal standards and elements rather than specific factual details

CRITICAL: Format your response EXACTLY like this (no bullets, no numbers, no markdown):

Legal Concepts: premises liability, negligence, dangerous condition, duty of care, invitee status
Key Facts: slip and fall, spilled substance, retail store, customer injury, notice requirement
Relevant Statutes: Texas Civil Practice Remedies Code 75.002
Search Queries: premises liability Texas, slip and fall negligence store, dangerous condition notice, invitee duty care, negligence retail establishment
Case Theory: Premises liability case involving store owner duty to maintain safe conditions for business invitees

Focus on terms that will find cases with similar legal issues and standards, even if the specific facts vary.`;

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
