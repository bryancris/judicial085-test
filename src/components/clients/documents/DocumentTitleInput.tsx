
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DocumentTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  uploadMethod: "text" | "pdf" | "docx";
  disabled: boolean;
}

const DocumentTitleInput: React.FC<DocumentTitleInputProps> = ({
  value,
  onChange,
  uploadMethod,
  disabled
}) => {
  const getPlaceholder = () => {
    if (uploadMethod === "pdf") return "Leave empty to use filename";
    if (uploadMethod === "docx") return "Leave empty to use filename";
    return "Leave empty for default title";
  };

  const getHelpText = () => {
    if (uploadMethod === "pdf") return "If left empty, the filename will be used as the title";
    if (uploadMethod === "docx") return "If left empty, the filename will be used as the title";
    return "If left empty, 'Untitled Document' will be used";
  };

  return (
    <div>
      <Label htmlFor="docTitle">Document Title (Optional)</Label>
      <Input
        id="docTitle"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={getPlaceholder()}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground mt-1">
        {getHelpText()}
      </p>
    </div>
  );
};

export default DocumentTitleInput;
