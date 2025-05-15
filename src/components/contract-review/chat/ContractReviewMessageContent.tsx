
import React from "react";
import { ContractReviewMessage } from "@/utils/contractReviewService";
import { cn } from "@/lib/utils";
import { processMarkdown } from "@/utils/markdownProcessor";
import { processLawReferencesSync } from "@/utils/lawReferenceUtils";

interface ContractReviewMessageContentProps {
  message: ContractReviewMessage;
  isAttorney: boolean;
}

const ContractReviewMessageContent: React.FC<ContractReviewMessageContentProps> = ({
  message,
  isAttorney
}) => {
  // Process content with markdown and law references
  const processedContent = React.useMemo(() => {
    let content = message.content;
    content = processLawReferencesSync(content);
    return processMarkdown(content);
  }, [message.content]);

  return (
    <div className={cn(
      "flex flex-col",
      isAttorney ? "items-end" : "items-start",
      "max-w-[80%] md:max-w-[70%]"
    )}>
      <div className={cn(
        "px-4 py-2 rounded-lg",
        isAttorney ? "bg-green-100 text-green-900" : "bg-blue-100 text-blue-900"
      )}>
        <div 
          className="text-sm prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      </div>
      <span className="text-xs mt-1 text-muted-foreground">{message.timestamp}</span>
    </div>
  );
};

export default ContractReviewMessageContent;
