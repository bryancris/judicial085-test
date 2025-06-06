
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface VoiceSelectionDropdownProps {
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  disabled?: boolean;
}

const AVAILABLE_VOICES = [
  { value: 'alloy', label: 'Alloy (Neutral)' },
  { value: 'ash', label: 'Ash (Male)' },
  { value: 'ballad', label: 'Ballad (Female)' },
  { value: 'coral', label: 'Coral (Female)' },
  { value: 'echo', label: 'Echo (Male)' },
  { value: 'sage', label: 'Sage (Female)' },
  { value: 'shimmer', label: 'Shimmer (Female)' },
  { value: 'verse', label: 'Verse (Male)' }
];

const VoiceSelectionDropdown: React.FC<VoiceSelectionDropdownProps> = ({
  selectedVoice,
  onVoiceChange,
  disabled = false
}) => {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="voice-select" className="text-sm font-medium">
        AI Voice
      </Label>
      <Select 
        value={selectedVoice} 
        onValueChange={onVoiceChange} 
        disabled={disabled}
      >
        <SelectTrigger id="voice-select" className="w-full">
          <SelectValue placeholder="Select a voice" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_VOICES.map((voice) => (
            <SelectItem key={voice.value} value={voice.value}>
              {voice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default VoiceSelectionDropdown;
