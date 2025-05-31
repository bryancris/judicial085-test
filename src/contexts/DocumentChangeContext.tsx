
import React, { createContext, useContext, useState, useCallback } from 'react';

interface DocumentChangeContextType {
  documentChangeKey: number;
  notifyDocumentChange: () => void;
}

const DocumentChangeContext = createContext<DocumentChangeContextType | undefined>(undefined);

export const DocumentChangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documentChangeKey, setDocumentChangeKey] = useState(0);

  const notifyDocumentChange = useCallback(() => {
    console.log('Document change notified, incrementing key');
    setDocumentChangeKey(prev => prev + 1);
  }, []);

  return (
    <DocumentChangeContext.Provider value={{ documentChangeKey, notifyDocumentChange }}>
      {children}
    </DocumentChangeContext.Provider>
  );
};

export const useDocumentChange = () => {
  const context = useContext(DocumentChangeContext);
  if (!context) {
    throw new Error('useDocumentChange must be used within a DocumentChangeProvider');
  }
  return context;
};
