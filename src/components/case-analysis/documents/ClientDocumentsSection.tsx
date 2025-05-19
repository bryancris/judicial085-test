
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlus, FileText, Loader2, Search } from "lucide-react";
import { DocumentWithContent } from "@/types/knowledge";
import DocumentCard from "@/components/knowledge/DocumentCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ClientDocumentsSectionProps {
  clientId: string;
  documents: DocumentWithContent[];
  isLoading: boolean;
  onProcessDocument: (title: string, content: string, metadata?: any) => Promise<any>;
  isProcessing: boolean;
  fullView?: boolean;
}

const ClientDocumentsSection: React.FC<ClientDocumentsSectionProps> = ({
  clientId,
  documents,
  isLoading,
  onProcessDocument,
  isProcessing,
  fullView = false
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
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
    
    if (!documentContent.trim()) {
      toast({
        title: "Content required",
        description: "Please provide content for the document.",
        variant: "destructive",
      });
      return;
    }
    
    const result = await onProcessDocument(documentTitle, documentContent);
    
    if (result.success) {
      setDocumentTitle("");
      setDocumentContent("");
      setOpenDialog(false);
    }
  };

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.contents.some(content => 
      content.content?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
            
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <FilePlus className="h-4 w-4" />
                  <span>Add Document</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Client Document</DialogTitle>
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
                          <Loader2 className="h-4 w-4 animate-spin" /> 
                          Processing...
                        </>
                      ) : (
                        <>
                          <FilePlus className="h-4 w-4" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading && !documents.length ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-muted-foreground">Loading client documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-lg text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-2" />
            <h3 className="font-medium">No Documents Available</h3>
            <p className="text-gray-500 mt-1 mb-4 max-w-md">
              Add documents relevant to this client's case to enhance your analysis.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Add First Document</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Client Document</DialogTitle>
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
                          <Loader2 className="h-4 w-4 animate-spin" /> 
                          Processing...
                        </>
                      ) : (
                        <>
                          <FilePlus className="h-4 w-4" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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
                />
              ))}
            </div>
            
            {!fullView && filteredDocuments.length > 3 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm" onClick={() => {}}>
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
