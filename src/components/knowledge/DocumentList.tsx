
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import DocumentCard from './DocumentCard';
import EmptyState from './EmptyState';
import { DocumentWithContent } from '@/types/knowledge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentListProps {
  loading: boolean;
  documents: DocumentWithContent[];
  searchTerm: string;
  clearSearch: () => void;
  loadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  loading, 
  documents, 
  searchTerm, 
  clearSearch,
  loadMore,
  hasMore,
  isLoadingMore,
  hasError
}) => {
  // Log document data for debugging
  console.log("DocumentList received documents:", documents.length, documents);
  console.log("DocumentList hasMore:", hasMore, "isLoadingMore:", isLoadingMore);
  
  return (
    <div className="space-y-4">
      {/* Error message */}
      {hasError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            There was an error loading documents. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Document grid - updated for more compact display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
        {loading && !documents.length ? (
          // Loading skeletons when initially loading - more compact
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="py-2 px-3">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent className="py-2 px-3">
                <Skeleton className="h-12 w-full" />
              </CardContent>
              <CardFooter className="py-2 px-3">
                <Skeleton className="h-3 w-1/3" />
              </CardFooter>
            </Card>
          ))
        ) : documents.length > 0 ? (
          documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState searchTerm={searchTerm} clearSearch={clearSearch} />
          </div>
        )}
      </div>
      
      {/* Load more button */}
      {documents.length > 0 && hasMore && (
        <div className="flex justify-center mt-4">
          <Button 
            onClick={loadMore}
            disabled={isLoadingMore}
            className="min-w-[200px]"
            variant="outline"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Documents'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
