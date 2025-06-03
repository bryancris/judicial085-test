
import React from "react";
import { CaseDiscussionMessage } from "@/utils/caseDiscussionService";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { processMarkdown } from "@/utils/markdownProcessor";
import { processLawReferencesSync } from "@/utils/lawReferenceUtils";
import ResearchFindingsButton from "./ResearchFindingsButton";

interface CaseDiscussionMessageItemProps {
  message: CaseDiscussionMessage;
  clientId?: string;
  onFindingsAdded?: () => void;
}

const CaseDiscussionMessageItem: React.FC<CaseDiscussionMessageItemProps> = ({ 
  message, 
  clientId,
  onFindingsAdded 
}) => {
  const isAttorney = message.role === "attorney";
  
  // Process content with markdown and law references
  const processedContent = React.useMemo(() => {
    let content = message.content;
    content = processLawReferencesSync(content);
    return processMarkdown(content);
  }, [message.content]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 group",
        isAttorney ? "flex-row-reverse" : "",
      )}
    >
      <Avatar className={cn("mt-1", isAttorney ? "bg-purple-100" : "bg-blue-100")}>
        <AvatarFallback className={cn(
          "text-sm",
          isAttorney ? "text-purple-700" : "text-blue-700"
        )}>
          {isAttorney ? <User size={20} /> : <Bot size={20} />}
        </AvatarFallback>
      </Avatar>
      <div className={cn(
        "flex flex-col",
        isAttorney ? "items-end" : "items-start",
        "max-w-[80%] md:max-w-[70%]"
      )}>
        <div className={cn(
          "px-4 py-2 rounded-lg",
          isAttorney ? "bg-purple-100 text-purple-900" : "bg-blue-100 text-blue-900"
        )}>
          <div 
            className="text-sm prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </div>
        <span className="text-xs mt-1 text-muted-foreground">{message.timestamp}</span>
        
        {/* Add Research Findings Button for AI messages */}
        {!isAttorney && clientId && (
          <ResearchFindingsButton
            messageContent={message.content}
            clientId={clientId}
            onFindingsAdded={onFindingsAdded}
          />
        )}
      </div>
    </div>
  );
};

export default CaseDiscussionMessageItem;
