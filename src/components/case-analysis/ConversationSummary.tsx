
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareIcon, UserIcon, UserRoundIcon } from "lucide-react";

interface ConversationSummaryProps {
  summary: string;
  isLoading?: boolean;
}

const ConversationSummary: React.FC<ConversationSummaryProps> = ({
  summary,
  isLoading = false
}) => {
  // Simple mock conversation for display
  const mockConversation = [
    { role: "attorney", content: "Can you describe the incident that occurred on May 15th?" },
    { role: "client", content: "I was at the shopping mall when security approached me and accused me of shoplifting. They claimed they had video evidence, but I didn't take anything from the store." },
    { role: "attorney", content: "Were there any witnesses to the incident? Anyone who was with you that day?" },
    { role: "client", content: "Yes, my friend Sarah was with me the entire time. She saw everything that happened and can confirm I didn't take anything." },
    { role: "attorney", content: "Did the security officers search you or your belongings?" },
    { role: "client", content: "They asked to look in my bag. I allowed them to, and they didn't find any merchandise from the store." }
  ];

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <MessageSquareIcon className="h-5 w-5 mr-2" />
          Conversation Summary
          {isLoading && (
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockConversation.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'attorney' ? 'justify-start' : 'justify-end'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'attorney' 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-brand-burgundy text-white'
                }`}
              >
                <div className="flex items-center mb-1">
                  {message.role === 'attorney' ? (
                    <UserIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <UserRoundIcon className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-xs font-medium">
                    {message.role === 'attorney' ? 'Attorney' : 'Client'}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 border-t pt-4">
          <h4 className="font-medium mb-2">Key Takeaways:</h4>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationSummary;
