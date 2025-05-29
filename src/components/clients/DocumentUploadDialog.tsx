
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, FilePlus, FileText, BookOpenCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileUploadInput from "@/components/clients/chat/FileUploadInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import CaseSelector from "@/components/clients/cases/CaseSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Case } from "@/types/case";
import { processPdfDocument } from "@/utils/pdfUtils";

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
    
    if (!documentTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for the document.",
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
        // Handle PDF processing directly using our utility
        setIsProcessingPdf(true);
        
        // Get client ID from the onUpload function context
        const clientId = selectedCaseId || caseId || 'default-client-id'; // You may need to pass this as a prop
        
        const result = await processPdfDocument(
          selectedFile, 
          documentTitle, 
          clientId,
          selectedCaseId
        );
        
        if (result.success) {
          toast({
            title: "PDF processed successfully",
            description: "Your PDF has been uploaded and vectorized for search.",
          });
          
          // Reset the form
          setDocumentTitle("");
          setDocumentContent("");
          setSelectedFile(null);
          setUploadMethod("text");
          setSelectedCaseId(caseId);
          
          onClose();
          
          // Trigger a refresh of the documents list if available
          if (onUpload) {
            await onUpload(documentTitle, "", selectedFile);
          }
        } else {
          throw new Error(result.error || "Failed to process PDF");
        }
      } else {
        // Handle text document upload
        await onUpload(documentTitle, documentContent);
        
        // Reset the form
        setDocumentTitle("");
        setDocumentContent("");
        setSelectedFile(null);
        setUploadMethod("text");
        setSelectedCaseId(caseId);
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

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const getSelectedCaseName = () => {
    if (!selectedCaseId) return "Client-Level";
    const selectedCase = cases.find(c => c.id === selectedCaseId);
    return selectedCase?.case_title || caseName || "Selected Case";
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
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {selectedCaseId 
                    ? `This document will be associated with: ${getSelectedCaseName()}`
                    : "This document will be stored at the client level (accessible across all cases)"}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Fixed case display */}
          {!allowCaseSelection && (caseId || caseName) && (
            <Alert>
              <BookOpenCheck className="h-4 w-4" />
              <AlertDescription>
                This document will be added to case: <strong>{caseName || "Selected Case"}</strong>
                <Badge className="ml-2" variant="secondary">Case Document</Badge>
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="docTitle">Document Title</Label>
            <Input
              id="docTitle"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title"
              disabled={isCurrentlyProcessing}
            />
          </div>
          
          <Tabs 
            value={uploadMethod} 
            onValueChange={(value) => setUploadMethod(value as "text" | "pdf")} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Text Input</TabsTrigger>
              <TabsTrigger value="pdf">PDF Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="mt-4">
              <div>
                <Label htmlFor="docContent">Document Content</Label>
                <Textarea
                  id="docContent"
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  placeholder="Enter document content"
                  className="min-h-[200px]"
                  disabled={isCurrentlyProcessing}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="pdf" className="mt-4">
              <div>
                <Label>Upload PDF Document</Label>
                <div className="mt-2">
                  <FileUploadInput 
                    onFileSelected={handleFileSelected} 
                    isProcessing={isCurrentlyProcessing}
                    accept="application/pdf"
                  />
                </div>
                {uploadMethod === "pdf" && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your PDF will be processed, text extracted, and vectorized for AI search and analysis.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
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
