
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorder, AudioQueue, encodeAudioForAPI } from '@/utils/voiceChat';

interface UseVoiceChatProps {
  clientId: string;
  onTranscriptUpdate: (transcript: string, isUser: boolean) => void;
  onConnectionChange: (connected: boolean) => void;
}

export const useVoiceChat = ({
  clientId,
  onTranscriptUpdate,
  onConnectionChange
}: UseVoiceChatProps) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context and queue
  useEffect(() => {
    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    audioQueueRef.current = new AudioQueue(audioContextRef.current);
    
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const startRecording = async () => {
    try {
      recorderRef.current = new AudioRecorder((audioData) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const encodedAudio = encodeAudioForAPI(audioData);
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      });

      await recorderRef.current.start();
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    setIsRecording(false);
    console.log('Recording stopped');
  };

  const connectToVoiceChat = async () => {
    try {
      console.log(`Connecting to voice chat for client: ${clientId}`);
      
      const wsUrl = `wss://ghpljdgecjmhkwkfctgy.functions.supabase.co/functions/v1/realtime-voice-chat?clientId=${clientId}`;
      console.log('Connecting to WebSocket URL:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Connected to voice chat');
        setIsConnected(true);
        onConnectionChange(true);
        toast({
          title: "Voice Chat Connected",
          description: "You can now start speaking with the AI assistant",
        });
      };

      wsRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Received message type:', data.type);

        switch (data.type) {
          case 'session.created':
            console.log('Session created');
            break;
            
          case 'session.updated':
            console.log('Session updated, starting recording');
            await startRecording();
            break;

          case 'input_audio_buffer.speech_started':
            setIsSpeaking(true);
            console.log('User started speaking');
            break;

          case 'input_audio_buffer.speech_stopped':
            setIsSpeaking(false);
            console.log('User stopped speaking');
            break;

          case 'response.audio.delta':
            if (audioEnabled && audioQueueRef.current) {
              const binaryString = atob(data.delta);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              await audioQueueRef.current.addToQueue(bytes);
              setIsAISpeaking(true);
            }
            break;

          case 'response.audio.done':
            setIsAISpeaking(false);
            console.log('AI finished speaking');
            break;

          case 'response.audio_transcript.delta':
            setCurrentTranscript(prev => prev + data.delta);
            break;

          case 'response.audio_transcript.done':
            if (currentTranscript) {
              onTranscriptUpdate(currentTranscript, false);
              setCurrentTranscript('');
            }
            break;

          case 'conversation.item.input_audio_transcription.completed':
            onTranscriptUpdate(data.transcript, true);
            break;

          case 'error':
            console.error('Voice chat error:', data.error);
            toast({
              title: "Voice Chat Error",
              description: data.error,
              variant: "destructive",
            });
            break;
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to voice chat. Please check your internet connection and try again.",
          variant: "destructive",
        });
      };

      wsRef.current.onclose = (event) => {
        console.log('Voice chat disconnected. Code:', event.code, 'Reason:', event.reason);
        setIsConnected(false);
        setIsRecording(false);
        setIsSpeaking(false);
        setIsAISpeaking(false);
        onConnectionChange(false);
        stopRecording();
        
        if (event.code !== 1000) {
          toast({
            title: "Connection Lost",
            description: "Voice chat connection was lost. You can try reconnecting.",
            variant: "destructive",
          });
        }
      };

    } catch (error) {
      console.error('Error connecting to voice chat:', error);
      toast({
        title: "Connection Failed",
        description: "Could not establish voice chat connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const disconnectFromVoiceChat = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    stopRecording();
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    toast({
      title: audioEnabled ? "Audio Muted" : "Audio Enabled",
      description: audioEnabled ? "You won't hear AI responses" : "You'll now hear AI responses",
    });
  };

  return {
    isConnected,
    isRecording,
    isSpeaking,
    isAISpeaking,
    audioEnabled,
    currentTranscript,
    connectToVoiceChat,
    disconnectFromVoiceChat,
    toggleAudio
  };
};
