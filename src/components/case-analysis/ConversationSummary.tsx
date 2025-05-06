
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";
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
  const [conversation, setConversation] = useState<ChatMessageProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  
  const {
    notes,
    isLoading: isLoadingNotes,
    isSending,
    handleSendNote
  } = useCaseAnalysisChat(clientId);

  useEffect(() => {
    if (clientId) {
      fetchClientMessages(clientId);
    }
  }, [clientId]);

  const fetchClientMessages = async (clientId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_messages")
        .select("content, role, timestamp")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Get a representative sample - first few messages and most recent
        let selectedMessages = [];
        
        // If we have more than 6 messages, get a sample
        if (data.length > 6) {
          // Get first 2 messages
          selectedMessages = data.slice(0, 2);
          
          // Get middle 2 messages
          const middleIndex = Math.floor(data.length / 2);
          selectedMessages = [
            ...selectedMessages,
            data[middleIndex - 1],
            data[middleIndex]
          ];
          
          // Get last 2 messages
          selectedMessages = [
            ...selectedMessages,
            ...data.slice(-2)
          ];
        } else {
          // If 6 or fewer, use all messages
          selectedMessages = data;
        }
        
        // Format the messages
        const formattedMessages = selectedMessages.map(msg => ({
          content: msg.content,
          timestamp: msg.timestamp,
          role: msg.role as "attorney" | "client"
        }));
        
        setConversation(formattedMessages);
      } else {
        setConversation([]);
      }
    } catch (err) {
      console.error("Error fetching client messages:", err);
    } finally {
      setLoading(false);
    }
  };

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
        <ConversationList conversation={conversation} loading={loading} />
        
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
