
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorder, AudioQueue, encodeAudioForAPI } from '@/utils/voiceChat';
import { cn } from '@/lib/utils';

interface VoiceDiscussionInterfaceProps {
  clientId: string;
  onTranscriptUpdate: (transcript: string, isUser: boolean) => void;
  onConnectionChange: (connected: boolean) => void;
}

const VoiceDiscussionInterface: React.FC<VoiceDiscussionInterfaceProps> = ({
  clientId,
  onTranscriptUpdate,
  onConnectionChange
}) => {
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

  const connectToVoiceChat = async () => {
    try {
      console.log(`Connecting to voice chat for client: ${clientId}`);
      
      // Get project reference from current URL
      const projectRef = window.location.hostname.split('.')[0];
      const wsUrl = `wss://${projectRef}.functions.supabase.co/functions/v1/realtime-voice-chat?clientId=${clientId}`;
      
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
          description: "Failed to connect to voice chat",
          variant: "destructive",
        });
      };

      wsRef.current.onclose = () => {
        console.log('Voice chat disconnected');
        setIsConnected(false);
        setIsRecording(false);
        setIsSpeaking(false);
        setIsAISpeaking(false);
        onConnectionChange(false);
        stopRecording();
      };

    } catch (error) {
      console.error('Error connecting to voice chat:', error);
      toast({
        title: "Connection Failed",
        description: "Could not establish voice chat connection",
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

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    toast({
      title: audioEnabled ? "Audio Muted" : "Audio Enabled",
      description: audioEnabled ? "You won't hear AI responses" : "You'll now hear AI responses",
    });
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Voice Discussion</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAudio}
              className={cn(
                "flex items-center gap-2",
                !audioEnabled && "opacity-50"
              )}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              {audioEnabled ? "Audio On" : "Audio Off"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-sm",
              isConnected 
                ? "bg-green-100 text-green-800" 
                : "bg-gray-100 text-gray-800"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-gray-400"
              )} />
              {isConnected ? "Connected" : "Disconnected"}
            </div>

            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Recording
              </div>
            )}

            {isSpeaking && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Speaking
              </div>
            )}

            {isAISpeaking && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                AI Speaking
              </div>
            )}
          </div>

          {/* Main Control Button */}
          <Button
            onClick={isConnected ? disconnectFromVoiceChat : connectToVoiceChat}
            size="lg"
            className={cn(
              "flex items-center gap-2 px-8 py-4 rounded-full",
              isConnected 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-green-500 hover:bg-green-600 text-white"
            )}
          >
            {isConnected ? (
              <>
                <PhoneOff className="h-5 w-5" />
                End Voice Chat
              </>
            ) : (
              <>
                <Phone className="h-5 w-5" />
                Start Voice Chat
              </>
            )}
          </Button>

          {/* Current Transcript Preview */}
          {currentTranscript && (
            <div className="w-full p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">AI is saying:</p>
              <p className="text-sm">{currentTranscript}</p>
            </div>
          )}

          <p className="text-xs text-center text-gray-500 max-w-md">
            Click "Start Voice Chat" to begin a voice conversation with the AI assistant. 
            The AI has full access to this client's case information and can help with legal analysis and strategy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceDiscussionInterface;
