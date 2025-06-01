
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import VoiceConnectionStatus from './VoiceConnectionStatus';
import VoiceControlButton from './VoiceControlButton';
import VoiceTranscriptPreview from './VoiceTranscriptPreview';
import VoiceAudioControls from './VoiceAudioControls';

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
  const {
    isConnected,
    isRecording,
    isSpeaking,
    isAISpeaking,
    audioEnabled,
    currentTranscript,
    connectToVoiceChat,
    disconnectFromVoiceChat,
    toggleAudio
  } = useVoiceChat({
    clientId,
    onTranscriptUpdate,
    onConnectionChange
  });

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Voice Discussion</h3>
          <div className="flex items-center gap-2">
            <VoiceAudioControls
              audioEnabled={audioEnabled}
              onToggleAudio={toggleAudio}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <VoiceConnectionStatus
            isConnected={isConnected}
            isRecording={isRecording}
            isSpeaking={isSpeaking}
            isAISpeaking={isAISpeaking}
          />

          <VoiceControlButton
            isConnected={isConnected}
            onConnect={connectToVoiceChat}
            onDisconnect={disconnectFromVoiceChat}
          />

          <VoiceTranscriptPreview currentTranscript={currentTranscript} />

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
