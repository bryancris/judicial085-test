
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { encodeAudioForAPI } from '@/utils/voiceChat';
import { WebSocketManager } from '@/utils/voiceChat/webSocketManager';
import { AudioRecordingManager } from '@/utils/voiceChat/audioRecordingManager';
import { AudioPlaybackManager } from '@/utils/voiceChat/audioPlaybackManager';
import { MessageHandler } from '@/utils/voiceChat/messageHandler';
import { UseVoiceChatProps } from '@/types/voiceChat';

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
  
  const webSocketManagerRef = useRef<WebSocketManager | null>(null);
  const audioRecordingManagerRef = useRef<AudioRecordingManager | null>(null);
  const audioPlaybackManagerRef = useRef<AudioPlaybackManager | null>(null);
  const messageHandlerRef = useRef<MessageHandler | null>(null);

  // Initialize audio playback manager
  useEffect(() => {
    audioPlaybackManagerRef.current = new AudioPlaybackManager();
    audioPlaybackManagerRef.current.initialize();
    
    return () => {
      audioPlaybackManagerRef.current?.cleanup();
    };
  }, []);

  // Initialize message handler
  useEffect(() => {
    messageHandlerRef.current = new MessageHandler(
      onTranscriptUpdate,
      setIsSpeaking,
      setIsAISpeaking,
      audioPlaybackManagerRef.current,
      audioEnabled,
      toast
    );
  }, [onTranscriptUpdate, audioEnabled, toast]);

  // Update message handler when audioEnabled changes
  useEffect(() => {
    messageHandlerRef.current?.updateAudioEnabled(audioEnabled);
  }, [audioEnabled]);

  const startRecording = async () => {
    try {
      audioRecordingManagerRef.current = new AudioRecordingManager();
      
      await audioRecordingManagerRef.current.startRecording((audioData) => {
        if (webSocketManagerRef.current) {
          const encodedAudio = encodeAudioForAPI(audioData);
          webSocketManagerRef.current.send({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          });
        }
      });

      setIsRecording(true);
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
    if (audioRecordingManagerRef.current) {
      audioRecordingManagerRef.current.stopRecording();
      audioRecordingManagerRef.current = null;
    }
    setIsRecording(false);
  };

  const connectToVoiceChat = async () => {
    try {
      webSocketManagerRef.current = new WebSocketManager(clientId, toast);
      const ws = await webSocketManagerRef.current.connect();
      
      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (messageHandlerRef.current) {
          await messageHandlerRef.current.handleMessage(data);
        }

        // Handle session.updated to start recording
        if (data.type === 'session.updated') {
          console.log('Session updated, starting recording');
          await startRecording();
        }
      };

      ws.onclose = (event) => {
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

      setIsConnected(true);
      onConnectionChange(true);

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
    webSocketManagerRef.current?.disconnect();
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
    currentTranscript: messageHandlerRef.current?.getCurrentTranscript() || '',
    connectToVoiceChat,
    disconnectFromVoiceChat,
    toggleAudio
  };
};
