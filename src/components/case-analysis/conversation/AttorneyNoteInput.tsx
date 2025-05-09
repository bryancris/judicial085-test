
import React, { useState, useRef, useEffect } from "react";
import { SendHorizontal, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/utils/voiceToTextUtils";
import { useToast } from "@/hooks/use-toast";

interface AttorneyNoteInputProps {
  noteInput: string;
  setNoteInput: (value: string) => void;
  isSending: boolean;
  onSend: () => void;
}

const AttorneyNoteInput: React.FC<AttorneyNoteInputProps> = ({
  noteInput,
  setNoteInput,
  isSending,
  onSend,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const stopRecordingRef = useRef<{ stop: () => void } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  
  // Initialize speech recognition
  const { isSupported, startRecording } = useSpeechRecognition();
  
  // Clean up recording on component unmount
  useEffect(() => {
    return () => {
      if (stopRecordingRef.current) {
        stopRecordingRef.current.stop();
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isSending) {
      e.preventDefault();
      onSend();
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
          setNoteInput(text);
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
    <div className="mt-3">
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add attorney notes..."
          className={`resize-none ${isRecording ? 'border-red-500 border-2' : ''}`}
          disabled={isSending}
        />
        <div className="flex flex-col gap-2">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={toggleRecording}
            title={isRecording ? "Stop recording" : "Start voice input"}
            type="button"
            disabled={isSending}
            className={isRecording ? "" : "bg-[#0EA5E9] hover:bg-[#0EA5E9]/80 text-white"}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Button 
            variant="secondary" 
            onClick={onSend} 
            disabled={!noteInput.trim() || isSending}
            size="icon"
            className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        Shift + Enter for new line • Click microphone to use voice input
      </div>
    </div>
  );
};

export default AttorneyNoteInput;
