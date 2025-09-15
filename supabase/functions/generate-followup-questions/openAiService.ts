// OpenAI service for generating follow-up questions
interface OpenAIResponse {
  text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function generateLegalAnalysis(
  prompt: string,
  systemPrompt: string,
  apiKey: string
): Promise<OpenAIResponse> {
  const url = 'https://api.openai.com/v1/chat/completions';

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];

  const payload = {
    model: 'gpt-4o-mini', // Use real OpenAI model
    messages,
    max_tokens: 2048,
    temperature: 0.7
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response format from OpenAI API");
  }

  const text = data.choices[0].message.content;
  
  return {
    text,
    usage: data.usage ? {
      prompt_tokens: data.usage.prompt_tokens || 0,
      completion_tokens: data.usage.completion_tokens || 0,
      total_tokens: data.usage.total_tokens || 0
    } : undefined
  };
}