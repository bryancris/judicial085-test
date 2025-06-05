
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

Please format your response clearly with sections for:
- Legal Concepts: [broad legal theories and claims that would find similar cases]
- Key Facts: [the most important factual elements that define the incident type]
- Relevant Statutes: [any statutes or regulations mentioned]
- Search Queries: [3-5 practical search queries using common legal terminology]
- Case Theory: [brief summary of the legal theory]

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

    console.log('🔍 Generated search queries:', analysis.searchQueries);

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

SCORING GUIDELINES:
- 80-100: Very similar legal issues and fact patterns
- 60-79: Similar legal concepts with some factual differences
- 40-59: Related legal areas with different facts
- 20-39: Some legal similarity but mostly different
- 0-19: Unrelated cases

Be more generous with scoring - cases dealing with similar legal concepts (like negligence, liability, premises issues) should score at least 40+ even if specific facts differ.

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
              
              const score = scoreMatch ? parseInt(scoreMatch[1]) : 40; // Default to 40 instead of 50
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
        // Add with default score of 40 instead of 50
        scoredCases.push({
          case: foundCase,
          relevanceScore: 40,
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
