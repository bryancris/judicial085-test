
import React, { useState, useRef, useEffect } from "react";
import { SendHorizonal, Loader2, Mic, MicOff } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface CaseDiscussionInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const CaseDiscussionInput: React.FC<CaseDiscussionInputProps> = ({ 
  onSendMessage, 
  isLoading 
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isRecording, isRequestingPermission, isSupported, toggleRecording } = useVoiceInput();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = async () => {
    // Android compatibility: blur textarea when starting recording
    if (!isRecording && textareaRef.current) {
      textareaRef.current.blur();
    }

    await toggleRecording((text: string) => {
      setMessage(text);
    });

    // Android compatibility: re-focus textarea when stopping recording
    if (isRecording && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div className="border-t p-3 bg-background">
      <div className="flex gap-2 items-end">
        <TextareaAutosize
          ref={textareaRef}
          className="flex-grow resize-none border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#9b87f5] focus:border-transparent text-foreground bg-background dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 placeholder:text-muted-foreground"
          placeholder="Ask a question about this case..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          maxRows={6}
          disabled={isLoading}
        />
        {isSupported && (
          <Button
            onClick={handleVoiceToggle}
            disabled={isLoading}
            variant="outline"
            className={`${
              isRecording
                ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isRequestingPermission ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isRecording ? "Stop recording" : "Start voice input"}
            </span>
          </Button>
        )}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="bg-[#9b87f5] hover:bg-[#8a75f5] text-white"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
          <span className="sr-only">Send</span>
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        Shift + Enter for new line{isSupported && " • Click the microphone to use voice input"} • Use the Voice Chat tab for voice conversations
      </div>
    </div>
  );
};

export default CaseDiscussionInput;
