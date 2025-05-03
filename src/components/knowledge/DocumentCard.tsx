
import React from 'react';
import { FileText, Calendar, ExternalLink, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DocumentWithContent, DocumentContent } from '@/types/knowledge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentCardProps {
  document: DocumentWithContent;
}

// Format date for display
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Unknown date';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Extract page number from metadata if available
const getPageNumber = (content: DocumentContent) => {
  if (content.metadata?.location?.page) {
    return content.metadata.location.page;
  }
  return 'N/A';
};

const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  // Check if this document had an error during content fetching
  const hasError = 'fetchError' in document && document.fetchError;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-burgundy" /> 
          {document.title || "Untitled Document"}
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> 
          {formatDate(document.created_at)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasError ? (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Content could not be loaded due to timeout. This document may be too large.
            </AlertDescription>
          </Alert>
        ) : (
          <p className="text-sm text-muted-foreground mb-2">
            {document.contents.length} content segments available
          </p>
        )}
        {document.url && (
          <div className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
            <ExternalLink className="h-3.5 w-3.5" />
            <a href={document.url} target="_blank" rel="noopener noreferrer">
              Source Link
            </a>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!hasError && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="content">
              <AccordionTrigger>View Content</AccordionTrigger>
              <AccordionContent>
                <div className="max-h-60 overflow-y-auto">
                  {document.contents.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Page</TableHead>
                          <TableHead>Content</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {document.contents.map((content, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              {getPageNumber(content)}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {content.content || 'No content available'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No content available for this document.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardFooter>
    </Card>
  );
};

export default DocumentCard;
