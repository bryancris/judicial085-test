
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

    // Add a message to the thread
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

I need you to:
1. Extract the key legal concepts, theories, and claims
2. Identify relevant statutes and regulations mentioned
3. Extract the most important factual elements
4. Generate 3-5 sophisticated search queries for finding similar cases
5. Provide a brief case theory summary

Focus on legal precedent and similar legal issues rather than just keyword matching.

Please format your response clearly with sections for:
- Legal Concepts: [list the main legal theories and claims]
- Key Facts: [list the most important factual elements]
- Relevant Statutes: [list any statutes or regulations mentioned]
- Search Queries: [list 3-5 search queries for legal databases]
- Case Theory: [brief summary of the legal theory]`
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
    
    // Parse the agent's response to extract structured data
    return this.parseAgentAnalysis(content);
  }

  private parseAgentAnalysis(content: string): AgentAnalysis {
    console.log('Parsing agent analysis...');
    
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

    const analysis = {
      legalConcepts: legalConceptsMatch ? parseList(legalConceptsMatch[1]) : [],
      keyFacts: factsMatch ? parseList(factsMatch[1]) : [],
      relevantStatutes: statutesMatch ? parseList(statutesMatch[1]) : [],
      searchQueries: queriesMatch ? parseList(queriesMatch[1]) : [],
      caseTheory: theoryMatch ? theoryMatch[1].trim() : ''
    };

    console.log('✅ Parsed analysis:', {
      legalConcepts: analysis.legalConcepts.length,
      keyFacts: analysis.keyFacts.length,
      relevantStatutes: analysis.relevantStatutes.length,
      searchQueries: analysis.searchQueries.length,
      caseTheory: analysis.caseTheory.length > 0
    });

    return analysis;
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
              
              const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
              const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Score assigned by agent';

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
        console.log(`✅ Cleaned up assistant: ${this.assistantId}`);
      } catch (error) {
        console.error('Error cleaning up assistant:', error);
      }
    }
  }
}
