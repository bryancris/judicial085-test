import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp, Loader2, Files, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BulkFileUploadInputProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing?: boolean;
  accept?: string;
  maxFiles?: number;
  disabled?: boolean;
}

const BulkFileUploadInput: React.FC<BulkFileUploadInputProps> = ({
  onFilesSelected,
  isProcessing = false,
  accept = "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx",
  maxFiles = 10,
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Check file type
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type === type;
    });

    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: `File "${file.name}" is not a supported format.`,
        variant: "destructive",
      });
      return false;
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File "${file.name}" exceeds the 50MB limit.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateFile);

    if (validFiles.length === 0) return;

    // Check total file count
    const totalFiles = selectedFiles.length + validFiles.length;
    if (totalFiles > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed. Please select fewer files.`,
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates
    const newFiles = validFiles.filter(file => 
      !selectedFiles.some(existing => 
        existing.name === file.name && existing.size === file.size
      )
    );

    if (newFiles.length !== validFiles.length) {
      toast({
        title: "Duplicate files",
        description: "Some files were already selected and have been skipped.",
      });
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...selectedFiles, ...newFiles];
      setSelectedFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || isProcessing) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || isProcessing) return;
    handleFiles(e.target.files);
  };

  const removeFile = (indexToRemove: number) => {
    const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    onFilesSelected([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled || isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !isProcessing && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={disabled || isProcessing}
        />
        
        <div className="flex flex-col items-center space-y-4">
          {isProcessing ? (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          ) : (
            <Files className="h-10 w-10 text-muted-foreground" />
          )}
          
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {isProcessing 
                ? "Processing files..." 
                : `Drop up to ${maxFiles} files here or click to browse`
              }
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF and Word documents (max 50MB each)
            </p>
          </div>
          
          {!isProcessing && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              <FileUp className="h-4 w-4 mr-2" />
              Select Files
            </Button>
          )}
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Selected Files ({selectedFiles.length}/{maxFiles})
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFiles}
              disabled={disabled || isProcessing}
            >
              Clear All
            </Button>
          </div>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <Files className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={disabled || isProcessing}
                  className="h-6 w-6 p-0 flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkFileUploadInput;