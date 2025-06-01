
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CaseDiscussionMessage, getCaseDiscussionMessages, generateCaseDiscussionResponse } from "@/utils/caseDiscussionService";
import { supabase } from "@/integrations/supabase/client";

export const useCaseDiscussion = (clientId: string) => {
  const [messages, setMessages] = useState<CaseDiscussionMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();

  // Format timestamp
  const formatTimestamp = (): string => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Load case discussion history
  useEffect(() => {
    const loadCaseDiscussionHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const { messages, error } = await getCaseDiscussionMessages(clientId);
        
        if (error) {
          console.error("Error loading discussion history:", error);
          toast({
            title: "Error loading discussion",
            description: error,
            variant: "destructive",
          });
        } else {
          setMessages(messages);
        }
      } catch (err: any) {
        console.error("Error loading case discussion history:", err);
        toast({
          title: "Error",
          description: "Failed to load discussion history. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (clientId) {
      loadCaseDiscussionHistory();
    }
  }, [clientId, toast]);

  // Handle sending a message
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    const timestamp = formatTimestamp();
    
    // Get the current user
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to send messages.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Create attorney message object
    const attorneyMessage: CaseDiscussionMessage = {
      client_id: clientId,
      user_id: userId,
      content: message,
      role: "attorney",
      timestamp
    };
    
    // Update the UI immediately with the attorney's message
    setMessages(prev => [...prev, attorneyMessage]);
    
    try {
      console.log(`Sending message for client ID: ${clientId}`);
      
      // Generate AI response
      const { response, timestamp: aiTimestamp, error } = await generateCaseDiscussionResponse(
        clientId,
        message,
        messages
      );
      
      if (error) {
        console.error("Error generating AI response:", error);
        toast({
          title: "AI Response Error",
          description: `${error}`,
          variant: "destructive",
        });
        
        // Still display the AI error response to the user
        const errorMessage: CaseDiscussionMessage = {
          client_id: clientId,
          user_id: userId,
          content: response, // This contains the friendly error message
          role: "ai",
          timestamp: aiTimestamp || formatTimestamp()
        };
        
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
      
      // Add AI response to messages
      const aiMessage: CaseDiscussionMessage = {
        client_id: clientId,
        user_id: userId,
        content: response,
        role: "ai",
        timestamp: aiTimestamp || formatTimestamp()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      console.error("Error in case discussion:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      
      // Add error message to the chat
      const errorMessage: CaseDiscussionMessage = {
        client_id: clientId,
        user_id: userId,
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        role: "ai",
        timestamp: formatTimestamp()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Subscribe to real-time updates for case discussions
  useEffect(() => {
    const channel = supabase
      .channel('case-discussions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_discussions',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          // Make sure we don't duplicate messages that we've already added manually
          const newMessage = payload.new as CaseDiscussionMessage;
          setMessages(currentMessages => {
            const messageExists = currentMessages.some(
              msg => msg.id === newMessage.id || 
                    (msg.content === newMessage.content && 
                     msg.timestamp === newMessage.timestamp && 
                     msg.role === newMessage.role)
            );
            
            if (!messageExists) {
              return [...currentMessages, newMessage];
            }
            return currentMessages;
          });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  return {
    messages,
    isLoading,
    isLoadingHistory,
    handleSendMessage,
    formatTimestamp
  };
};
