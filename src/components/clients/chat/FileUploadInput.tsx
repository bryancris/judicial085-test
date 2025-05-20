
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp, Loader2, FileText, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FileUploadInputProps {
  onFileSelected: (file: File) => void;
  isProcessing?: boolean;
  accept?: string;
}

const FileUploadInput: React.FC<FileUploadInputProps> = ({
  onFileSelected,
  isProcessing = false,
  accept = "application/pdf"
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    setFileError(null);
    
    // Check file type
    if (!file.type.includes('pdf')) {
      setFileError('Only PDF files are supported');
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Only PDF files are supported",
      });
      return false;
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds 10MB limit');
      toast({
        variant: "destructive",
        title: "File too large",
        description: "File size exceeds 10MB limit",
      });
      return false;
    }
    
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelected(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelected(file);
      }
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <Input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        accept={accept}
        className="hidden"
        disabled={isProcessing}
      />
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50",
          fileError && "border-red-500 bg-red-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
            <p className="text-gray-600">Processing file...</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center justify-center py-2">
            <FileText className="h-10 w-10 text-primary mb-2" />
            <p className="text-gray-800 font-medium mb-1">{selectedFile.name}</p>
            <p className="text-gray-500 text-sm mb-2">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => { 
                e.stopPropagation(); 
                handleRemove(); 
              }}
            >
              Change file
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <FileUp className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-600">
              Drag & drop a PDF file here, or click to select
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Maximum file size: 10MB
            </p>
            {fileError && (
              <div className="flex items-center text-red-600 mt-2">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">{fileError}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadInput;
