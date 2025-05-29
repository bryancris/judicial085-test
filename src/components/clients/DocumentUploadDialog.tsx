
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, FilePlus, FileText, BookOpenCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileUploadInput from "@/components/clients/chat/FileUploadInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (title: string, content: string, file?: File) => Promise<any>;
  isProcessing: boolean;
  caseId?: string;
  caseName?: string;
}

const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
  isProcessing,
  caseId,
  caseName
}) => {
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"text" | "pdf">("text");
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
      if (uploadMethod === "pdf") {
        await onUpload(documentTitle, "", selectedFile!);
      } else {
        await onUpload(documentTitle, documentContent);
      }
      
      // Reset the form
      setDocumentTitle("");
      setDocumentContent("");
      setSelectedFile(null);
      setUploadMethod("text");
    } catch (error) {
      console.error("Error uploading document:", error);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {caseId ? (
              <>
                <BookOpenCheck className="h-5 w-5" />
                Add Case Document
                {caseName && (
                  <Badge className="ml-2" variant="secondary">
                    {caseName}
                  </Badge>
                )}
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
                  disabled={isProcessing}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="pdf" className="mt-4">
              <div>
                <Label>Upload PDF Document</Label>
                <div className="mt-2">
                  <FileUploadInput 
                    onFileSelected={handleFileSelected} 
                    isProcessing={isProcessing}
                    accept="application/pdf"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isProcessing}
              className="flex items-center gap-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                  Processing...
                </>
              ) : (
                <>
                  <FilePlus className="h-4 w-4 mr-2" />
                  {caseId ? "Upload Case Document" : "Upload Document"}
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
