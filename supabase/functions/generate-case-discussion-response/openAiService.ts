
import { getEnvVars } from "./config.ts";

// Format messages for OpenAI API
export const formatMessages = (contextText: string, previousMessages: any[] = [], currentMessage: string) => {
  const messages = [
    {
      role: "system",
      content: contextText
    }
  ];

  // Add previous case discussion messages - critical for continuity
  if (previousMessages && previousMessages.length > 0) {
    console.log(`Including ${previousMessages.length} previous messages for context`);
    
    // If we have many previous messages, prioritize the most recent ones to stay within token limits
    let messagesToInclude = previousMessages;
    if (previousMessages.length > 10) {
      // Keep first message for context and last 9 for recent conversation
      messagesToInclude = [
        previousMessages[0],
        ...previousMessages.slice(-9)
      ];
      console.log(`Limited to ${messagesToInclude.length} previous messages due to token constraints`);
    }
    
    messagesToInclude.forEach((msg: any) => {
      messages.push({
        role: msg.role === "attorney" ? "user" : "assistant",
        content: msg.content
      });
    });
  } else {
    console.log("No previous messages to include");
  }

  // Add the current message
  messages.push({
    role: "user",
    content: currentMessage
  });

  return messages;
};

// Call OpenAI API
export const generateOpenAiResponse = async (messages: any[]) => {
  const { OPENAI_API_KEY } = getEnvVars();
  
  if (!OPENAI_API_KEY) {
    console.error("OpenAI API key is missing");
    return "I'm sorry, there was an issue with the AI configuration. Please contact support.";
  }
  
  console.log("Calling OpenAI API with gpt-4o model...");
  
  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",  // Using gpt-4o for better context understanding and retention
        messages,
        temperature: 0.2, // Lower temperature for more focused, consistent responses
        max_tokens: 1000  // Maintain token limit to ensure response fits
      })
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API returned an error:', errorData);
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const openAIData = await openAIResponse.json();

    if (!openAIData.choices || openAIData.choices.length === 0) {
      console.error('OpenAI API error:', openAIData);
      throw new Error('Failed to generate response');
    }

    const aiResponse = openAIData.choices[0].message.content;
    console.log(`Generated AI response of length: ${aiResponse.length} characters`);
    console.log(`Response begins with: "${aiResponse.substring(0, 50)}..."`);
    
    return aiResponse;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.";
  }
};
