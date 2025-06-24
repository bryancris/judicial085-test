
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

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print blocked",
        description: "Please allow pop-ups for this site to enable printing.",
        variant: "destructive",
      });
      return;
    }

    // Generate print-friendly HTML
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentTitle}</title>
          <style>
            @media print {
              @page {
                margin: 1in;
                size: letter;
              }
              
              body {
                font-family: Arial, sans-serif;
                font-size: 11pt;
                line-height: 1.6;
                color: black;
                background: white;
              }
              
              .document-title {
                font-size: 16pt;
                font-weight: bold;
                margin-bottom: 24px;
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 12px;
              }
              
              .document-content {
                font-size: 11pt;
                line-height: 1.6;
              }
              
              .document-content h1 { font-size: 14pt; margin: 18px 0 12px 0; }
              .document-content h2 { font-size: 13pt; margin: 16px 0 10px 0; }
              .document-content h3 { font-size: 12pt; margin: 14px 0 8px 0; }
              .document-content p { margin: 6px 0; }
              .document-content ul, .document-content ol { margin: 6px 0; padding-left: 24px; }
              .document-content li { margin: 3px 0; }
              
              /* Force page breaks */
              .page-break { page-break-before: always; }
              
              /* Prevent orphans and widows */
              p, li { orphans: 2; widows: 2; }
              h1, h2, h3 { page-break-after: avoid; }
            }
            
            @media screen {
              body {
                font-family: Arial, sans-serif;
                max-width: 8.5in;
                margin: 0 auto;
                padding: 1in;
                background: white;
              }
              
              .document-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 24px;
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 12px;
              }
              
              .document-content {
                font-size: 16px;
                line-height: 1.6;
              }
            }
          </style>
        </head>
        <body>
          <div class="document-title">${documentTitle}</div>
          <div class="document-content">${documentContent || '<p><em>No content to print</em></p>'}</div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };

    toast({
      title: "Printing...",
      description: "Your document is being prepared for printing.",
    });
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2">
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

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r p-4 hidden lg:block">
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
            {/* Ruler */}
            <div className="h-6 bg-white border-l border-r border-t mb-0 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent" 
                   style={{
                     backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 95px, #e5e7eb 95px, #e5e7eb 96px)`
                   }}>
              </div>
              <div className="absolute left-0 top-0 w-2 h-full bg-blue-500"></div>
              <div className="absolute right-0 top-0 w-2 h-full bg-blue-500"></div>
            </div>

            {/* Document Paper */}
            <Card className="min-h-[800px] bg-white shadow-lg border border-gray-200 p-16">
              <div className="relative">
                {showPlaceholder && (
                  <div className="absolute top-0 left-0 text-gray-400 pointer-events-none">
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
  );
};

export default GoogleDocsEditor;
