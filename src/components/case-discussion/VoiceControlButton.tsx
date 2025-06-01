
import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceControlButtonProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const VoiceControlButton: React.FC<VoiceControlButtonProps> = ({
  isConnected,
  onConnect,
  onDisconnect
}) => {
  return (
    <Button
      onClick={isConnected ? onDisconnect : onConnect}
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
  );
};

export default VoiceControlButton;
