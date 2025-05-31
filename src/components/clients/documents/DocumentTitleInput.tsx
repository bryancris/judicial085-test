
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
    <div className="space-y-2">
      <Label htmlFor="docTitle">Document Title</Label>
      <Input
        id="docTitle"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={uploadMethod === "pdf" ? "Optional - will use filename if blank" : "Enter document title"}
        disabled={disabled}
      />
    </div>
  );
};

export default DocumentTitleInput;
