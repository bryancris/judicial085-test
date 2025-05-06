
import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/utils/voiceToTextUtils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  activeTab: "attorney" | "client";
  onTabChange: (tab: "attorney" | "client") => void;
  prefilledMessage?: string;
}

const ChatInput = ({ 
  onSendMessage, 
  isLoading, 
  activeTab, 
  onTabChange,
  prefilledMessage = "" 
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const stopRecordingRef = useRef<{ stop: () => void } | null>(null);
  
  const { isSupported, startRecording } = useSpeechRecognition();
  
  // Update message when prefilledMessage changes
  useEffect(() => {
    if (prefilledMessage && prefilledMessage.trim() !== "") {
      console.log("Setting prefilled message:", prefilledMessage);
      setMessage(prefilledMessage);
      
      // Focus the textarea when prefilled message changes
      if (textareaRef.current) {
        textareaRef.current.focus();
        
        // Set cursor at the end of the text
        const length = prefilledMessage.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }
  }, [prefilledMessage]);

  // Clean up recording on component unmount
  useEffect(() => {
    return () => {
      if (stopRecordingRef.current) {
        stopRecordingRef.current.stop();
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (stopRecordingRef.current) {
        stopRecordingRef.current.stop();
        stopRecordingRef.current = null;
      }
      setIsRecording(false);
    } else {
      // Start recording
      if (!isSupported) {
        toast({
          title: "Speech Recognition Not Supported",
          description: "Your browser doesn't support speech recognition. Try using a modern browser like Chrome.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Recording Started",
        description: "Speak now. The text will appear in the input field.",
      });

      setIsRecording(true);
      
      const recorder = startRecording(
        (text) => {
          setMessage(text);
        },
        (error) => {
          toast({
            title: "Recording Error",
            description: error,
            variant: "destructive",
          });
          setIsRecording(false);
        }
      );
      
      stopRecordingRef.current = recorder;
    }
  };

  // Show microphone button for both attorney and client tabs
  const showMicButton = !isLoading;

  return (
    <div className="border-t p-3 bg-background">
      <div className="flex items-center mb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className={activeTab === "attorney" ? "bg-muted" : ""}
          onClick={() => onTabChange("attorney")}
        >
          <span className="flex items-center gap-1">
            Attorney
          </span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className={activeTab === "client" ? "bg-muted" : ""}
          onClick={() => onTabChange("client")}
        >
          <span className="flex items-center gap-1">
            Client
          </span>
        </Button>
      </div>
      <div className="flex">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Enter ${activeTab === "attorney" ? "attorney's question" : "client's response"}...`}
          className={`min-h-[80px] resize-none flex-grow ${isRecording ? 'border-red-500 border-2' : ''}`}
          disabled={isLoading}
        />
        <div className="ml-2 flex flex-col gap-2 justify-end">
          {showMicButton && (
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={toggleRecording}
              title={isRecording ? "Stop recording" : "Start voice input"}
              type="button"
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Send as {activeTab === "attorney" ? "Attorney" : "Client"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
