
import "https://deno.land/x/xhr@0.1.0/mod.ts";

export interface AgentAnalysis {
  legalConcepts: string[];
  keyFacts: string[];
  relevantStatutes: string[];
  searchQueries: string[];
  caseTheory: string;
}

export interface ScoredCase {
  case: any;
  relevanceScore: number;
  reasoning: string;
}

export class LegalCaseAgent {
  private openaiApiKey: string;
  private assistantId: string | null = null;

  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey;
  }

  async createAssistant(): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: "Legal Case Similarity Agent",
        instructions: `You are an expert legal research assistant specializing in finding similar cases. Your role is to:

1. ANALYZE legal documents and case facts to extract:
   - Key legal concepts and theories (focus on broad, practical terms)
   - Relevant statutes and regulations
   - Important factual patterns (especially for premises liability cases)
   - Legal issues and claims

2. GENERATE practical search queries for legal databases that focus on:
   - Common legal terminology attorneys actually use
   - Broader legal concepts rather than overly specific technical terms
   - Similar fact patterns (like "slip and fall" for premises liability)
   - Relevant statutory areas

3. EVALUATE case relevance by scoring based on:
   - Legal similarity (60% weight): Similar legal issues, broad legal concepts, general liability theories
   - Factual similarity (30% weight): Similar circumstances and incident types
   - Precedential value (10% weight): Court level and jurisdiction

IMPORTANT GUIDELINES:
- Use broader, more practical legal terms that practicing attorneys would search for
- For premises liability cases, focus on terms like "slip and fall", "premises liability", "negligence"
- Avoid overly technical or narrow search terms
- Generate 3-5 search queries that cast a wider net for finding relevant cases
- Be more inclusive in relevance scoring - cases with similar legal theories should score well even if facts differ

CRITICAL OUTPUT FORMAT REQUIREMENTS:
- Format your response in clear sections with these exact headers:
- Legal Concepts: [list concepts separated by commas]
- Key Facts: [list facts separated by commas]
- Relevant Statutes: [list statutes separated by commas]
- Search Queries: [list queries separated by commas]
- Case Theory: [brief summary]

- DO NOT use bullet points, markdown formatting, or numbered lists
- Each section should have items separated by commas only
- Keep search queries simple and practical
- Example search query: premises liability Texas, slip and fall negligence, dangerous condition liability

Always provide specific, actionable legal analysis with concrete reasoning for your recommendations.`,
        model: "gpt-4o",
        tools: []
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create assistant:', response.status, errorText);
      throw new Error(`Failed to create assistant: ${response.status} - ${errorText}`);
    }

    const assistant = await response.json();
    this.assistantId = assistant.id;
    console.log(`✅ Created assistant with ID: ${assistant.id}`);
    return assistant.id;
  }

  async analyzeCaseForSimilarity(caseContent: string, caseType?: string): Promise<AgentAnalysis> {
    if (!this.assistantId) {
      await this.createAssistant();
    }

    // Create a thread
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({})
    });

    if (!threadResponse.ok) {
      const errorText = await threadResponse.text();
      console.error('Failed to create thread:', threadResponse.status, errorText);
      throw new Error(`Failed to create thread: ${threadResponse.status}`);
    }

    const thread = await threadResponse.json();
    console.log(`✅ Created thread: ${thread.id}`);

    // Add a message to the thread with improved prompt
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: "user",
        content: `Please analyze this case content for similarity searching:

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

Focus on practical terminology that will find cases with similar legal issues, even if the specific facts vary.`
      })
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('Failed to add message:', messageResponse.status, errorText);
      throw new Error(`Failed to add message: ${messageResponse.status}`);
    }

    // Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: this.assistantId
      })
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Failed to start run:', runResponse.status, errorText);
      throw new Error(`Failed to start run: ${runResponse.status}`);
    }

    const run = await runResponse.json();
    console.log(`✅ Started run: ${run.id}`);

    // Wait for completion with proper timeout
    let runStatus = run;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout
    
    while ((runStatus.status === 'in_progress' || runStatus.status === 'queued') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!statusResponse.ok) {
        console.error('Failed to check run status:', statusResponse.status);
        break;
      }

      runStatus = await statusResponse.json();
      console.log(`Run status: ${runStatus.status} (attempt ${attempts})`);
    }

    if (runStatus.status !== 'completed') {
      console.error('Run did not complete successfully:', runStatus.status);
      throw new Error(`Assistant run failed with status: ${runStatus.status}`);
    }

    // Get the messages
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      console.error('Failed to get messages:', messagesResponse.status, errorText);
      throw new Error(`Failed to get messages: ${messagesResponse.status}`);
    }

    const messages = await messagesResponse.json();
    const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');
    
    if (!assistantMessage || !assistantMessage.content || assistantMessage.content.length === 0) {
      console.error('No assistant response received');
      throw new Error('No assistant response received');
    }

    const content = assistantMessage.content[0].text.value;
    console.log('✅ Received assistant response');
    console.log('🔍 Agent Analysis:', content.substring(0, 500) + '...');
    
    // Parse the agent's response to extract structured data
    return this.parseAgentAnalysis(content, caseContent, caseType);
  }

  private parseAgentAnalysis(content: string, caseContent: string, caseType?: string): AgentAnalysis {
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

  private generateFallbackSearchQueries(caseContent: string, caseType?: string, legalConcepts?: string[], keyFacts?: string[]): string[] {
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

  private extractBasicLegalConcepts(caseContent: string, caseType?: string): string[] {
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

  async scoreCaseRelevance(originalCase: string, foundCases: any[]): Promise<ScoredCase[]> {
    if (!this.assistantId) {
      await this.createAssistant();
    }

    const scoredCases: ScoredCase[] = [];

    for (const foundCase of foundCases.slice(0, 10)) { // Limit to 10 cases for performance
      try {
        // Create a thread for scoring
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({})
        });

        if (!threadResponse.ok) {
          console.error(`Failed to create scoring thread for case ${foundCase.clientName}`);
          continue;
        }

        const thread = await threadResponse.json();

        // Add scoring message with more lenient criteria
        await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            role: "user",
            content: `Score the relevance of this found case to the original case on a scale of 0-100:

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

Format: SCORE: [number] REASONING: [explanation]`
          })
        });

        // Run the assistant
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            assistant_id: this.assistantId
          })
        });

        if (!runResponse.ok) {
          console.error(`Failed to start scoring run for case ${foundCase.clientName}`);
          continue;
        }

        const run = await runResponse.json();

        // Wait for completion (simplified)
        let attempts = 0;
        let runStatus = run;
        while ((runStatus.status === 'in_progress' || runStatus.status === 'queued') && attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'OpenAI-Beta': 'assistants=v2'
            }
          });
          
          if (statusResponse.ok) {
            runStatus = await statusResponse.json();
          }
          attempts++;
        }

        if (runStatus.status === 'completed') {
          // Get the response
          const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'OpenAI-Beta': 'assistants=v2'
            }
          });

          if (messagesResponse.ok) {
            const messages = await messagesResponse.json();
            const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');
            
            if (assistantMessage) {
              const content = assistantMessage.content[0].text.value;
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
            }
          }
        }
      } catch (error) {
        console.error(`Error scoring case ${foundCase.clientName}:`, error);
        // Add with default score of 30 instead of 40
        scoredCases.push({
          case: foundCase,
          relevanceScore: 30,
          reasoning: 'Error in scoring - default assigned'
        });
      }
    }

    // Sort by relevance score descending and log results
    const sortedCases = scoredCases.sort((a, b) => b.relevanceScore - a.relevanceScore);
    console.log(`📊 Scoring complete: ${sortedCases.length} cases scored. Top scores: ${sortedCases.slice(0, 3).map(c => c.relevanceScore).join(', ')}`);
    
    return sortedCases;
  }

  async cleanup(): Promise<void> {
    if (this.assistantId) {
      try {
        await fetch(`https://api.openai.com/v1/assistants/${this.assistantId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });
        console.log(`✅ Cleaned up assistant: ${this.assistantId}`);
      } catch (error) {
        console.error('Error cleaning up assistant:', error);
      }
    }
  }
}
