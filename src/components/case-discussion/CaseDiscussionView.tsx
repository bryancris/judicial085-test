
import React from "react";
import { CaseDiscussionMessage } from "@/utils/caseDiscussionService";
import CaseDiscussionMessageItem from "./CaseDiscussionMessageItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface CaseDiscussionViewProps {
  messages: CaseDiscussionMessage[];
  isLoading: boolean;
}

const CaseDiscussionView: React.FC<CaseDiscussionViewProps> = ({
  messages,
  isLoading
}) => {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Start a Discussion</h3>
          <p className="text-muted-foreground">
            Ask questions about your case and get AI-powered legal insights based on your documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <CaseDiscussionMessageItem 
            key={message.id || `message-${index}`} 
            message={message} 
          />
        ))}
        
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">AI is thinking...</span>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default CaseDiscussionView;
