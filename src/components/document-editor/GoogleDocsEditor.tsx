
import React, { useState, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import PrintStyles from './PrintStyles';
import DocumentHeader from './DocumentHeader';
import DocumentToolbar from './DocumentToolbar';
import DocumentSidebar from './DocumentSidebar';
import DocumentEditor from './DocumentEditor';

interface GoogleDocsEditorProps {
  clientId: string;
  onSave?: (title: string, content: string) => Promise<void>;
  documentId?: string; // Optional document ID for existing documents
  initialTitle?: string; // Optional initial title
  initialContent?: string; // Optional initial content
}

const GoogleDocsEditor: React.FC<GoogleDocsEditorProps> = ({ 
  clientId, 
  onSave,
  documentId: initialDocumentId,
  initialTitle = "Untitled document",
  initialContent = ""
}) => {
  const [documentTitle, setDocumentTitle] = useState(initialTitle);
  const [documentContent, setDocumentContent] = useState(initialContent);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(initialDocumentId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(initialContent.trim() === '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Set initial content in editor if provided
  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
      setDocumentContent(initialContent);
      setShowPlaceholder(initialContent.trim() === '');
    }
  }, [initialContent]);

  // Auto-save functionality - only if there are unsaved changes and actual content
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && (documentContent.trim() || documentTitle !== "Untitled document")) {
        handleSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [documentContent, documentTitle, hasUnsavedChanges]);

  const handleSave = async () => {
    if (!onSave) return;
    
    // Don't save if there's no meaningful content
    if (!documentContent.trim() && documentTitle === "Untitled document") {
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(documentTitle, documentContent);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving document:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    // Check if document has content
    if (!documentContent.trim() && documentTitle === "Untitled document") {
      toast({
        title: "Nothing to print",
        description: "Please add some content to the document before printing.",
        variant: "destructive",
      });
      return;
    }

    // Get the latest content from the editor
    const currentContent = editorRef.current?.innerHTML || documentContent;
    
    // Update the document content state
    setDocumentContent(currentContent);

    // Ensure the print styles are applied
    const printTitle = document.querySelector('.print-document-title');
    const printContent = document.querySelector('.print-document-content');
    
    if (printTitle) {
      printTitle.textContent = documentTitle;
    }
    
    if (printContent && editorRef.current) {
      printContent.innerHTML = editorRef.current.innerHTML;
    }

    toast({
      title: "Printing...",
      description: "Opening print dialog...",
    });

    // Small delay to ensure content is updated
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setDocumentContent(editorRef.current.innerHTML);
      setHasUnsavedChanges(true);
    }
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setDocumentContent(content);
      setShowPlaceholder(content.trim() === '' || content === '<br>');
      setHasUnsavedChanges(true);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setDocumentTitle(newTitle);
    setHasUnsavedChanges(true);
  };

  const handleFocus = () => {
    setShowPlaceholder(false);
  };

  const handleBlur = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setShowPlaceholder(content.trim() === '' || content === '<br>');
    }
  };

  return (
    <>
      <PrintStyles />

      <div className="h-full flex flex-col bg-gray-50">
        <DocumentHeader
          documentTitle={documentTitle}
          setDocumentTitle={handleTitleChange}
          isSaving={isSaving}
          lastSaved={lastSaved}
          onPrint={handlePrint}
          onSave={handleSave}
        />

        <div className="print-hide">
          <DocumentToolbar onFormatText={formatText} />
        </div>

        {/* Print-only content - positioned to be captured by print styles */}
        <div className="print-show" style={{ display: 'none' }}>
          <div className="print-document-title">{documentTitle}</div>
          <div className="print-document-content" dangerouslySetInnerHTML={{ __html: documentContent }}></div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex print-hide">
          <DocumentSidebar />
          <DocumentEditor
            editorRef={editorRef}
            showPlaceholder={showPlaceholder}
            onContentChange={handleContentChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
      </div>
    </>
  );
};

export default GoogleDocsEditor;
