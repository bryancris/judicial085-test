
import React from "react";
import { useCaseDiscussion } from "@/hooks/useCaseDiscussion";
import CaseDiscussionView from "./CaseDiscussionView";
import CaseDiscussionInput from "./CaseDiscussionInput";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle } from "lucide-react";

interface CaseDiscussionContainerProps {
  clientId: string;
}

const CaseDiscussionContainer: React.FC<CaseDiscussionContainerProps> = ({
  clientId
}) => {
  const {
    messages,
    isLoading,
    isLoadingHistory,
    documentsAvailable,
    handleSendMessage,
    formatTimestamp
  } = useCaseDiscussion(clientId);

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)] p-4">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Header with document status */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Case Discussion</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered legal discussion with access to your case documents
            </p>
          </div>
          <div className="flex items-center gap-2">
            {documentsAvailable ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Documents Available
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                No Documents
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <CaseDiscussionView 
          messages={messages} 
          isLoading={isLoading}
        />
      </div>

      {/* Input area */}
      <div className="border-t bg-background">
        <CaseDiscussionInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          formatTimestamp={formatTimestamp}
        />
      </div>
    </div>
  );
};

export default CaseDiscussionContainer;
