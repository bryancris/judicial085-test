import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlus, FileText, Loader2, Search, FileIcon } from "lucide-react";
import { DocumentWithContent } from "@/types/knowledge";
import DocumentCard from "@/components/knowledge/DocumentCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import DocumentUploadDialog from "@/components/clients/DocumentUploadDialog";
import { extractTextFromPdf, uploadPdfToStorage, generateEmbeddings } from "@/utils/pdfUtils";

interface ClientDocumentsSectionProps {
  clientId: string;
  documents: DocumentWithContent[];
  isLoading: boolean;
  onProcessDocument: (title: string, content: string, metadata?: any) => Promise<any>;
  onDeleteDocument?: (documentId: string) => Promise<{ success: boolean; error?: string }>;
  isProcessing: boolean;
  fullView?: boolean;
}

const ClientDocumentsSection: React.FC<ClientDocumentsSectionProps> = ({
  clientId,
  documents,
  isLoading,
  onProcessDocument,
  onDeleteDocument,
  isProcessing,
  fullView = false
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [deletingDocIds, setDeletingDocIds] = useState<Set<string>>(new Set());
  
  // Track documents being processed for deletion
  const handleDeleteDocument = async (documentId: string) => {
    if (!onDeleteDocument) return { success: false, error: "Delete not available" };
    
    console.log(`ClientDocumentsSection: Starting delete for document ${documentId}`);
    
    // Mark this document as being deleted
    setDeletingDocIds(prev => new Set(prev).add(documentId));
    
    try {
      // Call the parent component's delete handler
      console.log(`ClientDocumentsSection: Calling parent delete handler for ${documentId}`);
      const result = await onDeleteDocument(documentId);
      
      // Log the result for debugging
      console.log(`ClientDocumentsSection: Delete result for ${documentId}:`, result);
      
      if (!result.success) {
        console.error(`Failed to delete document ${documentId}:`, result.error);
      }
      
      return result;
    } catch (error: any) {
      console.error(`Error deleting document ${documentId}:`, error);
      return { success: false, error: error.message };
    } finally {
      // Remove from tracking regardless of outcome
      setDeletingDocIds(prev => {
        const updated = new Set(prev);
        updated.delete(documentId);
        return updated;
      });
      console.log(`ClientDocumentsSection: Completed delete process for ${documentId}`);
    }
  };

  // Handle document upload (both text and PDF)
  const handleDocumentUpload = async (title: string, content: string, file?: File) => {
    try {
      setUploadProcessing(true);
      
      // Handle PDF upload
      if (file) {
        // Generate a document ID
        const documentId = crypto.randomUUID();
        
        // Step 1: Upload the PDF to storage and get the public URL
        const publicUrl = await uploadPdfToStorage(file, clientId, documentId);
        
        // Step 2: Extract text from the PDF
        const textChunks = await extractTextFromPdf(file);
        
        if (textChunks.length === 0) {
          toast({
            title: "Processing error",
            description: "Could not extract text from the PDF file.",
            variant: "destructive",
          });
          setUploadProcessing(false);
          return { success: false };
        }
        
        // Step 3: Generate embeddings for the text chunks
        const metadata = {
          fileType: "pdf",
          fileName: file.name,
          fileSize: file.size,
          pdfUrl: publicUrl,
          uploadedAt: new Date().toISOString()
        };
        
        // Process the document with embeddings
        await generateEmbeddings(textChunks, documentId, clientId, metadata);
        
        // Update document metadata
        const result = await onProcessDocument(title, "PDF Document", {
          ...metadata,
          isPdfDocument: true
        });
        
        if (result.success) {
          toast({
            title: "Document uploaded",
            description: `${title} has been processed and added as a client document.`,
          });
          setOpenDialog(false);
        }
        
        setUploadProcessing(false);
        return result;
      } else {
        // Handle regular text upload (use existing functionality)
        const result = await onProcessDocument(title, content);
        
        if (result.success) {
          toast({
            title: "Document added",
            description: `${title} has been added as a client document.`,
          });
          setOpenDialog(false);
        }
        
        setUploadProcessing(false);
        return result;
      }
    } catch (error: any) {
      console.error("Error processing document:", error);
      toast({
        title: "Upload failed",
        description: `Error uploading document: ${error.message}`,
        variant: "destructive",
      });
      setUploadProcessing(false);
      return { success: false, error: error.message };
    }
  };

  // Filter documents based on search term with optional null check
  const filteredDocuments = documents?.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.contents?.some(content => 
      content.content?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  // Display only the first few documents in summary view
  const displayedDocuments = fullView 
    ? filteredDocuments 
    : filteredDocuments.slice(0, 3);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Client Documents
            {isLoading && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin text-gray-500" />
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {fullView && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search documents..."
                  className="pl-8 w-[200px] h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            
            <Button 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setOpenDialog(true)}
            >
              <FilePlus className="h-4 w-4" />
              <span>Add Document</span>
            </Button>
            
            <DocumentUploadDialog
              isOpen={openDialog}
              onClose={() => setOpenDialog(false)}
              onUpload={handleDocumentUpload}
              isProcessing={isProcessing || uploadProcessing}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading && !documents?.length ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-muted-foreground">Loading client documents...</p>
          </div>
        ) : !documents?.length ? (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-lg text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-2" />
            <h3 className="font-medium">No Documents Available</h3>
            <p className="text-gray-500 mt-1 mb-4 max-w-md">
              Add documents relevant to this client's case to enhance your analysis.
            </p>
            <Button onClick={() => setOpenDialog(true)}>Add First Document</Button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {displayedDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  searchTerm={searchTerm}
                  clientSpecific={true}
                  onDelete={onDeleteDocument ? handleDeleteDocument : undefined}
                />
              ))}
            </div>
            
            {!fullView && filteredDocuments.length > 3 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  View All Documents ({filteredDocuments.length})
                </Button>
              </div>
            )}
            
            {fullView && filteredDocuments.length === 0 && searchTerm && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Search className="h-12 w-12 text-gray-400 mb-2" />
                <h3 className="font-medium">No matching documents</h3>
                <p className="text-gray-500 mt-1">
                  No documents found matching "{searchTerm}"
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientDocumentsSection;
