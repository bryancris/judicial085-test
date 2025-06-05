
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
   - Key legal concepts and theories
   - Relevant statutes and regulations
   - Important factual patterns
   - Legal issues and claims

2. GENERATE sophisticated search queries for legal databases that focus on:
   - Legal precedents and similar holdings
   - Cases with similar fact patterns
   - Relevant statutory interpretations
   - Procedural similarities

3. EVALUATE case relevance by scoring based on:
   - Legal similarity (70% weight): Similar legal issues, statutes, claims
   - Factual similarity (20% weight): Similar circumstances and parties
   - Precedential value (10% weight): Court level and jurisdiction

Always provide specific, actionable legal analysis with concrete reasoning for your recommendations.`,
        model: "gpt-4o",
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_case_for_similarity",
              description: "Analyze a legal case to extract key concepts for similarity search",
              parameters: {
                type: "object",
                properties: {
                  caseContent: {
                    type: "string",
                    description: "The full case content including facts, legal analysis, and client information"
                  },
                  caseType: {
                    type: "string",
                    description: "The type of case (e.g., property-law, consumer-protection, etc.)"
                  }
                },
                required: ["caseContent"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "generate_search_queries",
              description: "Generate multiple sophisticated search queries for legal case databases",
              parameters: {
                type: "object",
                properties: {
                  legalConcepts: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key legal concepts from the case"
                  },
                  statutes: {
                    type: "array", 
                    items: { type: "string" },
                    description: "Relevant statutes and regulations"
                  },
                  keyFacts: {
                    type: "array",
                    items: { type: "string" },
                    description: "Important factual elements"
                  }
                },
                required: ["legalConcepts"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "score_case_relevance",
              description: "Score how relevant a found case is to the original case",
              parameters: {
                type: "object",
                properties: {
                  originalCase: {
                    type: "string",
                    description: "Content of the original case being analyzed"
                  },
                  foundCase: {
                    type: "object",
                    description: "The case found in search results",
                    properties: {
                      title: { type: "string" },
                      facts: { type: "string" },
                      outcome: { type: "string" },
                      court: { type: "string" }
                    }
                  }
                },
                required: ["originalCase", "foundCase"]
              }
            }
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create assistant: ${response.statusText}`);
    }

    const assistant = await response.json();
    this.assistantId = assistant.id;
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

    const thread = await threadResponse.json();

    // Add a message to the thread
    await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
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

I need you to:
1. Extract the key legal concepts, theories, and claims
2. Identify relevant statutes and regulations mentioned
3. Extract the most important factual elements
4. Generate 3-5 sophisticated search queries for finding similar cases
5. Provide a brief case theory summary

Focus on legal precedent and similar legal issues rather than just keyword matching.`
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

    const run = await runResponse.json();

    // Wait for completion
    let runStatus = run;
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      runStatus = await statusResponse.json();
    }

    // Get the messages
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    const messages = await messagesResponse.json();
    const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');
    
    if (!assistantMessage) {
      throw new Error('No assistant response received');
    }

    const content = assistantMessage.content[0].text.value;
    
    // Parse the agent's response to extract structured data
    return this.parseAgentAnalysis(content);
  }

  private parseAgentAnalysis(content: string): AgentAnalysis {
    // Extract structured information from the agent's response
    const legalConceptsMatch = content.match(/(?:legal concepts?|claims?|theories?):\s*[:\-]?\s*(.*?)(?:\n\n|\n(?=[A-Z])|$)/is);
    const factsMatch = content.match(/(?:key facts?|factual elements?):\s*[:\-]?\s*(.*?)(?:\n\n|\n(?=[A-Z])|$)/is);
    const statutesMatch = content.match(/(?:statutes?|regulations?):\s*[:\-]?\s*(.*?)(?:\n\n|\n(?=[A-Z])|$)/is);
    const queriesMatch = content.match(/(?:search queries?|queries?):\s*[:\-]?\s*(.*?)(?:\n\n|\n(?=[A-Z])|$)/is);
    const theoryMatch = content.match(/(?:case theory|theory|summary):\s*[:\-]?\s*(.*?)(?:\n\n|\n(?=[A-Z])|$)/is);

    const parseList = (text: string): string[] => {
      return text.split(/[,\n\-•]/)
        .map(item => item.trim())
        .filter(item => item.length > 0 && !item.match(/^\d+\.?\s*$/))
        .slice(0, 10); // Limit to 10 items
    };

    return {
      legalConcepts: legalConceptsMatch ? parseList(legalConceptsMatch[1]) : [],
      keyFacts: factsMatch ? parseList(factsMatch[1]) : [],
      relevantStatutes: statutesMatch ? parseList(statutesMatch[1]) : [],
      searchQueries: queriesMatch ? parseList(queriesMatch[1]) : [],
      caseTheory: theoryMatch ? theoryMatch[1].trim() : ''
    };
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

        const thread = await threadResponse.json();

        // Add scoring message
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
3. Focus on legal similarity over factual similarity

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
          runStatus = await statusResponse.json();
          attempts++;
        }

        // Get the response
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });

        const messages = await messagesResponse.json();
        const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');
        
        if (assistantMessage) {
          const content = assistantMessage.content[0].text.value;
          const scoreMatch = content.match(/SCORE:\s*(\d+)/i);
          const reasoningMatch = content.match(/REASONING:\s*(.*?)$/is);
          
          const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
          const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Score assigned by agent';

          scoredCases.push({
            case: foundCase,
            relevanceScore: score,
            reasoning: reasoning
          });
        } else {
          // Fallback scoring
          scoredCases.push({
            case: foundCase,
            relevanceScore: 60,
            reasoning: 'Default score - agent response unavailable'
          });
        }
      } catch (error) {
        console.error(`Error scoring case ${foundCase.clientName}:`, error);
        // Add with default score
        scoredCases.push({
          case: foundCase,
          relevanceScore: 50,
          reasoning: 'Error in scoring - default assigned'
        });
      }
    }

    // Sort by relevance score descending
    return scoredCases.sort((a, b) => b.relevanceScore - a.relevanceScore);
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
      } catch (error) {
        console.error('Error cleaning up assistant:', error);
      }
    }
  }
}
