
import React, { useState } from "react";
import { useContractReviewChat } from "@/hooks/useContractReviewChat";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilePlus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDocumentProcessor } from "@/hooks/documents/useDocumentProcessor";
import ContractReviewChatInput from "./ContractReviewChatInput";
import ContractReviewChatView from "./ContractReviewChatView";
import ContractDraftForm from "./ContractDraftForm";
import DocumentUploadDialog from "@/components/clients/DocumentUploadDialog";

interface ContractReviewChatProps {
  clientId: string;
  clientName?: string; // Added clientName as optional prop
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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { processDocument, isProcessing } = useDocumentProcessor(
    clientId,
    "client-level",
    () => {} // Empty refresh function since we don't need to refresh a list here
  );

  const handleCreateContract = () => {
    setCreateDialogOpen(true);
  };

  const handleUploadContract = () => {
    setUploadDialogOpen(true);
  };

  const handleContractUpload = async (title: string, content: string, file?: File) => {
    try {
      const result = await processDocument(title, content, { schema: 'contract_document' }, file);
      
      if (result.success) {
        // Send the contract content to AI for analysis
        const message = file 
          ? `Please review this contract file "${title}" for any legal issues under Texas law.`
          : `Please review this contract for any legal issues under Texas law: ${content}`;
        
        handleSendMessage(message);
        
        toast({
          title: "Contract Submitted",
          description: "Your contract has been uploaded and is being analyzed under Texas law.",
        });
        
        return result;
      } else {
        throw new Error(result.error || "Failed to process contract");
      }
    } catch (error: any) {
      console.error("Error processing contract:", error);
      toast({
        title: "Contract Upload Failed",
        description: error.message || "An error occurred while processing the contract.",
        variant: "destructive",
      });
      throw error;
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
              onClick={handleUploadContract} 
              size="sm" 
              variant="secondary" 
              className="bg-white text-[#4CAF50] font-medium hover:bg-gray-100"
            >
              <FilePlus className="h-4 w-4 mr-2" />
              Upload
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
      
      {/* Contract Upload Dialog - Now using DocumentUploadDialog */}
      <DocumentUploadDialog
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleContractUpload}
        isProcessing={isProcessing}
        clientId={clientId}
        allowCaseSelection={false}
        onUploadSuccess={() => setUploadDialogOpen(false)}
      />
    </div>
  );
};

export default ContractReviewChat;
