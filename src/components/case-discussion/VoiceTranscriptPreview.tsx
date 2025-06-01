
import React from 'react';

interface VoiceTranscriptPreviewProps {
  currentTranscript: string;
}

const VoiceTranscriptPreview: React.FC<VoiceTranscriptPreviewProps> = ({
  currentTranscript
}) => {
  if (!currentTranscript) {
    return null;
  }

  return (
    <div className="w-full p-3 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600 mb-1">AI is saying:</p>
      <p className="text-sm">{currentTranscript}</p>
    </div>
  );
};

export default VoiceTranscriptPreview;
