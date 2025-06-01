
import { AudioRecorder } from '@/utils/voiceChat';
import { AudioRecorderCallback } from '@/types/voiceChat';

export class AudioRecordingManager {
  private recorder: AudioRecorder | null = null;
  private isRecording = false;

  async startRecording(onAudioData: AudioRecorderCallback): Promise<void> {
    if (this.isRecording) {
      return;
    }

    try {
      this.recorder = new AudioRecorder(onAudioData);
      await this.recorder.start();
      this.isRecording = true;
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  stopRecording(): void {
    if (this.recorder) {
      this.recorder.stop();
      this.recorder = null;
    }
    this.isRecording = false;
    console.log('Recording stopped');
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}
