
import React, { useState } from "react";
import { useContractReviewChat } from "@/hooks/useContractReviewChat";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilePlus, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ContractReviewChatInput from "./ContractReviewChatInput";
import ContractReviewChatView from "./ContractReviewChatView";
import { Textarea } from "@/components/ui/textarea";

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
  const [contractText, setContractText] = useState("");

  const handleAddContract = () => {
    setUploadDialogOpen(true);
  };
  
  const handleUploadContract = () => {
    if (!contractText.trim()) {
      toast({
        title: "Empty Contract",
        description: "Please enter contract text to review.",
        variant: "destructive"
      });
      return;
    }
    
    const message = `Please review this contract for any legal issues: ${contractText}`;
    handleSendMessage(message);
    setUploadDialogOpen(false);
    setContractText("");
    
    toast({
      title: "Contract Submitted",
      description: "Your contract is being analyzed under Texas law.",
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
          <Button 
            onClick={handleAddContract} 
            size="sm" 
            variant="secondary" 
            className="bg-white text-[#4CAF50] font-medium hover:bg-gray-100"
          >
            <FilePlus className="h-4 w-4 mr-2" />
            Add Contract
          </Button>
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
      
      {/* Contract Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Contract for Texas Law Review</DialogTitle>
            <DialogDescription>
              Paste your contract text below for analysis according to Texas law standards.
              Our AI will check for issues with choice of law, security interests, liquidated damages, and more.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea 
              placeholder="Paste contract text here..."
              className="min-h-[300px] font-mono text-sm"
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
            />
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUploadContract} 
                className="bg-[#4CAF50] hover:bg-[#3d8b40]"
              >
                <UploadCloud className="h-4 w-4 mr-2" />
                Submit for Analysis
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractReviewChat;
