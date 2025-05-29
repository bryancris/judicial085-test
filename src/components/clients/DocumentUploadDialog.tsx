
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, FilePlus, FileText, BookOpenCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CaseSelector from "@/components/clients/cases/CaseSelector";
import { Case } from "@/types/case";
import { processPdfDocument } from "@/utils/pdfUtils";
import DocumentTitleInput from "@/components/clients/documents/DocumentTitleInput";
import DocumentContentTabs from "@/components/clients/documents/DocumentContentTabs";
import DocumentScopeAlert from "@/components/clients/documents/DocumentScopeAlert";

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (title: string, content: string, file?: File) => Promise<any>;
  isProcessing: boolean;
  caseId?: string;
  caseName?: string;
  cases?: Case[];
  allowCaseSelection?: boolean;
}

const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
  isProcessing,
  caseId,
  caseName,
  cases = [],
  allowCaseSelection = false
}) => {
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"text" | "pdf">("text");
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>(caseId);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const { toast } = useToast();

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine the final title to use
    let finalTitle = documentTitle.trim();
    
    if (!finalTitle) {
      if (uploadMethod === "pdf" && selectedFile) {
        // Use filename without extension for PDF uploads
        finalTitle = selectedFile.name.replace(/\.[^/.]+$/, "");
      } else {
        // Use default title for text uploads
        finalTitle = "Untitled Document";
      }
    }
    
    if (uploadMethod === "text" && !documentContent.trim()) {
      toast({
        title: "Content required",
        description: "Please provide content for the document.",
        variant: "destructive",
      });
      return;
    }
    
    if (uploadMethod === "pdf" && !selectedFile) {
      toast({
        title: "File required",
        description: "Please select a PDF file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (uploadMethod === "pdf" && selectedFile) {
        // Handle PDF processing directly using our utility
        setIsProcessingPdf(true);
        
        // Get client ID from the onUpload function context
        const clientId = selectedCaseId || caseId || 'default-client-id'; // You may need to pass this as a prop
        
        const result = await processPdfDocument(
          selectedFile, 
          finalTitle, 
          clientId,
          selectedCaseId
        );
        
        if (result.success) {
          toast({
            title: "PDF processed successfully",
            description: "Your PDF has been uploaded and vectorized for search.",
          });
          
          // Reset the form
          resetForm();
          onClose();
          
          // Trigger a refresh of the documents list if available
          if (onUpload) {
            await onUpload(finalTitle, "", selectedFile);
          }
        } else {
          throw new Error(result.error || "Failed to process PDF");
        }
      } else {
        // Handle text document upload
        await onUpload(finalTitle, documentContent);
        
        // Reset the form
        resetForm();
      }
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading the document.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const resetForm = () => {
    setDocumentTitle("");
    setDocumentContent("");
    setSelectedFile(null);
    setUploadMethod("text");
    setSelectedCaseId(caseId);
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const isCurrentlyProcessing = isProcessing || isProcessingPdf;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedCaseId ? (
              <>
                <BookOpenCheck className="h-5 w-5" />
                Add Case Document
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                Add Client Document
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleDocumentSubmit} className="space-y-4 mt-4">
          {/* Case Selection */}
          {allowCaseSelection && (
            <div className="space-y-2">
              <Label>Document Scope</Label>
              <CaseSelector
                cases={cases}
                selectedCaseId={selectedCaseId}
                onCaseSelect={setSelectedCaseId}
                allowClientLevel={true}
                placeholder="Select where to store this document"
              />
              <DocumentScopeAlert
                allowCaseSelection={allowCaseSelection}
                selectedCaseId={selectedCaseId}
                caseId={caseId}
                caseName={caseName}
                cases={cases}
              />
            </div>
          )}

          {/* Fixed case display */}
          {!allowCaseSelection && (
            <DocumentScopeAlert
              allowCaseSelection={allowCaseSelection}
              selectedCaseId={selectedCaseId}
              caseId={caseId}
              caseName={caseName}
              cases={cases}
            />
          )}

          <DocumentTitleInput
            value={documentTitle}
            onChange={setDocumentTitle}
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
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isCurrentlyProcessing}
              className="flex items-center gap-1"
            >
              {isCurrentlyProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                  {uploadMethod === "pdf" ? "Processing PDF..." : "Processing..."}
                </>
              ) : (
                <>
                  <FilePlus className="h-4 w-4 mr-2" />
                  {selectedCaseId ? "Upload Case Document" : "Upload Client Document"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadDialog;
