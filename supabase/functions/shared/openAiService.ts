/**
 * OpenAI API Service for Supabase Edge Functions
 * Provides standardized API calls, error handling, and response parsing for OpenAI integration
 * Replaces expensive Gemini service with cost-effective OpenAI
 */

export interface OpenAIResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface OpenAIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  retries?: number;
}

/**
 * Default configuration for OpenAI API calls
 */
const DEFAULT_CONFIG = {
  model: 'gpt-4o', // Use real OpenAI model
  maxTokens: 4096,
  retries: 2, // Reduce retries to speed up
  baseUrl: 'https://api.openai.com/v1/chat/completions'
};

/**
 * Custom error class for OpenAI API errors
 */
export class OpenAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

/**
 * Make a request to OpenAI API with retry logic and error handling
 */
async function makeOpenAIRequest(
  prompt: string,
  apiKey: string,
  options: OpenAIRequestOptions = {}
): Promise<OpenAIResponse> {
  const config = { ...DEFAULT_CONFIG, ...options };

  if (!apiKey) {
    throw new OpenAIError('OPENAI_API_KEY is not provided');
  }

  // Build messages array for chat completions
  const messages = [
    ...(config.systemPrompt ? [{ role: 'system' as const, content: config.systemPrompt }] : []),
    { role: 'user' as const, content: prompt }
  ];

  // Build payload - use standard OpenAI parameters
  const payload: any = {
    model: config.model,
    messages,
    max_tokens: config.maxTokens,
    ...(config.temperature !== undefined && { temperature: config.temperature })
  };

  let lastError: Error;

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      console.log(`🤖 OpenAI API Request (attempt ${attempt}/${config.retries}):`, {
        model: config.model,
        temperature: config.temperature,
        promptLength: prompt.length,
        hasSystemPrompt: !!config.systemPrompt,
        maxTokens: config.maxTokens
      });

      const response = await fetch(config.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        
        // Handle rate limiting with exponential backoff
        if (response.status === 429) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry ${attempt}/${config.retries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          lastError = new OpenAIError(`Rate limited (attempt ${attempt})`, response.status, errorData);
          continue;
        }

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

      console.log('✅ OpenAI API Success:', {
        responseLength: text.length,
        usage: usage || 'not available'
      });

      if (usage) {
        // Estimate cost for different models
        const costPer1MTokens = config.model === 'gpt-4o' ? 5.0 :
                              config.model === 'gpt-4o-mini' ? 0.15 :
                              2.5; // Default pricing
        const estimatedCost = (usage.totalTokens / 1000000) * costPer1MTokens;
        console.log('💰 Estimated cost:', `$${estimatedCost.toFixed(4)}`);
      }

      return { text, usage };

    } catch (error) {
      console.error(`❌ OpenAI API Error (attempt ${attempt}):`, error);
      lastError = error instanceof OpenAIError ? error : new OpenAIError(String(error));
      
      if (attempt < config.retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

/**
 * Generate text completion using OpenAI
 */
export async function generateCompletion(
  prompt: string,
  options?: OpenAIRequestOptions
): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new OpenAIError('OPENAI_API_KEY environment variable is not set');
  }

  const response = await makeOpenAIRequest(prompt, apiKey, options);
  return response.text;
}

/**
 * Generate legal analysis using OpenAI with optimized settings
 */
export async function generateLegalAnalysis(
  prompt: string,
  systemPrompt: string,
  options?: Omit<OpenAIRequestOptions, 'systemPrompt'>
): Promise<OpenAIResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new OpenAIError('OPENAI_API_KEY environment variable is not set');
  }

  // Use GPT-4o for legal analysis with optimized settings
  const legalOptions: OpenAIRequestOptions = {
    model: 'gpt-4o',
    maxTokens: 4096, // Reduce for faster response
    temperature: 0.1, // Lower temperature for legal analysis
    systemPrompt,
    retries: 2,
    ...options
  };

  return await makeOpenAIRequest(prompt, apiKey, legalOptions);
}

/**
 * Generate contract review using OpenAI
 */
export async function generateContractReview(
  documentContent: string,
  reviewPrompt: string,
  systemPrompt: string,
  options?: Omit<OpenAIRequestOptions, 'systemPrompt'>
): Promise<OpenAIResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new OpenAIError('OPENAI_API_KEY environment variable is not set');
  }

  const prompt = `${documentContent}\n\n---\n\n${reviewPrompt}`;
  
  const contractOptions: OpenAIRequestOptions = {
    model: 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.2,
    systemPrompt,
    retries: 2,
    ...options
  };

  return await makeOpenAIRequest(prompt, apiKey, contractOptions);
}

/**
 * Generate case discussion using OpenAI
 */
export async function generateCaseDiscussion(
  conversationHistory: string,
  newMessage: string,
  systemPrompt: string,
  options?: Omit<OpenAIRequestOptions, 'systemPrompt'>
): Promise<OpenAIResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new OpenAIError('OPENAI_API_KEY environment variable is not set');
  }

  const prompt = `${conversationHistory}\n\nCurrent Message: ${newMessage}`;
  
  const discussionOptions: OpenAIRequestOptions = {
    model: 'gpt-4o-mini', // Use faster model for discussions
    maxTokens: 2048,
    temperature: 0.7,
    systemPrompt,
    retries: 2,
    ...options
  };

  return await makeOpenAIRequest(prompt, apiKey, discussionOptions);
}

/**
 * Process document with OpenAI (text-based analysis)
 */
export async function processDocument(
  documentContent: string,
  analysisPrompt: string,
  options?: OpenAIRequestOptions
): Promise<OpenAIResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new OpenAIError('OPENAI_API_KEY environment variable is not set');
  }

  const prompt = `Document Content:\n${documentContent}\n\nAnalysis Request:\n${analysisPrompt}`;
  
  const documentOptions: OpenAIRequestOptions = {
    model: 'gpt-4o',
    maxTokens: 3072,
    temperature: 0.1,
    retries: 2,
    ...options
  };

  return await makeOpenAIRequest(prompt, apiKey, documentOptions);
}

/**
 * Check OpenAI API health
 */
export async function checkOpenAIHealth(): Promise<boolean> {
  try {
    await generateCompletion('Test connection', { 
      maxTokens: 10,
      retries: 1 
    });
    return true;
  } catch (error) {
    console.error('OpenAI health check failed:', error);
    return false;
  }
}

/**
 * Get available OpenAI models
 */
export function getAvailableModels(): string[] {
  return [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-3.5-turbo'
  ];
}

/**
 * Estimate token cost based on usage and model
 */
export function estimateTokenCost(usage: OpenAIResponse['usage'], model = 'gpt-4o'): number {
  if (!usage) return 0;
  
  const costPer1MTokens = model === 'gpt-4o' ? 5.0 :
                         model === 'gpt-4o-mini' ? 0.15 :
                         2.5;
  
  return (usage.totalTokens / 1000000) * costPer1MTokens;
}