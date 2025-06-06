import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { WebRTCChatManager } from '@/utils/voiceChat/webRTCChatManager';
import { AudioPlaybackManager } from '@/utils/voiceChat/audioPlaybackManager';
import { MessageHandler } from '@/utils/voiceChat/messageHandler';
import { UseVoiceChatProps } from '@/types/voiceChat';
import { useVoiceTranscripts } from '@/hooks/useVoiceTranscripts';

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
  
  // Validate saved voice preference against supported voices
  const getSavedVoice = () => {
    const savedVoice = localStorage.getItem('preferredVoice');
    const supportedVoices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'];
    return savedVoice && supportedVoices.includes(savedVoice) ? savedVoice : 'alloy';
  };
  
  const [selectedVoice, setSelectedVoice] = useState(getSavedVoice);
  
  const webRTCManagerRef = useRef<WebRTCChatManager | null>(null);
  const audioPlaybackManagerRef = useRef<AudioPlaybackManager | null>(null);
  const messageHandlerRef = useRef<MessageHandler | null>(null);
  
  // Add transcript saving functionality
  const { saveTranscript } = useVoiceTranscripts(clientId);

  // Save voice preference when it changes
  useEffect(() => {
    localStorage.setItem('preferredVoice', selectedVoice);
  }, [selectedVoice]);

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

  const connectToVoiceChat = async () => {
    try {
      console.log("Starting WebRTC voice chat connection with voice:", selectedVoice);

      webRTCManagerRef.current = new WebRTCChatManager(
        async (data) => {
          if (messageHandlerRef.current) {
            await messageHandlerRef.current.handleMessage(data);
          }

          // Handle recording state based on voice activity
          if (data.type === 'input_audio_buffer.speech_started') {
            setIsRecording(true);
          } else if (data.type === 'input_audio_buffer.speech_stopped') {
            setIsRecording(false);
          }
        },
        (error) => {
          console.error('WebRTC error:', error);
          toast({
            title: "Connection Error",
            description: error,
            variant: "destructive",
          });
          setIsConnected(false);
          onConnectionChange(false);
        },
        // Pass the transcript saving callback
        saveTranscript
      );

      await webRTCManagerRef.current.init(clientId, selectedVoice);
      
      setIsConnected(true);
      onConnectionChange(true);

      toast({
        title: "Connected",
        description: `Voice chat is now active with ${selectedVoice} voice`,
      });

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
    webRTCManagerRef.current?.disconnect();
    setIsConnected(false);
    setIsRecording(false);
    setIsSpeaking(false);
    setIsAISpeaking(false);
    onConnectionChange(false);
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
    selectedVoice,
    currentTranscript: messageHandlerRef.current?.getCurrentTranscript() || '',
    connectToVoiceChat,
    disconnectFromVoiceChat,
    toggleAudio,
    setSelectedVoice
  };
};
