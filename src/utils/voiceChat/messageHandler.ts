
import { WebSocketMessage } from '@/types/voiceChat';

export class MessageHandler {
  private onTranscriptUpdate: (transcript: string, isUser: boolean) => void;
  private currentTranscript = '';
  private setIsSpeaking: (speaking: boolean) => void;
  private setIsAISpeaking: (speaking: boolean) => void;
  private audioPlaybackManager: any;
  private audioEnabled: boolean;
  private toast: any;

  constructor(
    onTranscriptUpdate: (transcript: string, isUser: boolean) => void,
    setIsSpeaking: (speaking: boolean) => void,
    setIsAISpeaking: (speaking: boolean) => void,
    audioPlaybackManager: any,
    audioEnabled: boolean,
    toast: any
  ) {
    this.onTranscriptUpdate = onTranscriptUpdate;
    this.setIsSpeaking = setIsSpeaking;
    this.setIsAISpeaking = setIsAISpeaking;
    this.audioPlaybackManager = audioPlaybackManager;
    this.audioEnabled = audioEnabled;
    this.toast = toast;
  }

  async handleMessage(data: WebSocketMessage): Promise<void> {
    console.log('Received message type:', data.type);

    switch (data.type) {
      case 'session.created':
        console.log('Session created');
        break;
        
      case 'session.updated':
        console.log('Session updated');
        break;

      case 'input_audio_buffer.speech_started':
        this.setIsSpeaking(true);
        console.log('User started speaking');
        break;

      case 'input_audio_buffer.speech_stopped':
        this.setIsSpeaking(false);
        console.log('User stopped speaking');
        break;

      case 'response.audio.delta':
        if (this.audioEnabled && this.audioPlaybackManager) {
          const binaryString = atob(data.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await this.audioPlaybackManager.playAudio(bytes);
          this.setIsAISpeaking(true);
        }
        break;

      case 'response.audio.done':
        this.setIsAISpeaking(false);
        console.log('AI finished speaking');
        break;

      case 'response.audio_transcript.delta':
        this.currentTranscript += data.delta;
        break;

      case 'response.audio_transcript.done':
        if (this.currentTranscript) {
          this.onTranscriptUpdate(this.currentTranscript, false);
          this.currentTranscript = '';
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        this.onTranscriptUpdate(data.transcript, true);
        break;

      case 'error':
        console.error('Voice chat error:', data.error);
        this.toast({
          title: "Voice Chat Error",
          description: data.error,
          variant: "destructive",
        });
        break;
    }
  }

  getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  updateAudioEnabled(enabled: boolean): void {
    this.audioEnabled = enabled;
  }
}
