
export class OpenAIAssistantService {
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

  async runAssistantAnalysis(prompt: string): Promise<string> {
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

    // Add message to thread
    await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: "user",
        content: prompt
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
      const errorText = await runResponse.text();
      console.error('Failed to start run:', runResponse.status, errorText);
      throw new Error(`Failed to start run: ${runResponse.status}`);
    }

    const run = await runResponse.json();

    // Wait for completion
    let runStatus = run;
    let attempts = 0;
    const maxAttempts = 60;
    
    while ((runStatus.status === 'in_progress' || runStatus.status === 'queued') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (statusResponse.ok) {
        runStatus = await statusResponse.json();
      }
    }

    if (runStatus.status !== 'completed') {
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
      throw new Error(`Failed to get messages: ${messagesResponse.status}`);
    }

    const messages = await messagesResponse.json();
    const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');
    
    if (!assistantMessage || !assistantMessage.content || assistantMessage.content.length === 0) {
      throw new Error('No assistant response received');
    }

    return assistantMessage.content[0].text.value;
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
