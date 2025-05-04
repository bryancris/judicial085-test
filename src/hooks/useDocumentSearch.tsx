
import { useState, useRef } from 'react';
import { DocumentWithContent } from '@/types/knowledge';

export const useDocumentSearch = (documents: DocumentWithContent[], fetchDocuments: (page: number, reset: boolean) => void) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const isMounted = useRef(true);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMounted.current) {
      setIsSearching(true);
      
      // For now, we'll just implement client-side filtering
      // In a production app, you would want to implement server-side search
      setTimeout(() => {
        if (isMounted.current) {
          setIsSearching(false);
        }
      }, 300); // Small delay to show loading state
    }
  };

  // Clear search
  const clearSearch = () => {
    if (isMounted.current) {
      setSearchTerm('');
      // Reset pagination when clearing search
      fetchDocuments(0, true);
    }
  };

  // Filter documents based on search term
  const filteredDocuments = searchTerm ? documents.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.contents.some(content => 
      content.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (content.metadata?.file_title && 
       content.metadata.file_title.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  ) : documents;

  return {
    searchTerm,
    setSearchTerm,
    isSearching,
    handleSearch,
    clearSearch,
    filteredDocuments,
    isMounted
  };
};
