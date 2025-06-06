
export interface UseVoiceChatProps {
  clientId: string;
  onTranscriptUpdate: (transcript: string, isUser: boolean) => void;
  onConnectionChange: (connected: boolean) => void;
}

export interface VoiceChatState {
  isConnected: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  isAISpeaking: boolean;
  audioEnabled: boolean;
  selectedVoice: string;
  currentTranscript: string;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface AudioRecorderCallback {
  (audioData: Float32Array): void;
}
