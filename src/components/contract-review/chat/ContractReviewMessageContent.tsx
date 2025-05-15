
import React from "react";
import { ContractReviewMessage } from "@/utils/contractReviewService";
import { cn } from "@/lib/utils";
import { processMarkdown } from "@/utils/markdownProcessor";
import { processLawReferencesSync, extractSeverityLevels, extractLawReferences } from "@/utils/lawReferenceUtils";

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
  
  // Extract severity counts if this is an AI response
  const severityCounts = React.useMemo(() => {
    if (message.role !== "ai") return null;
    return extractSeverityLevels(message.content);
  }, [message.content, message.role]);
  
  // Extract law references if this is an AI response
  const lawReferences = React.useMemo(() => {
    if (message.role !== "ai") return null;
    return extractLawReferences(message.content);
  }, [message.content, message.role]);

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
        
        {/* Display severity summary for AI responses if available */}
        {!isAttorney && severityCounts && (
          severityCounts.CRITICAL > 0 || severityCounts.HIGH > 0 || severityCounts.MEDIUM > 0
        ) && (
          <div className="mt-3 pt-2 border-t border-blue-200">
            <p className="text-xs font-medium mb-1">Issues detected:</p>
            <div className="flex flex-wrap gap-2">
              {severityCounts.CRITICAL > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-red-100 text-red-800">
                  {severityCounts.CRITICAL} Critical
                </span>
              )}
              {severityCounts.HIGH > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-100 text-orange-800">
                  {severityCounts.HIGH} High
                </span>
              )}
              {severityCounts.MEDIUM > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-100 text-yellow-800">
                  {severityCounts.MEDIUM} Medium
                </span>
              )}
              {severityCounts.LOW > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
                  {severityCounts.LOW} Low
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Display Texas law references for AI responses if available */}
        {!isAttorney && lawReferences && lawReferences.length > 0 && (
          <div className="mt-3 pt-2 border-t border-blue-200">
            <p className="text-xs font-medium mb-1">Texas law references:</p>
            <div className="flex flex-wrap gap-1">
              {lawReferences.slice(0, 3).map((reference, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-800">
                  {reference}
                </span>
              ))}
              {lawReferences.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-800">
                  +{lawReferences.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      <span className="text-xs mt-1 text-muted-foreground">{message.timestamp}</span>
    </div>
  );
};

export default ContractReviewMessageContent;
