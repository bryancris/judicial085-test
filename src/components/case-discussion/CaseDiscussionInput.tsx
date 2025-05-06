
import React, { useState, useRef, useEffect } from "react";
import { SendHorizonal } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="border-t p-3 bg-background">
      <div className="flex gap-2 items-end">
        <TextareaAutosize
          ref={textareaRef}
          className="flex-grow resize-none border rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Ask a question about this case..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          maxRows={6}
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="bg-[#9b87f5] hover:bg-[#8a75f5] text-white"
        >
          <SendHorizonal className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        Shift + Enter for new line
      </div>
    </div>
  );
};

export default CaseDiscussionInput;
