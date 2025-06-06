
import { supabase } from '@/integrations/supabase/client';
import { WebRTCAudioRecorder } from './webRTCAudioRecorder';
import { encodeAudioForAPI } from '@/utils/voiceChat';

export class WebRTCChatManager {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: WebRTCAudioRecorder | null = null;
  private clientId: string = '';
  private sessionId: string = '';
  private saveTranscript: ((sessionId: string, speaker: 'user' | 'ai', content: string) => Promise<void>) | null = null;

  constructor(
    private onMessage: (message: any) => void,
    private onError: (error: string) => void,
    saveTranscriptCallback?: (sessionId: string, speaker: 'user' | 'ai', content: string) => Promise<void>
  ) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
    this.saveTranscript = saveTranscriptCallback || null;
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async init(clientId: string, selectedVoice: string = 'alloy') {
    try {
      console.log("Initializing WebRTC chat for client:", clientId, "with voice:", selectedVoice);
      this.clientId = clientId;

      // Get ephemeral token from our Supabase Edge Function with selected voice
      const { data: tokenData, error } = await supabase.functions.invoke("generate-voice-token", {
        body: { clientId, voice: selectedVoice }
      });

      if (error) {
        throw new Error(`Token generation failed: ${error.message}`);
      }

      if (!tokenData.client_secret?.value) {
        throw new Error("Failed to get ephemeral token");
      }

      const EPHEMERAL_KEY = tokenData.client_secret.value;
      console.log("Ephemeral token received, setting up WebRTC...");

      // Create peer connection
      this.pc = new RTCPeerConnection();

      // Set up remote audio
      this.pc.ontrack = e => {
        console.log("Received remote audio track");
        this.audioEl.srcObject = e.streams[0];
      };

      // Add local audio track
      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      this.pc.addTrack(ms.getTracks()[0]);
      console.log("Added local audio track");

      // Set up data channel for events
      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.addEventListener("message", (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log("Received WebRTC event:", event.type);
          
          // Handle tool calls
          if (event.type === 'response.function_call_arguments.done') {
            this.handleToolCall(event);
          } else {
            this.onMessage(event);
          }

          // Save transcripts when available
          this.handleTranscriptSaving(event);
        } catch (error) {
          console.error("Error parsing WebRTC message:", error);
        }
      });

      this.dc.addEventListener("open", () => {
        console.log("Data channel opened");
      });

      this.dc.addEventListener("error", (e) => {
        console.error("Data channel error:", e);
        this.onError("Data channel error");
      });

      // Create and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      console.log("Created WebRTC offer");

      // Connect to OpenAI's Realtime API via WebRTC
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`WebRTC connection failed: ${sdpResponse.status} ${errorText}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log("WebRTC connection established successfully");

      // Start audio recording for input
      this.recorder = new WebRTCAudioRecorder((audioData) => {
        if (this.dc?.readyState === 'open') {
          this.dc.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodeAudioForAPI(audioData)
          }));
        }
      });

      await this.recorder.start();
      console.log("Audio recording started");

    } catch (error) {
      console.error("Error initializing WebRTC chat:", error);
      this.onError(error instanceof Error ? error.message : 'WebRTC initialization failed');
      throw error;
    }
  }

  private async handleTranscriptSaving(event: any) {
    if (!this.saveTranscript) return;

    try {
      // Save user transcripts
      if (event.type === 'conversation.item.input_audio_transcription.completed' && event.transcript) {
        await this.saveTranscript(this.sessionId, 'user', event.transcript);
      }

      // Save AI transcripts
      if (event.type === 'response.audio_transcript.done' && event.transcript) {
        await this.saveTranscript(this.sessionId, 'ai', event.transcript);
      }
    } catch (error) {
      console.error("Error saving transcript:", error);
    }
  }

  private async handleToolCall(event: any) {
    try {
      const functionName = event.name;
      const args = JSON.parse(event.arguments);
      
      console.log("Handling tool call:", functionName, args);
      
      if (functionName === 'search_case_documents') {
        const results = await this.searchCaseDocuments(args.query);
        
        // Send tool response back to the AI
        if (this.dc?.readyState === 'open') {
          this.dc.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: event.call_id,
              output: JSON.stringify(results)
            }
          }));
        }
      }
    } catch (error) {
      console.error("Error handling tool call:", error);
      
      // Send error response
      if (this.dc?.readyState === 'open') {
        this.dc.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: event.call_id,
            output: JSON.stringify({ error: 'Failed to search documents' })
          }
        }));
      }
    }
  }

  private async searchCaseDocuments(query: string) {
    try {
      console.log("Searching case documents for:", query);
      
      // Generate embedding for the search query
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
        body: { text: query }
      });

      if (embeddingError || !embeddingData?.embedding) {
        console.error("Error generating embedding:", embeddingError);
        return { results: [], error: "Failed to generate search embedding" };
      }

      // Search document chunks using the embedding
      const { data: searchResults, error: searchError } = await supabase.rpc('search_document_chunks_by_similarity', {
        query_embedding: embeddingData.embedding,
        client_id_param: this.clientId,
        match_threshold: 0.7,
        match_count: 5
      });

      if (searchError) {
        console.error("Error searching documents:", searchError);
        return { results: [], error: "Failed to search documents" };
      }

      console.log("Found document chunks:", searchResults?.length || 0);

      return {
        results: searchResults || [],
        summary: `Found ${searchResults?.length || 0} relevant document sections for "${query}"`
      };

    } catch (error) {
      console.error("Error in searchCaseDocuments:", error);
      return { results: [], error: "Document search failed" };
    }
  }

  async sendMessage(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    console.log("Sending text message:", text);

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    this.dc.send(JSON.stringify(event));
    this.dc.send(JSON.stringify({type: 'response.create'}));
  }

  disconnect() {
    console.log("Disconnecting WebRTC chat");
    this.recorder?.stop();
    this.dc?.close();
    this.pc?.close();
    this.recorder = null;
    this.dc = null;
    this.pc = null;
  }

  isConnected(): boolean {
    return this.pc?.connectionState === 'connected' && this.dc?.readyState === 'open';
  }

  getSessionId(): string {
    return this.sessionId;
  }
}
