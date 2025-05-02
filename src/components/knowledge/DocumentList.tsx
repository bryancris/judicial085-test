
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import DocumentCard from './DocumentCard';
import EmptyState from './EmptyState';
import { DocumentWithContent } from '@/types/knowledge';

interface DocumentListProps {
  loading: boolean;
  documents: DocumentWithContent[];
  searchTerm: string;
  clearSearch: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  loading, 
  documents, 
  searchTerm, 
  clearSearch 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {loading ? (
        // Loading skeletons
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
  );
};

export default DocumentList;
