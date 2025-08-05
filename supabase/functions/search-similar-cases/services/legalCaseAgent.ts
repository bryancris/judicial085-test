
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
    const prompt = `Please analyze this case content for similarity searching. Pay special attention to the PRELIMINARY ANALYSIS section to understand the core legal issues. Generate BROADER search terms that will find relevant cases in legal databases.

CASE TYPE: ${caseType || 'Unknown'}

CASE CONTENT:
${caseContent}

CRITICAL INSTRUCTIONS:
1. FOCUS HEAVILY on the PRELIMINARY ANALYSIS section - this contains the key legal issues and case theory
2. Extract the main legal concepts from the preliminary analysis (e.g., breach of contract, express warranty, construction defects)
3. For CONTRACT CASES: Include terms like "breach of contract", "express warranty", "construction contract", "material substitution", "contractor liability", "UCC", "Business Commerce Code"
4. For CONSTRUCTION CASES: Include "home renovation", "construction defects", "contractor breach", "material specification", "building contract", "construction warranty"
5. For PREMISES LIABILITY: Include "premises liability", "slip and fall", "negligence", "dangerous condition", "invitee", "business premises"
6. Include relevant Texas statutes (especially UCC sections like 2.313, 1.203, 2.714 for contracts)
7. Generate 5-7 practical search queries that will find similar legal issues
8. Use legal terminology that appears in court opinions and case law

CRITICAL: Format your response EXACTLY like this (no bullets, no numbers, no markdown):

Legal Concepts: breach of contract, express warranty, construction defects, material substitution, good faith obligation
Key Facts: kitchen renovation contract, inferior materials, specification violation, contractor substitution, warranty breach
Relevant Statutes: Texas Business & Commerce Code § 2.313, Texas Business & Commerce Code § 1.203, Texas Business & Commerce Code § 2.714
Search Queries: breach of contract express warranty Texas, construction contract material substitution, home renovation contractor breach, express warranty construction materials, Texas Business Commerce Code warranty
Case Theory: Construction contract breach involving express warranty violation and material substitution

Focus on the core legal issues from the PRELIMINARY ANALYSIS to find cases with similar legal standards and elements.`;

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
