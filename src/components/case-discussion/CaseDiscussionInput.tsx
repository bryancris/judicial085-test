
import React, { useState, useRef, useEffect } from "react";
import { SendHorizonal, Mic, MicOff, Loader2 } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/utils/voiceToTextUtils";
import { useToast } from "@/hooks/use-toast";

interface CaseDiscussionInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const CaseDiscussionInput: React.FC<CaseDiscussionInputProps> = ({ 
  onSendMessage, 
  isLoading 
}) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stopRecordingRef = useRef<{ stop: () => void } | null>(null);
  const { toast } = useToast();
  
  // Initialize speech recognition
  const { isSupported, startRecording } = useSpeechRecognition();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
  // Clean up recording on component unmount
  useEffect(() => {
    return () => {
      if (stopRecordingRef.current) {
        stopRecordingRef.current.stop();
      }
    };
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

  return (
    <div className="border-t p-3 bg-background">
      <div className="flex gap-2 items-end">
        <TextareaAutosize
          ref={textareaRef}
          className={`flex-grow resize-none border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#9b87f5] focus:border-transparent ${isRecording ? 'border-red-500 border-2' : ''}`}
          placeholder="Ask a question about this case..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          maxRows={6}
          disabled={isLoading}
        />
        <div className="flex flex-col gap-2">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={toggleRecording}
            title={isRecording ? "Stop recording" : "Start voice input"}
            type="button"
            disabled={isLoading}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
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
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        Shift + Enter for new line • Click microphone to use voice input
      </div>
    </div>
  );
};

export default CaseDiscussionInput;
