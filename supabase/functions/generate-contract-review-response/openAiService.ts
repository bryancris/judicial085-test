
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

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
        model: "gpt-4o", // Upgraded from gpt-4o-mini for more comprehensive contract analysis
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
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}
