
import React from "react";
import { Send, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageTextAreaProps {
  message: string;
  onMessageChange: (message: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  isRecording: boolean;
  isRequestingPermission: boolean;
  onToggleRecording: () => void;
  placeholder: string;
  sendButtonText: string;
  sendButtonColor: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const MessageTextArea = ({
  message,
  onMessageChange,
  onKeyDown,
  onSendMessage,
  isLoading,
  isRecording,
  isRequestingPermission,
  onToggleRecording,
  placeholder,
  sendButtonText,
  sendButtonColor,
  textareaRef
}: MessageTextAreaProps) => {
  const showMicButton = !isLoading;

  return (
    <div className="flex">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`min-h-[80px] resize-none flex-grow ${isRecording ? 'border-red-500 border-2' : ''}`}
        disabled={isLoading}
      />
      <div className="ml-2 flex flex-col gap-2 justify-end">
        {showMicButton && (
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={onToggleRecording}
            title={
              isRequestingPermission 
                ? "Requesting permission..." 
                : isRecording 
                  ? "Stop voice input" 
                  : "Start voice input"
            }
            type="button"
            className={isRecording ? "" : "bg-[#0EA5E9] hover:bg-[#0EA5E9]/80 text-white"}
            disabled={isRequestingPermission}
          >
            {isRequestingPermission ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}
        <Button 
          onClick={onSendMessage}
          disabled={isLoading || !message.trim()}
          className={sendButtonColor}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Send className="h-4 w-4 mr-1" />
          )}
          {sendButtonText}
        </Button>
      </div>
    </div>
  );
};

export default MessageTextArea;
