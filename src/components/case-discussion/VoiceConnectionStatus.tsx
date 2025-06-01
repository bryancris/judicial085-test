
import React from 'react';
import { cn } from '@/lib/utils';

interface VoiceConnectionStatusProps {
  isConnected: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  isAISpeaking: boolean;
}

const VoiceConnectionStatus: React.FC<VoiceConnectionStatusProps> = ({
  isConnected,
  isRecording,
  isSpeaking,
  isAISpeaking
}) => {
  return (
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
  );
};

export default VoiceConnectionStatus;
