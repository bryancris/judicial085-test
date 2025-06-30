
import React, { useState, useRef, useEffect } from "react";
import { SendHorizonal, Mic, MicOff } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/utils/voiceToTextUtils";
import { useToast } from "@/hooks/use-toast";

interface ContractReviewChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ContractReviewChatInput: React.FC<ContractReviewChatInputProps> = ({ 
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
  
  const toggleRecording = async () => {
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
          description: "Your browser doesn't support speech recognition. Try using Chrome, Edge, or Safari.",
          variant: "destructive",
        });
        return;
      }

      try {
        const recorder = await startRecording(
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
          },
          () => {
            // This callback is called only when recording actually starts
            toast({
              title: "Recording Started",
              description: "Speak now. The text will appear in the input field.",
            });
          }
        );
        
        if (recorder) {
          setIsRecording(true);
          stopRecordingRef.current = recorder;
        }
      } catch (error: any) {
        toast({
          title: "Failed to Start Recording",
          description: error.message || "Unable to start speech recognition",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="border-t p-3 bg-background">
      <div className="flex gap-2 items-end">
        <TextareaAutosize
          ref={textareaRef}
          className={`flex-grow resize-none border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-foreground bg-card ${isRecording ? 'border-red-500 border-2' : ''}`}
          placeholder="Ask about contracts or request contract analysis..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          maxRows={6}
          disabled={isLoading}
          style={{ color: "currentColor" }}
        />
        <div className="flex flex-col gap-2">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={toggleRecording}
            title={isRecording ? "Stop recording" : "Start voice input"}
            type="button"
            disabled={isLoading}
            className={isRecording ? "" : "bg-green-500 hover:bg-green-600 text-white"}
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
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <SendHorizonal className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        Shift + Enter for new line • Click microphone to use voice input • Use "Select Documents" to choose documents for review
      </div>
    </div>
  );
};

export default ContractReviewChatInput;
