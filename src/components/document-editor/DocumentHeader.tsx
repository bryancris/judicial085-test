
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Share, Save } from "lucide-react";

interface DocumentHeaderProps {
  documentTitle: string;
  setDocumentTitle: (title: string) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  onPrint: () => void;
  onSave: () => void;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  documentTitle,
  setDocumentTitle,
  isSaving,
  lastSaved,
  onPrint,
  onSave
}) => {
  const formatLastSaved = () => {
    if (!lastSaved) return "";
    return `Last saved: ${lastSaved.toLocaleTimeString()}`;
  };

  return (
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
          <Button variant="ghost" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Share className="h-4 w-4" />
          </Button>
          <Button onClick={onSave} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentHeader;
