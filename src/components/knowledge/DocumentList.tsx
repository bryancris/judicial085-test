
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
  return (
    <div className="space-y-6">
      {/* Error message */}
      {hasError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            There was an error loading documents. Some documents might be too large to retrieve in one request.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Document grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {loading && !documents.length ? (
          // Loading skeletons when initially loading
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-md">
              <CardHeader>
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/3" />
              </CardFooter>
            </Card>
          ))
        ) : documents.length > 0 ? (
          documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))
        ) : (
          <EmptyState searchTerm={searchTerm} clearSearch={clearSearch} />
        )}
      </div>
      
      {/* Load more button */}
      {documents.length > 0 && hasMore && (
        <div className="flex justify-center mt-6">
          <Button 
            onClick={loadMore}
            disabled={isLoadingMore}
            className="min-w-[200px]"
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
