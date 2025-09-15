/**
 * OpenAI service for case discussion - replaces expensive Gemini service
 */

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

interface OpenAIResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class OpenAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export const formatMessagesForOpenAI = (contextText: string, previousMessages: any[] = [], currentMessage: string): any[] => {
  const messages = [
    { role: 'system', content: contextText }
  ];

  // Add previous messages to maintain conversation context
  if (previousMessages && previousMessages.length > 0) {
    // Keep last 10 messages to stay within token limits
    const recentMessages = previousMessages.slice(-10);
    
    recentMessages.forEach((msg: any) => {
      messages.push({
        role: msg.role === 'attorney' ? 'user' : 'assistant',
        content: msg.content
      });
    });
  }

  // Add current message
  messages.push({
    role: 'user',
    content: currentMessage
  });

  return messages;
};

async function makeOpenAICaseDiscussionRequest(messages: any[]): Promise<OpenAIResponse> {
  if (!OPENAI_API_KEY) {
    throw new OpenAIError('OPENAI_API_KEY environment variable is not set');
  }

  const url = 'https://api.openai.com/v1/chat/completions';

  // Build the request payload for case discussion
  const payload = {
    model: 'gpt-5-2025-08-07', // Use GPT-5 for high-quality case discussions
    messages,
    max_completion_tokens: 4096, // GPT-5 uses max_completion_tokens
    // Note: GPT-5 doesn't support temperature parameter
  };

  try {
    console.log('🤖 OpenAI Case Discussion Request:', {
      messageCount: messages.length,
      model: payload.model,
      totalContext: messages.reduce((acc, msg) => acc + msg.content.length, 0)
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new OpenAIError(
        `OpenAI API error: ${response.status} ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();

    // Parse the OpenAI response format
    if (!data.choices || data.choices.length === 0) {
      throw new OpenAIError('No choices returned from OpenAI API', undefined, data);
    }

    const choice = data.choices[0];
    if (!choice.message || !choice.message.content) {
      throw new OpenAIError('No content in OpenAI API response', undefined, data);
    }

    const text = choice.message.content;
    
    // Extract usage information if available
    const usage = data.usage ? {
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0
    } : undefined;

    console.log('✅ OpenAI Case Discussion Success:', {
      responseLength: text.length,
      usage: usage || 'not available'
    });

    if (usage) {
      console.log('💰 Estimated cost:', 
        `$${((usage.totalTokens / 1000000) * 7.5).toFixed(4)}`);
    }

    return { text, usage };

  } catch (error) {
    console.error('❌ OpenAI Case Discussion Error:', error);
    throw error instanceof OpenAIError ? error : new OpenAIError(String(error));
  }
}

export async function generateOpenAICaseDiscussion(
  contextText: string, 
  previousMessages: any[] = [], 
  currentMessage: string
): Promise<string> {
  console.log("Generating OpenAI case discussion with context length:", contextText.length);
  
  try {
    // Format messages for OpenAI
    const messages = formatMessagesForOpenAI(contextText, previousMessages, currentMessage);
    
    // Generate response using OpenAI
    const openaiResponse = await makeOpenAICaseDiscussionRequest(messages);
    const generatedContent = openaiResponse.text;
    
    return generatedContent;
  } catch (error) {
    console.error("Error calling OpenAI for case discussion:", error);
    throw error;
  }
}
