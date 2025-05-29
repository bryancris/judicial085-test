
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DocumentTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  uploadMethod: "text" | "pdf";
  disabled: boolean;
}

const DocumentTitleInput: React.FC<DocumentTitleInputProps> = ({
  value,
  onChange,
  uploadMethod,
  disabled
}) => {
  return (
    <div>
      <Label htmlFor="docTitle">Document Title (Optional)</Label>
      <Input
        id="docTitle"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={uploadMethod === "pdf" ? "Leave empty to use filename" : "Leave empty for default title"}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground mt-1">
        {uploadMethod === "pdf" 
          ? "If left empty, the filename will be used as the title"
          : "If left empty, 'Untitled Document' will be used"}
      </p>
    </div>
  );
};

export default DocumentTitleInput;
