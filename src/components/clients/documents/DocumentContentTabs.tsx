
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import FileUploadInput from "@/components/clients/chat/FileUploadInput";

interface DocumentContentTabsProps {
  uploadMethod: "text" | "pdf" | "docx";
  onMethodChange: (method: "text" | "pdf" | "docx") => void;
  documentContent: string;
  onContentChange: (content: string) => void;
  onFileSelected: (file: File) => void;
  disabled: boolean;
}

const DocumentContentTabs: React.FC<DocumentContentTabsProps> = ({
  uploadMethod,
  onMethodChange,
  documentContent,
  onContentChange,
  onFileSelected,
  disabled
}) => {
  return (
    <Tabs 
      value={uploadMethod} 
      onValueChange={(value) => onMethodChange(value as "text" | "pdf" | "docx")} 
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="text">Text Input</TabsTrigger>
        <TabsTrigger value="pdf">PDF Upload</TabsTrigger>
        <TabsTrigger value="docx">Word Upload</TabsTrigger>
      </TabsList>
      
      <TabsContent value="text" className="mt-4">
        <div>
          <Label htmlFor="docContent">Document Content</Label>
          <Textarea
            id="docContent"
            value={documentContent}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Enter document content"
            className="min-h-[200px]"
            disabled={disabled}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="pdf" className="mt-4">
        <div>
          <Label>Upload PDF Document</Label>
          <div className="mt-2">
            <FileUploadInput 
              onFileSelected={onFileSelected} 
              isProcessing={disabled}
              accept="application/pdf"
            />
          </div>
          {uploadMethod === "pdf" && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your PDF will be processed, text extracted, and vectorized for AI search and analysis.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </TabsContent>

      <TabsContent value="docx" className="mt-4">
        <div>
          <Label>Upload Word Document</Label>
          <div className="mt-2">
            <FileUploadInput 
              onFileSelected={onFileSelected} 
              isProcessing={disabled}
              accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
            />
          </div>
          {uploadMethod === "docx" && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your Word document will be processed, text extracted, and vectorized for AI search and analysis.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default DocumentContentTabs;
