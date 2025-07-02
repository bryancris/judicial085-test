/**
 * Gemini service for contract review - optimized for Texas law contract analysis
 */

import { validateAllCitations, enhanceTextWithValidation } from "./texasStatuteValidator.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';

interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class GeminiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

async function makeGeminiContractRequest(
  systemPrompt: string,
  userMessage: string
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    throw new GeminiError('GEMINI_API_KEY environment variable is not set');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`;

  // Build the request payload optimized for contract review
  const payload = {
    contents: [
      {
        parts: [
          { text: systemPrompt },
          { text: userMessage }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2, // Very low temperature for consistent contract analysis
      maxOutputTokens: 8192, // High token limit for comprehensive contract reviews
      candidateCount: 1
    }
  };

  try {
    console.log('🤖 Gemini Contract Review Request:', {
      systemPromptLength: systemPrompt.length,
      userMessageLength: userMessage.length,
      totalContext: systemPrompt.length + userMessage.length
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

    // Parse the Gemini response format
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

    console.log('✅ Gemini Contract Review Success:', {
      responseLength: text.length,
      usage: usage || 'not available'
    });

    if (usage) {
      console.log('💰 Estimated cost:', 
        `$${((usage.totalTokens / 1000000) * 1.25).toFixed(4)}`);
    }

    return { text, usage };

  } catch (error) {
    console.error('❌ Gemini Contract Review Error:', error);
    throw error instanceof GeminiError ? error : new GeminiError(String(error));
  }
}

export async function generateGeminiContractReview(
  contextText: string, 
  userMessage: string
): Promise<string> {
  console.log("Generating Gemini contract review with context length:", contextText.length);
  
  try {
    // Use Gemini's 2M context window for comprehensive contract analysis
    const geminiResponse = await makeGeminiContractRequest(contextText, userMessage);
    const generatedContent = geminiResponse.text;
    
    // Validate all statute citations in the generated content
    console.log("Validating Texas statute citations in Gemini-generated content...");
    const validationResults = await validateAllCitations(generatedContent);
    
    console.log(`Validated ${validationResults.length} citations:`, 
      validationResults.map(r => `${r.citation.displayName}: ${r.isValid ? 'Valid' : 'Invalid'} (${r.confidence.toFixed(2)})`));
    
    // Enhance the content with validation markers
    const enhancedContent = enhanceTextWithValidation(generatedContent, validationResults);
    
    return enhancedContent;
  } catch (error) {
    console.error("Error calling Gemini for contract review:", error);
    throw error;
  }
}