
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, User } from "lucide-react";
import { useCaseAnalysisChat } from "@/hooks/useCaseAnalysisChat";
import ConversationList from "./conversation/ConversationList";
import AttorneyNotesList from "./conversation/AttorneyNotesList";
import AttorneyNoteInput from "./conversation/AttorneyNoteInput";

interface ConversationSummaryProps {
  summary: string;
  isLoading?: boolean;
  clientId?: string;
}

const ConversationSummary: React.FC<ConversationSummaryProps> = ({
  summary,
  isLoading = false,
  clientId
}) => {
  const [noteInput, setNoteInput] = useState("");
  
  const {
    notes,
    conversation,
    isLoading: isLoadingNotes,
    loading: conversationLoading,
    isSending,
    handleSendNote
  } = useCaseAnalysisChat(clientId);

  const handleSendClick = () => {
    if (noteInput.trim() && clientId) {
      handleSendNote(noteInput);
      setNoteInput("");
    }
  };

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Client Conversation
          {isLoading && (
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ConversationList conversation={conversation || []} loading={conversationLoading} />
        
        {/* Attorney Notes Section */}
        <div className="mt-6 border-t pt-4">
          <h4 className="font-medium mb-2 flex items-center">
            <User className="h-4 w-4 mr-2 text-primary" /> 
            Attorney Notes:
          </h4>
          
          <AttorneyNotesList notes={notes} isLoading={isLoadingNotes} />
          
          {/* Note Input */}
          <AttorneyNoteInput 
            noteInput={noteInput}
            setNoteInput={setNoteInput}
            isSending={isSending}
            onSend={handleSendClick}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationSummary;
