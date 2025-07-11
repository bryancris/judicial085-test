import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, X, Minimize2, Maximize2 } from "lucide-react";
import { DocumentChatView } from './DocumentChatView';
import { DocumentChatInput } from './DocumentChatInput';
import { useToast } from "@/hooks/use-toast";
import { generateDocumentChatCompletion } from "@/utils/api/documentChatService";

interface DocumentChatSidebarProps {
  documentTitle: string;
  documentContent: string;
  clientId: string;
  onDocumentUpdate?: (content: string) => void;
}

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const DocumentChatSidebar: React.FC<DocumentChatSidebarProps> = ({
  documentTitle,
  documentContent,
  clientId,
  onDocumentUpdate
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();

  // Add welcome message on component mount
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      content: "Hello! I'm your AI document assistant. I can help you create, review, and improve your legal documents. Try asking me to:\n\n• Review this document\n• Suggest improvements\n• Add legal citations\n• Generate content\n• Check grammar and structure",
      role: 'assistant',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await generateDocumentChatCompletion(
        content,
        documentTitle,
        documentContent,
        clientId
      );

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive"
        });
        return;
      }

      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.text,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "Review this document",
    "Suggest improvements",
    "Check grammar",
    "Add legal citations"
  ];

  if (isCollapsed) {
    return (
      <div className="w-14 bg-white border-r p-2 hidden lg:block print-hide">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="w-full h-10"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r flex flex-col hidden lg:flex print-hide">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            AI Document Assistant
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="h-6 w-6 p-0"
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
          <div className="grid grid-cols-1 gap-1">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSendMessage(action)}
                className="h-7 text-xs justify-start"
                disabled={isLoading}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <DocumentChatView messages={messages} isLoading={isLoading} />
        <DocumentChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default DocumentChatSidebar;