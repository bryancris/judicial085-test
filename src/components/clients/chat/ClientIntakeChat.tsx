import React, { useState } from "react";
import ChatView from "./ChatView";
import ChatInput from "./ChatInput";
import LegalAnalysisView from "./LegalAnalysisView";
import { useClientChat } from "@/hooks/useClientChat";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, Paperclip } from "lucide-react";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ClientIntakeChatProps {
  clientId: string;
  clientName?: string; // Added this prop as optional
}

const ClientIntakeChat = ({ clientId, clientName }: ClientIntakeChatProps) => {
  const {
    activeTab,
    setActiveTab,
    messages,
    legalAnalysis,
    isLoading,
    isAnalysisLoading,
    isLoadingHistory,
    analysisError,
    prefilledMessage,
    handleSendMessage,
    handleFollowUpQuestionClick,
    formatTimestamp
  } = useClientChat(clientId);

  // Document upload state
  const [openDocDialog, setOpenDocDialog] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const { toast } = useToast();

  // Use the client documents hook
  const { processDocument, isProcessing } = useClientDocuments(clientId);

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for the document.",
        variant: "destructive",
      });
      return;
    }
    
    if (!documentContent.trim()) {
      toast({
        title: "Content required",
        description: "Please provide content for the document.",
        variant: "destructive",
      });
      return;
    }
    
    const result = await processDocument(documentTitle, documentContent);
    
    if (result.success) {
      setDocumentTitle("");
      setDocumentContent("");
      setOpenDocDialog(false);
      
      toast({
        title: "Document added",
        description: `${documentTitle} has been added as a supporting document.`,
      });
    }
  };

  const handleAddDocuments = () => {
    setOpenDocDialog(true);
  };

  if (isLoadingHistory) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-300px)] min-h-[600px]">
        <div className="flex flex-col border rounded-lg overflow-hidden">
          <div className="bg-primary text-primary-foreground p-3">
            <h3 className="font-medium">Attorney / Client Input</h3>
            <div className="text-xs opacity-80">{formatTimestamp()}</div>
          </div>
          <div className="flex-grow p-4">
            <Skeleton className="h-[20px] w-full mb-4" />
            <Skeleton className="h-[20px] w-3/4 mb-4" />
            <Skeleton className="h-[20px] w-5/6 mb-4" />
          </div>
        </div>
        
        <div className="flex flex-col border rounded-lg overflow-hidden">
          <div className="bg-brand-burgundy text-white p-3">
            <h3 className="font-medium">Legal Analysis</h3>
            <div className="text-xs opacity-80">{formatTimestamp()}</div>
          </div>
          <div className="flex-grow p-4">
            <Skeleton className="h-[20px] w-full mb-4" />
            <Skeleton className="h-[20px] w-4/5 mb-4" />
            <Skeleton className="h-[20px] w-full mb-4" />
            <Skeleton className="h-[20px] w-2/3 mb-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-300px)] min-h-[600px]">
      {/* Attorney Input Side */}
      <div className="flex flex-col border rounded-lg overflow-hidden">
        <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center">
          <div>
            <h3 className="font-medium">Attorney / Client Input</h3>
            <div className="text-xs opacity-80">{formatTimestamp()}</div>
          </div>
          <Button 
            onClick={handleAddDocuments} 
            size="sm" 
            variant="secondary" 
            className="bg-white text-primary font-medium px-3 hover:bg-gray-100"
          >
            <Paperclip className="h-4 w-4 mr-2" />
            Add Supporting Documents
          </Button>
        </div>
        
        <ChatView 
          messages={messages} 
          isLoading={isLoading} 
        />
        
        <ChatInput 
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          prefilledMessage={prefilledMessage}
        />
      </div>

      {/* Legal Analysis Side */}
      <div className="flex flex-col border rounded-lg overflow-hidden">
        <div className="bg-brand-burgundy text-white p-3">
          <h3 className="font-medium">Legal Analysis</h3>
          <div className="text-xs opacity-80">{formatTimestamp()}</div>
        </div>
        
        <LegalAnalysisView 
          analysisItems={legalAnalysis}
          isLoading={isAnalysisLoading}
          error={analysisError}
          onQuestionClick={handleFollowUpQuestionClick}
        />
      </div>

      {/* Document Upload Dialog */}
      <Dialog open={openDocDialog} onOpenChange={setOpenDocDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Supporting Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDocumentSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="docTitle">Document Title</Label>
              <Input
                id="docTitle"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Enter document title"
                disabled={isProcessing}
              />
            </div>
            <div>
              <Label htmlFor="docContent">Document Content</Label>
              <Textarea
                id="docContent"
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
                placeholder="Enter document content"
                className="min-h-[200px]"
                disabled={isProcessing}
              />
            </div>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isProcessing}
                className="flex items-center gap-1"
              >
                {isProcessing ? (
                  <>
                    <FileText className="h-4 w-4 mr-2 animate-spin" /> 
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientIntakeChat;
