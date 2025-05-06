
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, User, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

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

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Conversation Summary
          {isLoading && (
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          </div>
        ) : conversation.length > 0 ? (
          <div className="space-y-2 border p-4 rounded-md bg-muted/30">
            {conversation.map((message, index) => (
              <div key={index} className="py-2 border-b last:border-b-0 border-gray-100">
                <div className="flex items-center mb-1">
                  {message.role === 'attorney' ? (
                    <User className="h-4 w-4 mr-1 text-primary" />
                  ) : (
                    <UserRound className="h-4 w-4 mr-1 text-brand-burgundy" />
                  )}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full mr-2 ${
                    message.role === 'attorney' 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-brand-burgundy/10 text-brand-burgundy'
                  }`}>
                    {message.role === 'attorney' ? 'Attorney' : 'Client'}
                  </span>
                  <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                </div>
                <p className="text-sm pl-6">{message.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No conversation data available</p>
        )}
        
        <div className="mt-6 border-t pt-4">
          <h4 className="font-medium mb-2">Key Takeaways:</h4>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationSummary;
