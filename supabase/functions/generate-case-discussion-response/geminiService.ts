/**
 * Gemini service for case discussion response generation
 * Optimized for case discussion with extensive context understanding
 */

import { getEnvVars } from "./config.ts";

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

// Format messages for Gemini API - leveraging 2M context window
export const formatMessagesForGemini = (contextText: string, previousMessages: any[] = [], currentMessage: string) => {
  // With Gemini's 2M context window, we can include much more conversation history
  let fullContext = contextText;
  
  if (previousMessages && previousMessages.length > 0) {
    console.log(`Including ${previousMessages.length} previous messages in full context for Gemini`);
    
    fullContext += "\n\n=== PREVIOUS CASE DISCUSSION HISTORY ===\n";
    
    previousMessages.forEach((msg: any, index: number) => {
      const role = msg.role === "attorney" ? "Attorney" : "AI Assistant";
      fullContext += `\n[${role} - ${msg.timestamp || `Message ${index + 1}`}]: ${msg.content}\n`;
    });
    
    fullContext += "\n=== END OF PREVIOUS DISCUSSION ===\n";
  }
  
  fullContext += `\n\nCURRENT MESSAGE FROM ATTORNEY: ${currentMessage}`;
  
  return fullContext;
};

async function makeGeminiCaseDiscussionRequest(
  fullContext: string
): Promise<GeminiResponse> {
  const { GEMINI_API_KEY } = getEnvVars();
  
  if (!GEMINI_API_KEY) {
    throw new GeminiError('GEMINI_API_KEY environment variable is not set');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`;

  // Build the request payload optimized for case discussion
  const payload = {
    contents: [
      {
        parts: [
          { text: fullContext }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3, // Slightly higher than legal analysis for more natural conversation
      maxOutputTokens: 2048, // Allow longer responses for detailed case discussions
      candidateCount: 1
    }
  };

  try {
    console.log('🤖 Gemini Case Discussion Request:', {
      contextLength: fullContext.length,
      estimatedTokens: Math.ceil(fullContext.length / 4)
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

    console.log('✅ Gemini Case Discussion Success:', {
      responseLength: text.length,
      usage: usage || 'not available'
    });

    if (usage) {
      console.log('💰 Estimated cost:', 
        `$${((usage.totalTokens / 1000000) * 1.25).toFixed(4)}`);
    }

    return { text, usage };

  } catch (error) {
    console.error('❌ Gemini Case Discussion Error:', error);
    throw error instanceof GeminiError ? error : new GeminiError(String(error));
  }
}

export async function generateGeminiCaseDiscussion(
  contextText: string,
  previousMessages: any[] = [],
  currentMessage: string
): Promise<string> {
  console.log("Generating Gemini case discussion response");
  
  try {
    // Format the full context for Gemini's 2M window
    const fullContext = formatMessagesForGemini(contextText, previousMessages, currentMessage);
    
    // Use Gemini's large context window for comprehensive case understanding
    const geminiResponse = await makeGeminiCaseDiscussionRequest(fullContext);
    
    return geminiResponse.text;
  } catch (error) {
    console.error("Error calling Gemini for case discussion:", error);
    throw error;
  }
}