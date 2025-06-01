
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Realtime voice chat function called");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    console.log("Client ID:", clientId);
    
    if (!clientId) {
      console.log("Client ID required");
      return new Response("Client ID required", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Check for WebSocket upgrade request
    const upgradeHeader = req.headers.get("upgrade");
    const connectionHeader = req.headers.get("connection");
    
    console.log("Upgrade header:", upgradeHeader);
    console.log("Connection header:", connectionHeader);

    // Validate WebSocket upgrade request
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
      console.log("Not a WebSocket upgrade request");
      return new Response("WebSocket upgrade required", { 
        status: 426,
        headers: {
          ...corsHeaders,
          "Upgrade": "websocket",
          "Connection": "Upgrade"
        }
      });
    }

    console.log(`Starting voice chat session for client: ${clientId}`);

    const { socket, response } = Deno.upgradeWebSocket(req);
    
    let openAISocket: WebSocket | null = null;
    let sessionActive = false;

    // Initialize OpenAI Realtime API connection
    const initializeOpenAI = async () => {
      try {
        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
        if (!OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }

        console.log("Connecting to OpenAI Realtime API...");

        // Use the correct OpenAI Realtime API WebSocket URL with authentication in URL
        const openAIUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
        console.log("OpenAI WebSocket URL:", openAIUrl);

        // Create WebSocket connection to OpenAI using fetch for proper header support
        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-realtime-preview-2024-10-01",
            voice: "alloy",
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to create OpenAI session:", response.status, errorText);
          throw new Error(`OpenAI session creation failed: ${response.status} ${errorText}`);
        }

        const sessionData = await response.json();
        console.log("OpenAI session created:", sessionData);

        if (!sessionData.client_secret?.value) {
          throw new Error("No client secret received from OpenAI");
        }

        // Now connect using the ephemeral token
        const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
        console.log("Connecting to OpenAI WebSocket with ephemeral token...");

        openAISocket = new WebSocket(wsUrl, [], {
          headers: {
            "Authorization": `Bearer ${sessionData.client_secret.value}`,
            "OpenAI-Beta": "realtime=v1"
          }
        });

        openAISocket.onopen = () => {
          console.log("Connected to OpenAI Realtime API");
          sessionActive = true;
          
          // Send session update to configure the session
          const sessionUpdate = {
            type: 'session.update',
            session: {
              instructions: `You are an expert legal AI assistant helping attorneys with case discussions. You have access to client information and case documents. 

Key guidelines:
- Provide thoughtful legal analysis and strategic advice
- Reference relevant laws, precedents, and legal principles
- Ask clarifying questions to better understand the case
- Maintain attorney-client privilege and confidentiality
- Be direct and professional in your responses
- Always acknowledge the specific case context when responding

Current client ID: ${clientId}. You should reference the client's case details in your responses.`,
              voice: "alloy",
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
              input_audio_transcription: {
                model: "whisper-1"
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              },
              tools: [
                {
                  type: "function",
                  name: "search_case_documents",
                  description: "Search through the client's case documents for relevant information",
                  parameters: {
                    type: "object",
                    properties: {
                      query: { type: "string", description: "Search query for case documents" }
                    },
                    required: ["query"]
                  }
                }
              ],
              tool_choice: "auto",
              temperature: 0.7,
              max_response_output_tokens: "inf"
            }
          };

          console.log("Sending session update to OpenAI...");
          openAISocket?.send(JSON.stringify(sessionUpdate));
        };

        openAISocket.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          console.log("OpenAI message type:", data.type);

          // Handle session updates
          if (data.type === 'session.updated') {
            console.log("Session configuration updated successfully");
          }

          // Forward all messages to client
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data));
          }
        };

        openAISocket.onerror = (error) => {
          console.error("OpenAI WebSocket error:", error);
          sessionActive = false;
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'error',
              error: 'OpenAI connection error: ' + error.toString()
            }));
          }
        };

        openAISocket.onclose = (event) => {
          console.log("OpenAI connection closed:", event.code, event.reason);
          sessionActive = false;
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'error',
              error: 'OpenAI connection closed unexpectedly'
            }));
          }
        };

      } catch (error) {
        console.error("Error initializing OpenAI:", error);
        sessionActive = false;
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'error',
            error: `OpenAI initialization failed: ${error.message}`
          }));
        }
      }
    };

    // Handle client WebSocket events
    socket.onopen = () => {
      console.log("Client connected, initializing OpenAI...");
      initializeOpenAI();
    };

    socket.onmessage = (event) => {
      if (!sessionActive || !openAISocket || openAISocket.readyState !== WebSocket.OPEN) {
        console.log("Session not ready, queuing message");
        return;
      }

      try {
        const data = JSON.parse(event.data);
        console.log("Client message type:", data.type);
        
        // Forward client messages to OpenAI
        openAISocket.send(JSON.stringify(data));
      } catch (error) {
        console.error("Error processing client message:", error);
      }
    };

    socket.onclose = (event) => {
      console.log("Client disconnected:", event.code, event.reason);
      openAISocket?.close();
    };

    socket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
      openAISocket?.close();
    };

    return response;

  } catch (error) {
    console.error("Error in realtime-voice-chat function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
