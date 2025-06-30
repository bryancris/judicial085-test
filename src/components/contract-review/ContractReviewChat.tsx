
import React, { useState } from "react";
import { useContractReviewChat } from "@/hooks/useContractReviewChat";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Files } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ContractReviewChatInput from "./ContractReviewChatInput";
import ContractReviewChatView from "./ContractReviewChatView";
import ContractDraftForm from "./ContractDraftForm";
import DocumentSelector from "./DocumentSelector";
import { DocumentWithContent } from "@/types/knowledge";

interface ContractReviewChatProps {
  clientId: string;
  clientName?: string;
}

const ContractReviewChat: React.FC<ContractReviewChatProps> = ({ clientId, clientName }) => {
  const {
    messages,
    isLoading,
    isLoadingHistory,
    handleSendMessage,
    formatTimestamp
  } = useContractReviewChat(clientId);
  
  const { toast } = useToast();
  const [documentSelectorOpen, setDocumentSelectorOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleCreateContract = () => {
    setCreateDialogOpen(true);
  };

  const handleSelectDocuments = () => {
    setDocumentSelectorOpen(true);
  };

  const handleDocumentSelection = async (document: DocumentWithContent) => {
    try {
      // Get document content from chunks/contents
      let documentContent = "";
      
      if (document.contents && document.contents.length > 0) {
        // Combine content from all sections
        documentContent = document.contents
          .map(content => content.content)
          .join("\n\n");
      }

      if (!documentContent.trim()) {
        throw new Error("Selected document has no content available for review.");
      }

      // Send the document content to AI for analysis
      const message = `Please review this document "${document.title}" for any legal issues under Texas law. Document content: ${documentContent}`;
      
      handleSendMessage(message);
      
      toast({
        title: "Document Selected",
        description: `"${document.title}" has been submitted for contract review analysis.`,
      });
      
    } catch (error: any) {
      console.error("Error processing selected document:", error);
      toast({
        title: "Document Selection Failed",
        description: error.message || "An error occurred while processing the selected document.",
        variant: "destructive",
      });
    }
  };

  const handleContractDraftSubmit = (contractData: any) => {
    const message = `Please create a ${contractData.contractType} contract with the following details: ${JSON.stringify(contractData)}`;
    handleSendMessage(message);
    setCreateDialogOpen(false);
    
    toast({
      title: "Contract Draft Requested",
      description: "Your contract is being generated based on your specifications.",
    });
  };

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="bg-[#4CAF50] text-white p-3">
          <h3 className="font-medium">Contract Review</h3>
          <div className="text-xs opacity-80">{formatTimestamp()}</div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-[250px] bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-[200px] bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
        <div className="h-14 w-full bg-gray-200 animate-pulse rounded-lg mt-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] min-h-[600px]">
      <div className="flex flex-col flex-grow overflow-hidden border rounded-lg">
        <div className="bg-[#4CAF50] text-white p-3 flex justify-between items-center">
          <div>
            <h3 className="font-medium">Texas Contract Review</h3>
            <div className="text-xs opacity-80">{formatTimestamp()}</div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleCreateContract} 
              size="sm" 
              variant="secondary" 
              className="bg-white text-[#4CAF50] font-medium hover:bg-gray-100"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create
            </Button>
            <Button 
              onClick={handleSelectDocuments} 
              size="sm" 
              variant="secondary" 
              className="bg-white text-[#4CAF50] font-medium hover:bg-gray-100"
            >
              <Files className="h-4 w-4 mr-2" />
              Select Documents
            </Button>
          </div>
        </div>
        
        <ContractReviewChatView 
          messages={messages} 
          isLoading={isLoading} 
        />
        
        <ContractReviewChatInput 
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
      
      {/* Contract Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Contract</DialogTitle>
            <DialogDescription>
              Fill out the form below to generate a custom contract tailored to your needs.
            </DialogDescription>
          </DialogHeader>
          
          <ContractDraftForm onSubmit={handleContractDraftSubmit} />
        </DialogContent>
      </Dialog>
      
      {/* Document Selection Dialog */}
      <DocumentSelector
        isOpen={documentSelectorOpen}
        onClose={() => setDocumentSelectorOpen(false)}
        onSelectDocument={handleDocumentSelection}
        clientId={clientId}
      />
    </div>
  );
};

export default ContractReviewChat;
