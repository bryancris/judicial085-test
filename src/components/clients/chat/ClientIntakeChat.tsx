
import React, { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ChatMessage, { ChatMessageProps, MessageRole } from "./ChatMessage";

const mockMessages: ChatMessageProps[] = [
  {
    content: "is there anything else you remember",
    timestamp: "6:34 PM",
    role: "attorney"
  },
  {
    content: "We were barbequing that might have been the smell.",
    timestamp: "6:35 PM",
    role: "client"
  },
  {
    content: "what time did this happen",
    timestamp: "6:45 PM",
    role: "attorney"
  },
  {
    content: "9pm",
    timestamp: "6:45 PM",
    role: "attorney"
  },
  {
    content: "How old are you",
    timestamp: "6:50 PM",
    role: "attorney"
  },
  {
    content: "23",
    timestamp: "6:50 PM",
    role: "attorney"
  }
];

const legalAnalysis = [
  {
    content: `**RELEVANT TEXAS LAW:** Since the client is an adult, the general provisions of the Texas Penal Code and Texas Code of Criminal Procedure apply in terms of criminal liability, arrest procedures, and potential penalties. Additionally, the Fourth Amendment considerations regarding searches and seizures remain pertinent.`,
    timestamp: "6:50 PM"
  },
  {
    content: `**ANALYSIS:** The client is 23 years old, which means they are considered an adult under Texas law. This age is relevant for determining the applicable legal procedures and rights, including those related to arrest, questioning, and charges.`,
    timestamp: "6:50 PM"
  },
  {
    content: `**POTENTIAL LEGAL ISSUES:** As an adult, the client is subject to the full scope of criminal law procedures and penalties. There are no additional protections afforded to minors, such as those found in the Texas Family Code.`,
    timestamp: "6:50 PM"
  },
  {
    content: `**SUGGESTED FOLLOW-UP QUESTIONS:**
1. Have you been informed of the specific charges against you, and have you been provided with any related documentation?
2. Do you have any prior criminal record or legal issues that might be relevant to your current situation?
3. Are there any personal or employment circumstances that could be impacted by these legal proceedings?`,
    timestamp: "6:50 PM"
  },
  {
    content: `**RELEVANT TEXAS LAW:** Since the client is an adult, the general provisions of the Texas Penal Code and Texas Code of Criminal Procedure apply in terms of criminal liability, arrest procedures, and potential penalties. Additionally, the Fourth Amendment considerations regarding searches and seizures remain pertinent.`,
    timestamp: "6:50 PM"
  }
];

interface ClientIntakeChatProps {
  clientId: string;
}

const ClientIntakeChat = ({ clientId }: ClientIntakeChatProps) => {
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"attorney" | "client">("attorney");

  const handleSendMessage = () => {
    if (message.trim()) {
      // In a real app, you would save this message to the database
      console.log(`Sending message as ${activeTab}:`, message);
      
      // Clear the input
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-400px)] min-h-[500px]">
      {/* Attorney Input Side */}
      <div className="flex flex-col border rounded-lg overflow-hidden">
        <div className="bg-primary text-primary-foreground p-3">
          <h3 className="font-medium">Attorney Input</h3>
          <div className="text-xs opacity-80">6:50 PM</div>
        </div>
        <div className="flex-grow overflow-y-auto p-4 bg-card">
          {mockMessages.map((msg, index) => (
            <ChatMessage key={index} {...msg} />
          ))}
        </div>
        <div className="border-t p-3 bg-background">
          <div className="flex items-center mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={activeTab === "attorney" ? "bg-muted" : ""}
              onClick={() => setActiveTab("attorney")}
            >
              <span className="flex items-center gap-1">
                Attorney Question
              </span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className={activeTab === "client" ? "bg-muted" : ""}
              onClick={() => setActiveTab("client")}
            >
              <span className="flex items-center gap-1">
                Client Response
              </span>
            </Button>
          </div>
          <div className="flex">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Enter your ${activeTab === "attorney" ? "question to the client" : "response as client"}...`}
              className="min-h-[80px] resize-none flex-grow"
            />
            <Button 
              className="ml-2 self-end"
              onClick={handleSendMessage}
            >
              <Send className="h-4 w-4 mr-1" /> Ask Question
            </Button>
          </div>
        </div>
      </div>

      {/* Legal Analysis Side */}
      <div className="flex flex-col border rounded-lg overflow-hidden">
        <div className="bg-brand-burgundy text-white p-3">
          <h3 className="font-medium">Legal Analysis</h3>
          <div className="text-xs opacity-80">6:50 PM</div>
        </div>
        <div className="flex-grow overflow-y-auto p-4 bg-card">
          {legalAnalysis.map((item, index) => (
            <div key={index} className="mb-6">
              <p className="whitespace-pre-wrap">{item.content}</p>
              <div className="text-xs text-muted-foreground mt-1">{item.timestamp}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientIntakeChat;
