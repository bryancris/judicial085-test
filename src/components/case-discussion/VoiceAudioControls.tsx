
import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceAudioControlsProps {
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

const VoiceAudioControls: React.FC<VoiceAudioControlsProps> = ({
  audioEnabled,
  onToggleAudio
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggleAudio}
      className={cn(
        "flex items-center gap-2",
        !audioEnabled && "opacity-50"
      )}
    >
      {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      {audioEnabled ? "Audio On" : "Audio Off"}
    </Button>
  );
};

export default VoiceAudioControls;
