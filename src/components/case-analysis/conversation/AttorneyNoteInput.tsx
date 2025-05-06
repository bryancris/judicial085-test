
import React, { useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  onSend 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };
  
  return (
    <div className="flex mt-4">
      <Textarea
        ref={textareaRef}
        value={noteInput}
        onChange={(e) => setNoteInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add attorney note..."
        className="min-h-[80px] resize-none flex-grow"
        disabled={isSending}
      />
      <div className="ml-2 flex flex-col justify-end">
        <Button 
          onClick={onSend}
          disabled={isSending || !noteInput.trim()}
        >
          {isSending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1"></span>
          ) : (
            <Send className="h-4 w-4 mr-1" />
          )}
          Add Note
        </Button>
      </div>
    </div>
  );
};

export default AttorneyNoteInput;
