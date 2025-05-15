
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
import { validateAllCitations, enhanceTextWithValidation } from "./texasStatuteValidator.ts";

export async function generateOpenAIResponse(contextText: string, userMessage: string): Promise<string> {
  console.log("Generating AI response with context length:", contextText.length);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // Using the more powerful model for comprehensive contract analysis
        messages: [
          {
            role: "system",
            content: contextText
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.5, // Lower temperature for more focused legal analysis
        max_tokens: 2500, // Increased token limit for detailed analysis
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    // Validate all statute citations in the generated content
    console.log("Validating Texas statute citations in generated content...");
    const validationResults = await validateAllCitations(generatedContent);
    
    console.log(`Validated ${validationResults.length} citations:`, 
      validationResults.map(r => `${r.citation.displayName}: ${r.isValid ? 'Valid' : 'Invalid'} (${r.confidence.toFixed(2)})`));
    
    // Enhance the content with validation markers
    const enhancedContent = enhanceTextWithValidation(generatedContent, validationResults);
    
    return enhancedContent;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}
