
// Generate embedding using OpenAI
export async function generateEmbedding(text: string, openaiApiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error: ${response.statusText} - ${errorData}`);
  }
  
  const data = await response.json();
  
  if (!data.data || data.data.length === 0) {
    throw new Error('No embedding data received from OpenAI');
  }
  
  return data.data[0].embedding;
}
