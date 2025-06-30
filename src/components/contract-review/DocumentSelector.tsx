
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import { DocumentWithContent } from "@/types/knowledge";

interface DocumentSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument: (document: DocumentWithContent) => void;
  clientId: string;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  isOpen,
  onClose,
  onSelectDocument,
  clientId
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { documents, loading } = useClientDocuments(clientId, 20, "client-level");

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc =>
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.schema?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDocumentSelect = (document: DocumentWithContent) => {
    onSelectDocument(document);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDocumentTypeColor = (schema: string) => {
    switch (schema) {
      case 'legal_document':
        return 'bg-blue-100 text-blue-800';
      case 'contract_document':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Document for Contract Review</DialogTitle>
          <DialogDescription>
            Choose a document from your Document Hub to analyze for contract review.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading documents...</p>
              </div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No documents found" : "No documents available"}
              </h3>
              <p className="text-sm text-gray-500">
                {searchTerm 
                  ? "Try adjusting your search terms."
                  : "Upload documents through the Document Hub first."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocuments.map((document) => (
                <Card 
                  key={document.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleDocumentSelect(document)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-sm line-clamp-2">
                          {document.title || "Untitled Document"}
                        </CardTitle>
                      </div>
                      {document.schema && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getDocumentTypeColor(document.schema)}`}
                        >
                          {document.schema === 'legal_document' ? 'Legal' : 
                           document.schema === 'contract_document' ? 'Contract' : 
                           'Document'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      {document.created_at ? formatDate(document.created_at) : 'Unknown date'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {document.contents?.length || 0} sections available
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentSelector;
