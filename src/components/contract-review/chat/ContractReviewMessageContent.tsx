
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
    
    // If content already contains HTML style tags (from validation), keep it as is
    if (content.includes('<style>')) {
      return content;
    }
    
    // Otherwise process with standard law reference processing
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
      "max-w-[85%] md:max-w-[75%]"
    )}>
      <div className={cn(
        "px-4 py-3 rounded-lg shadow-sm",
        isAttorney 
          ? "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100" 
          : "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
      )}>
        <div 
          className={cn(
            "prose prose-sm md:prose max-w-none dark:prose-invert",
            "prose-headings:font-semibold prose-headings:text-slate-800 dark:prose-headings:text-slate-100",
            "prose-h1:text-xl prose-h1:mt-4 prose-h1:mb-2",
            "prose-h2:text-lg prose-h2:mt-3 prose-h2:mb-2",
            "prose-h3:text-base prose-h3:mt-2 prose-h3:mb-1",
            "prose-p:my-2",
            "prose-li:my-0.5",
            "prose-strong:font-semibold",
            "prose-strong:text-slate-900 dark:prose-strong:text-slate-50",
            isAttorney ? "prose-a:text-green-700 dark:prose-a:text-green-300" : "prose-a:text-blue-700 dark:prose-a:text-blue-300"
          )}
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
        
        {/* Display severity summary for AI responses if available */}
        {!isAttorney && severityCounts && (
          severityCounts.CRITICAL > 0 || severityCounts.HIGH > 0 || severityCounts.MEDIUM > 0
        ) && (
          <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700/50">
            <p className="text-xs font-medium mb-2">Issues detected:</p>
            <div className="flex flex-wrap gap-2">
              {severityCounts.CRITICAL > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200">
                  {severityCounts.CRITICAL} Critical
                </span>
              )}
              {severityCounts.HIGH > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200">
                  {severityCounts.HIGH} High
                </span>
              )}
              {severityCounts.MEDIUM > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200">
                  {severityCounts.MEDIUM} Medium
                </span>
              )}
              {severityCounts.LOW > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200">
                  {severityCounts.LOW} Low
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Display Texas law references for AI responses if available */}
        {!isAttorney && lawReferences && lawReferences.length > 0 && (
          <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700/50">
            <p className="text-xs font-medium mb-2">Texas law references:</p>
            <div className="flex flex-wrap gap-1">
              {lawReferences.slice(0, 3).map((reference, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                  {reference}
                </span>
              ))}
              {lawReferences.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                  +{lawReferences.length - 3} more
                </span>
              )}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="inline-block w-3 h-3 bg-green-100 dark:bg-green-700 border border-green-300 dark:border-green-600 rounded-full mr-1"></span>
              <span className="mr-3">Valid citations</span>
              <span className="inline-block w-3 h-3 bg-red-100 dark:bg-red-700 border border-red-300 dark:border-red-600 rounded-full mr-1"></span>
              <span>Invalid citations</span>
            </div>
          </div>
        )}
      </div>
      <span className="text-xs mt-1 text-muted-foreground">{message.timestamp}</span>
    </div>
  );
};

export default ContractReviewMessageContent;
