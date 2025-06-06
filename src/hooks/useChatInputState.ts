
import { useState, useEffect, useRef } from "react";

interface UseChatInputStateProps {
  prefilledMessage?: string;
}

export const useChatInputState = ({ prefilledMessage = "" }: UseChatInputStateProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSendMessage = (onSendMessage: (message: string) => void) => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, onSendMessage: (message: string) => void) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(onSendMessage);
    }
  };

  return {
    message,
    setMessage,
    textareaRef,
    handleSendMessage,
    handleKeyDown
  };
};
