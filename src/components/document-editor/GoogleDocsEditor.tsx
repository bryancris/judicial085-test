
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  Save,
  MoreHorizontal,
  ChevronDown,
  Printer,
  Share
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface GoogleDocsEditorProps {
  clientId: string;
  onSave?: (title: string, content: string) => Promise<void>;
}

const GoogleDocsEditor: React.FC<GoogleDocsEditorProps> = ({ clientId, onSave }) => {
  const [documentTitle, setDocumentTitle] = useState("Untitled document");
  const [documentContent, setDocumentContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (documentContent.trim() || documentTitle !== "Untitled document") {
        handleSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [documentContent, documentTitle]);

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(documentTitle, documentContent);
      setLastSaved(new Date());
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

    toast({
      title: "Printing...",
      description: "Opening print dialog...",
    });

    // Small delay to ensure content is updated, then print
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setDocumentContent(editorRef.current.innerHTML);
    }
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setDocumentContent(content);
      setShowPlaceholder(content.trim() === '' || content === '<br>');
    }
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

  const formatLastSaved = () => {
    if (!lastSaved) return "";
    return `Last saved: ${lastSaved.toLocaleTimeString()}`;
  };

  return (
    <>
      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          @page {
            margin: 1in;
            size: letter;
          }
          
          .print-hide {
            display: none !important;
          }
          
          .print-show {
            display: block !important;
          }
          
          .print-document-title {
            font-size: 18pt !important;
            font-weight: bold !important;
            margin-bottom: 24px !important;
            text-align: center !important;
            border-bottom: 2px solid #333 !important;
            padding-bottom: 12px !important;
            color: black !important;
          }
          
          .print-document-content {
            font-size: 12pt !important;
            line-height: 1.6 !important;
            color: black !important;
            background: white !important;
          }
          
          .print-document-content h1 { font-size: 16pt !important; margin: 18px 0 12px 0 !important; }
          .print-document-content h2 { font-size: 14pt !important; margin: 16px 0 10px 0 !important; }
          .print-document-content h3 { font-size: 13pt !important; margin: 14px 0 8px 0 !important; }
          .print-document-content p { margin: 8px 0 !important; }
          .print-document-content ul, .print-document-content ol { margin: 8px 0 !important; padding-left: 24px !important; }
          .print-document-content li { margin: 4px 0 !important; }
          
          /* Prevent orphans and widows */
          .print-document-content p, .print-document-content li { 
            orphans: 2; 
            widows: 2; 
          }
          .print-document-content h1, .print-document-content h2, .print-document-content h3 { 
            page-break-after: avoid; 
          }
          
          body {
            font-family: Arial, sans-serif !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      <div className="h-full flex flex-col bg-gray-50">
        {/* Header - Hidden in print */}
        <div className="bg-white border-b px-4 py-2 print-hide">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <Input
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="text-lg font-normal border-none shadow-none focus:ring-0 px-2 py-1 max-w-md"
                placeholder="Untitled document"
              />
              <div className="text-sm text-gray-500">
                {isSaving ? "Saving..." : formatLastSaved()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share className="h-4 w-4" />
              </Button>
              <Button onClick={handleSave} disabled={isSaving} size="sm">
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => formatText('undo')}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatText('redo')}>
              <Redo className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            <select className="border rounded px-2 py-1 text-sm bg-white">
              <option>Normal text</option>
              <option>Heading 1</option>
              <option>Heading 2</option>
              <option>Heading 3</option>
            </select>
            
            <select className="border rounded px-2 py-1 text-sm bg-white ml-2">
              <option>Arial</option>
              <option>Times New Roman</option>
              <option>Calibri</option>
              <option>Georgia</option>
            </select>
            
            <select className="border rounded px-2 py-1 text-sm bg-white ml-2">
              <option>11</option>
              <option>12</option>
              <option>14</option>
              <option>16</option>
              <option>18</option>
            </select>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            <Button variant="ghost" size="sm" onClick={() => formatText('bold')}>
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatText('italic')}>
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatText('underline')}>
              <Underline className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            <Button variant="ghost" size="sm" onClick={() => formatText('justifyLeft')}>
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatText('justifyCenter')}>
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatText('justifyRight')}>
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatText('justifyFull')}>
              <AlignJustify className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            <Button variant="ghost" size="sm" onClick={() => formatText('insertUnorderedList')}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatText('insertOrderedList')}>
              <ListOrdered className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Print-only title */}
        <div className="hidden print-show">
          <div className="print-document-title">{documentTitle}</div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Left Sidebar - Hidden in print */}
          <div className="w-64 bg-white border-r p-4 hidden lg:block print-hide">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm mb-2">Document outline</h3>
                <p className="text-xs text-gray-500">No headings in document</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium text-sm mb-2">Page navigation</h3>
                <p className="text-xs text-gray-500">Page 1 of 1</p>
              </div>
            </div>
          </div>

          {/* Document Area */}
          <div className="flex-1 p-8 overflow-auto">
            <div className="max-w-4xl mx-auto">
              {/* Ruler - Hidden in print */}
              <div className="h-6 bg-white border-l border-r border-t mb-0 relative print-hide">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent" 
                     style={{
                       backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 95px, #e5e7eb 95px, #e5e7eb 96px)`
                     }}>
                </div>
                <div className="absolute left-0 top-0 w-2 h-full bg-blue-500"></div>
                <div className="absolute right-0 top-0 w-2 h-full bg-blue-500"></div>
              </div>

              {/* Document Paper */}
              <Card className="min-h-[800px] bg-white shadow-lg border border-gray-200 p-16 print:shadow-none print:border-none print:p-0">
                <div className="relative print-document-content">
                  {showPlaceholder && (
                    <div className="absolute top-0 left-0 text-gray-400 pointer-events-none print-hide">
                      Start typing your document...
                    </div>
                  )}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleContentChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="min-h-[600px] outline-none text-base leading-relaxed"
                    style={{
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '11pt',
                      lineHeight: '1.6',
                    }}
                  >
                    {/* Initial placeholder content */}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoogleDocsEditor;
