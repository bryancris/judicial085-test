
import { AgentAnalysis } from "../types/agentTypes.ts";

export class AnalysisParser {
  static parseAgentAnalysis(content: string, caseContent: string, caseType?: string): AgentAnalysis {
    console.log('Parsing agent analysis...');
    
    // Extract structured information from the agent's response with improved parsing
    const legalConceptsMatch = content.match(/Legal Concepts?:\s*(.*?)(?:\n|$)/i);
    const factsMatch = content.match(/Key Facts?:\s*(.*?)(?:\n|$)/i);
    const statutesMatch = content.match(/(?:Relevant )?Statutes?:\s*(.*?)(?:\n|$)/i);
    const queriesMatch = content.match(/Search Queries?:\s*(.*?)(?:\n|$)/i);
    const theoryMatch = content.match(/Case Theory:\s*(.*?)(?:\n|$)/i);

    const parseList = (text: string): string[] => {
      if (!text) return [];
      
      return text.split(/[,\n]/)
        .map(item => item.trim())
        .filter(item => {
          // Filter out empty items, markdown formatting, and invalid characters
          return item.length > 0 && 
                 !item.match(/^\*+$/) && 
                 !item.match(/^-+$/) && 
                 !item.match(/^\d+\.?\s*$/) &&
                 item !== "**" &&
                 item.length < 200; // Reasonable length limit
        })
        .slice(0, 10); // Limit to 10 items
    };

    let analysis = {
      legalConcepts: legalConceptsMatch ? parseList(legalConceptsMatch[1]) : [],
      keyFacts: factsMatch ? parseList(factsMatch[1]) : [],
      relevantStatutes: statutesMatch ? parseList(statutesMatch[1]) : [],
      searchQueries: queriesMatch ? parseList(queriesMatch[1]) : [],
      caseTheory: theoryMatch ? theoryMatch[1].trim() : ''
    };

    // FALLBACK: If agent parsing failed or produced invalid queries, generate backup searches
    if (analysis.searchQueries.length === 0 || analysis.searchQueries.some(q => q.includes("**") || q.length < 3)) {
      console.log('⚠️ Agent parsing failed or produced invalid queries, generating fallback searches...');
      analysis.searchQueries = this.generateFallbackSearchQueries(caseContent, caseType, analysis.legalConcepts, analysis.keyFacts);
    }

    // Ensure we have at least some basic legal concepts if none were extracted
    if (analysis.legalConcepts.length === 0) {
      analysis.legalConcepts = this.extractBasicLegalConcepts(caseContent, caseType);
    }

    console.log('✅ Parsed analysis:', {
      legalConcepts: analysis.legalConcepts.length,
      keyFacts: analysis.keyFacts.length,
      relevantStatutes: analysis.relevantStatutes.length,
      searchQueries: analysis.searchQueries.length,
      caseTheory: analysis.caseTheory.length > 0
    });

    console.log('🔍 Generated search queries:', analysis.searchQueries);

    return analysis;
  }

  private static generateFallbackSearchQueries(caseContent: string, caseType?: string, legalConcepts?: string[], keyFacts?: string[]): string[] {
    console.log('🔄 Generating fallback search queries...');
    
    const queries: string[] = [];
    const lowerContent = caseContent.toLowerCase();
    const normalizedType = (caseType || "").toLowerCase().replace(/[-_\s]/g, "");

    // For premises liability cases
    if (normalizedType.includes("premises") || normalizedType.includes("general") ||
        lowerContent.includes("slip") || lowerContent.includes("fall") ||
        lowerContent.includes("store") || lowerContent.includes("premises")) {
      queries.push("premises liability Texas");
      queries.push("slip and fall negligence");
      queries.push("dangerous condition liability");
      queries.push("store owner duty care");
    }

    // For consumer protection cases
    if (normalizedType.includes("consumer") || lowerContent.includes("dtpa") || lowerContent.includes("deceptive")) {
      queries.push("DTPA Texas consumer protection");
      queries.push("deceptive trade practices");
    }

    // For personal injury cases
    if (normalizedType.includes("personal") || normalizedType.includes("injury") || lowerContent.includes("negligence")) {
      queries.push("personal injury negligence Texas");
      queries.push("liability damages");
    }

    // For animal protection cases
    if (normalizedType.includes("animal") || lowerContent.includes("animal") || lowerContent.includes("pet")) {
      queries.push("animal cruelty Texas Penal Code");
      queries.push("pet boarding negligence liability");
    }

    // Generic fallback if no specific type detected
    if (queries.length === 0) {
      queries.push("negligence liability Texas");
      queries.push("civil liability damages");
      queries.push("tort law Texas");
    }

    // Add from extracted concepts if available
    if (legalConcepts && legalConcepts.length > 0) {
      const conceptQuery = legalConcepts.slice(0, 2).join(" ") + " Texas";
      if (!queries.includes(conceptQuery)) {
        queries.push(conceptQuery);
      }
    }

    console.log(`✅ Generated ${queries.length} fallback search queries:`, queries);
    return queries.slice(0, 5); // Limit to 5 queries
  }

  private static extractBasicLegalConcepts(caseContent: string, caseType?: string): string[] {
    const concepts: string[] = [];
    const lowerContent = caseContent.toLowerCase();
    const normalizedType = (caseType || "").toLowerCase();

    // Extract based on content analysis
    if (lowerContent.includes("premises") || lowerContent.includes("slip") || lowerContent.includes("fall")) {
      concepts.push("premises liability", "negligence", "duty of care");
    }
    
    if (lowerContent.includes("negligence")) {
      concepts.push("negligence", "liability");
    }
    
    if (lowerContent.includes("contract")) {
      concepts.push("contract law", "breach of contract");
    }
    
    if (lowerContent.includes("dtpa") || lowerContent.includes("deceptive")) {
      concepts.push("consumer protection", "deceptive trade practices");
    }

    // Fallback based on case type
    if (concepts.length === 0) {
      if (normalizedType.includes("premises")) {
        concepts.push("premises liability", "negligence");
      } else if (normalizedType.includes("consumer")) {
        concepts.push("consumer protection", "DTPA");
      } else {
        concepts.push("liability", "negligence");
      }
    }

    return concepts;
  }
}
