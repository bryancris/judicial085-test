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
  model: 'gpt-5-2025-08-07', // Flagship GPT-5 model
  maxTokens: 4096,
  retries: 3,
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

  // Build payload - use different parameter names based on model
  const isGPT5OrNewer = config.model.startsWith('gpt-5') || config.model.startsWith('o3') || config.model.startsWith('o4');
  
  const payload: any = {
    model: config.model,
    messages,
    ...(isGPT5OrNewer 
      ? { max_completion_tokens: config.maxTokens }  // GPT-5+ uses max_completion_tokens
      : { max_tokens: config.maxTokens }             // Legacy models use max_tokens
    )
  };

  // Only add temperature for legacy models (GPT-5+ doesn't support it)
  if (!isGPT5OrNewer && config.temperature !== undefined) {
    payload.temperature = config.temperature;
  }

  let lastError: Error;

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      console.log(`🤖 OpenAI API Request (attempt ${attempt}/${config.retries}):`, {
        model: config.model,
        temperature: isGPT5OrNewer ? 'N/A (GPT-5+)' : config.temperature,
        promptLength: prompt.length,
        hasSystemPrompt: !!config.systemPrompt,
        tokenParam: isGPT5OrNewer ? 'max_completion_tokens' : 'max_tokens'
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
        const costPer1MTokens = config.model.startsWith('gpt-5') ? 7.5 : // GPT-5 pricing
                              config.model.startsWith('gpt-4') ? 10.0 : // GPT-4 pricing  
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

  // Use GPT-5 for legal analysis with high token limit
  const legalOptions: OpenAIRequestOptions = {
    model: 'gpt-5-2025-08-07',
    maxTokens: 8192,
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
    model: 'gpt-5-2025-08-07',
    maxTokens: 8192,
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
    model: 'gpt-5-2025-08-07',
    maxTokens: 4096,
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
    model: 'gpt-5-2025-08-07',
    maxTokens: 6144,
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
    'gpt-5-2025-08-07',
    'gpt-5-mini-2025-08-07', 
    'gpt-5-nano-2025-08-07',
    'gpt-4.1-2025-04-14',
    'o3-2025-04-16',
    'o4-mini-2025-04-16',
    'gpt-4.1-mini-2025-04-14',
    'gpt-4o-mini',
    'gpt-4o'
  ];
}

/**
 * Estimate token cost based on usage and model
 */
export function estimateTokenCost(usage: OpenAIResponse['usage'], model = 'gpt-5-2025-08-07'): number {
  if (!usage) return 0;
  
  const costPer1MTokens = model.startsWith('gpt-5') ? 7.5 :
                         model.startsWith('gpt-4') ? 10.0 :
                         model.startsWith('o3') ? 15.0 :
                         model.startsWith('o4') ? 8.0 :
                         2.5;
  
  return (usage.totalTokens / 1000000) * costPer1MTokens;
}