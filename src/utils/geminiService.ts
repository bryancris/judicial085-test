/**
 * Google Gemini API Service
 * Provides standardized API calls, error handling, and response parsing for Gemini integration
 */

export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface GeminiRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  retries?: number;
}

/**
 * Default configuration for Gemini API calls
 */
const DEFAULT_CONFIG = {
  model: 'gemini-1.5-pro-latest',
  temperature: 0.5,
  maxTokens: 8192,
  retries: 3,
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models'
};

/**
 * Custom error class for Gemini API errors
 */
export class GeminiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

/**
 * Make a request to Gemini API with retry logic and error handling
 */
async function makeGeminiRequest(
  prompt: string,
  options: GeminiRequestOptions = {}
): Promise<GeminiResponse> {
  const config = { ...DEFAULT_CONFIG, ...options };
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiError('GEMINI_API_KEY environment variable is not set');
  }

  const url = `${config.baseUrl}/${config.model}:generateContent?key=${apiKey}`;

  // Build the request payload
  const payload = {
    contents: [
      {
        parts: [
          ...(config.systemPrompt ? [{ text: config.systemPrompt }] : []),
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      candidateCount: 1
    }
  };

  let lastError: Error;

  // Retry logic
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      console.log(`🤖 Gemini API Request (attempt ${attempt}/${config.retries}):`, {
        model: config.model,
        temperature: config.temperature,
        promptLength: prompt.length,
        hasSystemPrompt: !!config.systemPrompt
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new GeminiError(
          `Gemini API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();

      // Parse the response
      if (!data.candidates || data.candidates.length === 0) {
        throw new GeminiError('No candidates returned from Gemini API', undefined, data);
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new GeminiError('No content in Gemini API response', undefined, data);
      }

      const text = candidate.content.parts[0].text;
      
      // Extract usage information if available
      const usage = data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0
      } : undefined;

      console.log(`✅ Gemini API Success:`, {
        responseLength: text.length,
        usage: usage || 'not available'
      });

      return { text, usage };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.error(`❌ Gemini API Error (attempt ${attempt}/${config.retries}):`, {
        error: lastError.message,
        ...(error instanceof GeminiError && { statusCode: error.statusCode })
      });

      // If this is the last attempt, don't wait
      if (attempt === config.retries) break;

      // Wait before retry (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

/**
 * Generate text completion using Gemini
 */
export async function generateCompletion(
  prompt: string,
  options: GeminiRequestOptions = {}
): Promise<string> {
  const response = await makeGeminiRequest(prompt, options);
  return response.text;
}

/**
 * Generate legal analysis using Gemini 1.5 Pro with optimized settings
 */
export async function generateLegalAnalysis(
  prompt: string,
  systemPrompt: string,
  options: Omit<GeminiRequestOptions, 'systemPrompt'> = {}
): Promise<GeminiResponse> {
  return makeGeminiRequest(prompt, {
    model: 'gemini-1.5-pro-latest',
    temperature: 0.3, // Lower temperature for more consistent legal analysis
    maxTokens: 8192,
    systemPrompt,
    retries: 2,
    ...options
  });
}

/**
 * Generate contract review using Gemini with document processing optimizations
 */
export async function generateContractReview(
  documentContent: string,
  reviewPrompt: string,
  systemPrompt: string,
  options: Omit<GeminiRequestOptions, 'systemPrompt'> = {}
): Promise<GeminiResponse> {
  // Combine document content with review prompt
  const fullPrompt = `Document to review:\n\n${documentContent}\n\n${reviewPrompt}`;
  
  return makeGeminiRequest(fullPrompt, {
    model: 'gemini-1.5-pro-latest',
    temperature: 0.2, // Very low temperature for contract review consistency
    maxTokens: 8192,
    systemPrompt,
    retries: 2,
    ...options
  });
}

/**
 * Generate case discussion response using Gemini
 */
export async function generateCaseDiscussion(
  conversationHistory: string,
  newMessage: string,
  systemPrompt: string,
  options: Omit<GeminiRequestOptions, 'systemPrompt'> = {}
): Promise<GeminiResponse> {
  const fullPrompt = `Conversation History:\n${conversationHistory}\n\nNew Message: ${newMessage}`;
  
  return makeGeminiRequest(fullPrompt, {
    model: 'gemini-1.5-pro-latest',
    temperature: 0.4,
    maxTokens: 4096,
    systemPrompt,
    retries: 2,
    ...options
  });
}

/**
 * Process document using Gemini Pro Vision (for image/PDF processing)
 */
export async function processDocumentWithVision(
  documentData: string, // Base64 encoded document
  mimeType: string,
  analysisPrompt: string,
  options: GeminiRequestOptions = {}
): Promise<GeminiResponse> {
  const config = { ...DEFAULT_CONFIG, ...options };
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiError('GEMINI_API_KEY environment variable is not set');
  }

  const url = `${config.baseUrl}/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: analysisPrompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: documentData
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      candidateCount: 1
    }
  };

  try {
    console.log('🖼️ Gemini Vision API Request:', {
      mimeType,
      promptLength: analysisPrompt.length,
      dataSize: documentData.length
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new GeminiError(
        `Gemini Vision API error: ${response.status} ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new GeminiError('No candidates returned from Gemini Vision API', undefined, data);
    }

    const text = data.candidates[0].content.parts[0].text;
    const usage = data.usageMetadata ? {
      promptTokens: data.usageMetadata.promptTokenCount || 0,
      completionTokens: data.usageMetadata.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata.totalTokenCount || 0
    } : undefined;

    console.log('✅ Gemini Vision API Success:', {
      responseLength: text.length,
      usage: usage || 'not available'
    });

    return { text, usage };

  } catch (error) {
    console.error('❌ Gemini Vision API Error:', error);
    throw error instanceof GeminiError ? error : new GeminiError(String(error));
  }
}

/**
 * Health check for Gemini API connectivity
 */
export async function checkGeminiHealth(): Promise<boolean> {
  try {
    await generateCompletion('Test connection', { 
      maxTokens: 10,
      retries: 1 
    });
    return true;
  } catch (error) {
    console.error('Gemini health check failed:', error);
    return false;
  }
}

/**
 * Get available Gemini models
 */
export function getAvailableModels(): string[] {
  return [
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-latest',
    'gemini-1.0-pro-latest'
  ];
}

/**
 * Calculate estimated cost for Gemini API usage
 */
export function estimateTokenCost(usage: GeminiResponse['usage'], model: string = 'gemini-1.5-pro-latest'): number {
  if (!usage) return 0;
  
  // Gemini 1.5 Pro pricing (approximate)
  const inputCostPer1K = 0.00125;  // $1.25 per 1M tokens for input
  const outputCostPer1K = 0.005;   // $5.00 per 1M tokens for output
  
  const inputCost = (usage.promptTokens / 1000) * inputCostPer1K;
  const outputCost = (usage.completionTokens / 1000) * outputCostPer1K;
  
  return inputCost + outputCost;
}