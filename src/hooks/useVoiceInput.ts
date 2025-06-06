
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/utils/voiceToTextUtils";

export const useVoiceInput = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const { toast } = useToast();
  const stopRecordingRef = useRef<{ stop: () => void } | null>(null);
  
  const { isSupported, startRecording } = useSpeechRecognition();

  // Clean up recording on component unmount
  useEffect(() => {
    return () => {
      if (stopRecordingRef.current) {
        stopRecordingRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = (onTextUpdate: (text: string) => void) => {
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
          title: "Voice Input Not Available",
          description: "Your browser doesn't support voice input. Please use Chrome, Edge, or Safari for voice features.",
          variant: "destructive",
        });
        return;
      }

      setIsRequestingPermission(true);

      // startRecording is NOT async - don't await it
      const recorder = startRecording(
        (text) => {
          onTextUpdate(text);
        },
        (error) => {
          console.error("Voice recording error:", error);
          toast({
            title: "Voice Input Error",
            description: error,
            variant: "destructive",
          });
          setIsRecording(false);
          setIsRequestingPermission(false);
        },
        () => {
          // This callback is called only when recording actually starts
          setIsRequestingPermission(false);
          setIsRecording(true);
          toast({
            title: "Voice Input Active",
            description: "Speak now. Your words will appear in the text field.",
          });
        }
      );
      
      if (recorder) {
        stopRecordingRef.current = recorder;
      } else {
        setIsRequestingPermission(false);
      }
    }
  };

  return {
    isRecording,
    isRequestingPermission,
    isSupported,
    toggleRecording
  };
};
