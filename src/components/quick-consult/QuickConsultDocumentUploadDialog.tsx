import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import DocumentTitleInput from "@/components/clients/documents/DocumentTitleInput";
import DocumentContentTabs from "@/components/clients/documents/DocumentContentTabs";
import { Loader2, Upload } from "lucide-react";
import { useFirmDocumentProcessingService } from "@/hooks/documents/services/firmDocumentProcessingService";
import { useToast } from "@/hooks/use-toast";
import { validateDocumentTitle } from "@/utils/documents/documentValidation";
import { reviewUploadedDocument } from "@/utils/api/documentReviewService";
import { useQuickConsultSessions } from "@/hooks/useQuickConsultSessions";
import { useQuickConsultMessages } from "@/hooks/useQuickConsultMessages";

interface QuickConsultDocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: () => void;
  isProcessing?: boolean;
  onChatInitiated?: (sessionId: string) => void;
}

const QuickConsultDocumentUploadDialog: React.FC<QuickConsultDocumentUploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
  isProcessing: externalProcessing = false,
  onChatInitiated
}) => {
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"text" | "pdf" | "docx">("text");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [titleValidation, setTitleValidation] = useState({ isValid: true, message: "" });

  const { processFileDocument, processTextDocument } = useFirmDocumentProcessingService();
  const { toast } = useToast();
  const { createSession } = useQuickConsultSessions();
  const { addMessage } = useQuickConsultMessages(null);

  const isCurrentlyProcessing = externalProcessing || isProcessingFile;

  const handleTitleChange = (newTitle: string) => {
    setDocumentTitle(newTitle);
    const validation = validateDocumentTitle(newTitle);
    setTitleValidation(validation);
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleValidation.isValid && documentTitle.trim()) {
      toast({
        title: "Invalid title",
        description: titleValidation.message,
        variant: "destructive",
      });
      return;
    }

    // Check if we have content or file
    if (uploadMethod === "text" && !documentContent.trim()) {
      toast({
        title: "Missing content",
        description: "Please enter document content",
        variant: "destructive",
      });
      return;
    }

    if ((uploadMethod === "pdf" || uploadMethod === "docx") && !selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingFile(true);

    try {
      let result;
      if (uploadMethod === "text") {
        const finalTitle = documentTitle.trim() || "Firm Document";
        result = await processTextDocument(finalTitle, documentContent);
      } else if (selectedFile) {
        const finalTitle = documentTitle.trim() || selectedFile.name.replace(/\.[^/.]+$/, "");
        result = await processFileDocument(selectedFile, finalTitle);
      }

      if (!result?.success || !result?.documentId) {
        throw new Error("Document processing failed");
      }

      // Get AI review of the uploaded document
      console.log("Getting AI review for document:", result.documentId);
      const reviewResponse = await reviewUploadedDocument(
        result.documentId, 
        uploadMethod === "text" 
          ? (documentTitle.trim() || "Firm Document")
          : (documentTitle.trim() || selectedFile?.name.replace(/\.[^/.]+$/, ""))
      );

      if (reviewResponse.error) {
        console.error("AI review failed:", reviewResponse.error);
        // Still show success for upload, but don't initiate chat
        toast({
          title: "Success",
          description: "Document uploaded successfully!",
        });
        resetForm();
        onUpload?.();
        onClose();
        return;
      }

      // Create new chat session with AI review
      const sessionId = await createSession(`Document: ${reviewResponse.documentTitle}`);
      if (!sessionId) {
        throw new Error("Failed to create chat session");
      }

      // Add AI review message to the session
      await addMessage(reviewResponse.review, "assistant");

      toast({
        title: "Success",
        description: "Document uploaded and AI review initiated!",
      });

      resetForm();
      onUpload?.();
      onClose();
      
      // Notify parent component about chat initiation
      onChatInitiated?.(sessionId);
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  const resetForm = () => {
    setDocumentTitle("");
    setDocumentContent("");
    setSelectedFile(null);
    setUploadMethod("text");
    setTitleValidation({ isValid: true, message: "" });
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center">Upload Document to Firm Library</DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Add documents to your firm's knowledge base for use in Quick Consult
          </p>
        </DialogHeader>

        <form onSubmit={handleDocumentSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 space-y-4 overflow-auto px-1">
            <DocumentTitleInput
              value={documentTitle}
              onChange={handleTitleChange}
              uploadMethod={uploadMethod}
              disabled={isCurrentlyProcessing}
            />

            <DocumentContentTabs
              uploadMethod={uploadMethod}
              onMethodChange={setUploadMethod}
              documentContent={documentContent}
              onContentChange={setDocumentContent}
              onFileSelected={handleFileSelected}
              disabled={isCurrentlyProcessing}
            />
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCurrentlyProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCurrentlyProcessing}
              className="min-w-[120px]"
            >
              {isCurrentlyProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickConsultDocumentUploadDialog;