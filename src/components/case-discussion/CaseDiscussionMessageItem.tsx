
import React from "react";
import { CaseDiscussionMessage } from "@/utils/caseDiscussionService";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Bot, Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { processMarkdown } from "@/utils/markdownProcessor";
import { processLawReferencesSync } from "@/utils/lawReferenceUtils";
import ResearchFindingsButton from "./ResearchFindingsButton";
import ResearchActions from "./ResearchActions";

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
  
  // Check if message contains research results (updated for new format)
  const hasResearchSection = message.content.includes("🔍 Legal Research Analysis") || message.content.includes("## 📚 Legal Research Results");
  const researchType = hasResearchSection ? 
    (message.content.includes("similar court cases") || message.content.includes("Find similar court cases") ? "similar-cases" : "legal-research") : null;
  
  // Extract confidence from research content if available
  const extractConfidence = (content: string): number | undefined => {
    const confidenceMatch = content.match(/🟢 High Confidence|🟡 Medium Confidence|🟠 Low Confidence/);
    if (!confidenceMatch) return undefined;
    
    if (confidenceMatch[0].includes('High')) return 0.9;
    if (confidenceMatch[0].includes('Medium')) return 0.7;
    if (confidenceMatch[0].includes('Low')) return 0.4;
    return undefined;
  };
  
  const confidence = hasResearchSection ? extractConfidence(message.content) : undefined;
  
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
        {/* Research indicator badge */}
        {!isAttorney && hasResearchSection && (
          <div className="mb-2">
            <Badge variant="secondary" className="text-xs">
              {researchType === "similar-cases" ? (
                <>
                  <BookOpen className="h-3 w-3 mr-1" />
                  Similar Cases Research
                </>
              ) : (
                <>
                  <Search className="h-3 w-3 mr-1" />
                  Legal Research
                </>
              )}
            </Badge>
          </div>
        )}
        
        <div className={cn(
          "px-4 py-2 rounded-lg relative",
          isAttorney ? "bg-purple-100 text-purple-900" : "bg-blue-100 text-blue-900"
        )}>
          <div 
            className="text-sm prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
          
          {/* Enhanced Research Actions for AI messages with research */}
          {!isAttorney && clientId && hasResearchSection && (
            <ResearchActions
              messageContent={message.content}
              clientId={clientId}
              researchType={researchType}
              confidence={confidence}
              researchId={undefined} // Will be enhanced when message metadata is available
              onSaveToAnalysis={onFindingsAdded}
              onResearchFurther={() => {
                // This could trigger additional research
                console.log('Research further requested');
              }}
            />
          )}
          
          {/* Original Research Findings Button for non-research messages */}
          {!isAttorney && clientId && !hasResearchSection && (
            <div className="mt-3 flex justify-end">
              <ResearchFindingsButton
                messageContent={message.content}
                clientId={clientId}
                onFindingsAdded={onFindingsAdded}
              />
            </div>
          )}
        </div>
        <span className="text-xs mt-1 text-muted-foreground">{message.timestamp}</span>
      </div>
    </div>
  );
};

export default CaseDiscussionMessageItem;
