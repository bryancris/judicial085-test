
import React from 'react';
import { Card } from "@/components/ui/card";

interface DocumentEditorProps {
  editorRef: React.RefObject<HTMLDivElement>;
  showPlaceholder: boolean;
  onContentChange: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  editorRef,
  showPlaceholder,
  onContentChange,
  onFocus,
  onBlur
}) => {
  return (
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
              onInput={onContentChange}
              onFocus={onFocus}
              onBlur={onBlur}
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
  );
};

export default DocumentEditor;
