/**
 * OpenAI service for contract review - replaces expensive Gemini service with cost-effective OpenAI  
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

async function makeOpenAIContractRequest(
  systemPrompt: string,
  userMessage: string
): Promise<OpenAIResponse> {
  if (!OPENAI_API_KEY) {
    throw new OpenAIError('OPENAI_API_KEY environment variable is not set');
  }

  const url = 'https://api.openai.com/v1/chat/completions';

  // Build the request payload optimized for contract review
  const payload = {
    model: 'gpt-5-2025-08-07', // Use GPT-5 for comprehensive contract analysis
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    max_completion_tokens: 8192, // High token limit for comprehensive contract reviews
  };

  try {
    console.log('🤖 OpenAI Contract Review Request:', {
      systemPromptLength: systemPrompt.length,
      userMessageLength: userMessage.length,  
      totalContext: systemPrompt.length + userMessage.length
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

    console.log('✅ OpenAI Contract Review Success:', {
      responseLength: text.length,
      usage: usage || 'not available'
    });

    if (usage) {
      console.log('💰 Estimated cost:', 
        `$${((usage.totalTokens / 1000000) * 7.5).toFixed(4)}`);
    }

    return { text, usage };

  } catch (error) {
    console.error('❌ OpenAI Contract Review Error:', error);
    throw error instanceof OpenAIError ? error : new OpenAIError(String(error));
  }
}

export async function generateOpenAIContractReview(
  contextText: string, 
  userMessage: string
): Promise<string> {
  console.log("Generating OpenAI contract review with context length:", contextText.length);
  
  try {
    // Use OpenAI for comprehensive contract analysis
    const openaiResponse = await makeOpenAIContractRequest(contextText, userMessage);
    const generatedContent = openaiResponse.text;
    
    return generatedContent;
  } catch (error) {
    console.error("Error calling OpenAI for contract review:", error);
    throw error;
  }
}