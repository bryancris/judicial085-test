
import React from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  searchTerm: string;
  clearSearch: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ searchTerm, clearSearch }) => {
  return (
    <div className="col-span-full flex flex-col items-center justify-center bg-white p-6 rounded-lg shadow-md">
      <BookOpen className="h-12 w-12 text-muted-foreground mb-2" />
      <h3 className="text-xl font-medium mb-1">No Documents Found</h3>
      <p className="text-center text-muted-foreground mb-4">
        {searchTerm ? 
          "No documents match your search criteria." : 
          "There are no documents in the knowledge base yet."}
      </p>
      {searchTerm && (
        <Button onClick={clearSearch}>Clear Search</Button>
      )}
    </div>
  );
};

export default EmptyState;
