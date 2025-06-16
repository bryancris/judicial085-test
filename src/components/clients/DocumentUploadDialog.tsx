
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, FilePlus, FileText, BookOpenCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CaseSelector from "@/components/clients/cases/CaseSelector";
import { Case } from "@/types/case";
import { processPdfDocument } from "@/utils/pdfUtils";
import { validateDocumentTitle } from "@/utils/documentCleanupService";
import DocumentTitleInput from "@/components/clients/documents/DocumentTitleInput";
import DocumentContentTabs from "@/components/clients/documents/DocumentContentTabs";
import DocumentScopeAlert from "@/components/clients/documents/DocumentScopeAlert";

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (title: string, content: string, file?: File) => Promise<any>;
  isProcessing: boolean;
  clientId: string;
  caseId?: string;
  caseName?: string;
  cases?: Case[];
  allowCaseSelection?: boolean;
  onUploadSuccess?: () => void;
}

const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
  isProcessing,
  clientId,
  caseId,
  caseName,
  cases = [],
  allowCaseSelection = false,
  onUploadSuccess
}) => {
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"text" | "pdf">("text");
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>(caseId);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [titleValidation, setTitleValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });
  const { toast } = useToast();

  const handleTitleChange = (newTitle: string) => {
    setDocumentTitle(newTitle);
    
    if (newTitle.trim()) {
      const validation = validateDocumentTitle(newTitle);
      setTitleValidation(validation);
    } else {
      setTitleValidation({ valid: true });
    }
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID is required for document upload.",
        variant: "destructive",
      });
      return;
    }
    
    let finalTitle = documentTitle.trim();
    
    if (!finalTitle) {
      if (uploadMethod === "pdf" && selectedFile) {
        finalTitle = selectedFile.name.replace(/\.[^/.]+$/, "");
      } else {
        finalTitle = "Untitled Document";
      }
    }
    
    // Validate title before proceeding
    const validation = validateDocumentTitle(finalTitle);
    if (!validation.valid) {
      toast({
        title: "Invalid Document Title",
        description: validation.error,
        variant: "destructive",
      });
      return;
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
        setIsProcessingPdf(true);
        
        console.log(`Processing PDF with clientId: ${clientId}, selectedCaseId: ${selectedCaseId}`);
        
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
          
          resetForm();
          onClose();
          
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        } else {
          throw new Error(result.error || "Failed to process PDF");
        }
      } else {
        const result = await onUpload(finalTitle, documentContent);
        
        if (result && result.success !== false) {
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        }
        
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
    setTitleValidation({ valid: true });
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

          {!allowCaseSelection && (
            <DocumentScopeAlert
              allowCaseSelection={allowCaseSelection}
              selectedCaseId={selectedCaseId}
              caseId={caseId}
              caseName={caseName}
              cases={cases}
            />
          )}

          <div className="space-y-2">
            <DocumentTitleInput
              value={documentTitle}
              onChange={handleTitleChange}
              uploadMethod={uploadMethod}
              disabled={isCurrentlyProcessing}
            />
            {!titleValidation.valid && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {titleValidation.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
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
              disabled={isCurrentlyProcessing || !titleValidation.valid}
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
