
import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import CaseDiscussionMessageItem from "./CaseDiscussionMessageItem";
import ResearchLoading from "./ResearchLoading";
import { CaseDiscussionMessage } from "@/utils/caseDiscussionService";

interface CaseDiscussionChatViewProps {
  messages: CaseDiscussionMessage[];
  isLoading: boolean;
  clientId: string;
  onFindingsAdded?: () => void;
  researchStage?: 'analyzing' | 'researching' | 'formatting' | 'saving';
  researchType?: 'similar-cases' | 'legal-research' | 'general';
}

const CaseDiscussionChatView: React.FC<CaseDiscussionChatViewProps> = ({ 
  messages, 
  isLoading,
  clientId,
  onFindingsAdded,
  researchStage = 'analyzing',
  researchType = 'general'
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex-grow overflow-y-auto p-4 bg-card h-full">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Start a discussion about this case by asking questions or requesting specific legal research.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message, index) => (
            <CaseDiscussionMessageItem 
              key={index} 
              message={message}
              clientId={clientId}
              onFindingsAdded={onFindingsAdded}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
      {isLoading && (
        <ResearchLoading 
          isVisible={isLoading}
          stage={researchStage}
          researchType={researchType}
        />
      )}
    </div>
  );
};

export default CaseDiscussionChatView;
