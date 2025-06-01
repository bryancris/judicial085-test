
import { AudioQueue } from '@/utils/voiceChat';

export class AudioPlaybackManager {
  private audioQueue: AudioQueue | null = null;
  private audioContext: AudioContext | null = null;

  initialize(): void {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    this.audioQueue = new AudioQueue(this.audioContext);
  }

  async playAudio(audioData: Uint8Array): Promise<void> {
    if (this.audioQueue) {
      await this.audioQueue.addToQueue(audioData);
    }
  }

  cleanup(): void {
    this.audioContext?.close();
    this.audioContext = null;
    this.audioQueue = null;
  }
}
