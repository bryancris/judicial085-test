import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, CheckCircle, XCircle, AlertTriangle, Trash2, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import CaseSelector from "@/components/clients/cases/CaseSelector";
import { Case } from "@/types/case";
import { useBulkDocumentProcessing, BulkUploadFile } from "@/hooks/useBulkDocumentProcessing";
import BulkFileUploadInput from "./BulkFileUploadInput";

interface BulkDocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  caseId?: string;
  caseName?: string;
  cases?: Case[];
  allowCaseSelection?: boolean;
  onUploadSuccess?: () => void;
}

const BulkDocumentUploadDialog: React.FC<BulkDocumentUploadDialogProps> = ({
  isOpen,
  onClose,
  clientId,
  caseId,
  caseName,
  cases = [],
  allowCaseSelection = false,
  onUploadSuccess
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>(caseId);
  
  const {
    uploadQueue,
    isProcessing,
    currentlyProcessing,
    addFilesToQueue,
    updateFileInQueue,
    removeFileFromQueue,
    clearCompletedFiles,
    retryFailedFiles,
    processQueue,
    resetQueue
  } = useBulkDocumentProcessing(clientId, onUploadSuccess);

  // Reset selected case when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCaseId(caseId);
    }
  }, [isOpen, caseId]);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      addFilesToQueue(files, selectedCaseId);
    }
  };

  const handleTitleChange = (fileIndex: number, newTitle: string) => {
    updateFileInQueue(fileIndex, { title: newTitle });
  };

  const handleCaseChange = (fileIndex: number, newCaseId: string | undefined) => {
    updateFileInQueue(fileIndex, { caseId: newCaseId });
  };

  const handleStartUpload = async () => {
    if (uploadQueue.length === 0) return;
    await processQueue();
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetQueue();
      onClose();
    }
  };

  const pendingFiles = uploadQueue.filter(f => f.status === 'pending');
  const completedFiles = uploadQueue.filter(f => f.status === 'completed');
  const failedFiles = uploadQueue.filter(f => f.status === 'failed');
  const processingFiles = uploadQueue.filter(f => f.status === 'processing');

  const getStatusIcon = (status: BulkUploadFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: BulkUploadFile['status']) => {
    const variants = {
      pending: "secondary" as const,
      processing: "default" as const,
      completed: "default" as const,
      failed: "destructive" as const
    };
    
    return (
      <Badge variant={variants[status]} className="text-xs">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Document Upload
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 space-y-6 overflow-hidden">
          {/* Case Selection */}
          {allowCaseSelection && (
            <div className="space-y-2">
              <Label>Default Case Assignment</Label>
              <CaseSelector
                cases={cases}
                selectedCaseId={selectedCaseId}
                onCaseSelect={setSelectedCaseId}
                allowClientLevel={true}
                placeholder="Select default case for all documents"
              />
              <p className="text-xs text-muted-foreground">
                You can assign individual documents to different cases below.
              </p>
            </div>
          )}

          {/* File Selection */}
          <div className="space-y-2">
            <Label>Select Documents</Label>
            <BulkFileUploadInput
              onFilesSelected={handleFilesSelected}
              isProcessing={isProcessing}
              maxFiles={10}
              disabled={isProcessing}
            />
          </div>

          {/* Upload Queue */}
          {uploadQueue.length > 0 && (
            <div className="space-y-4 flex-1 min-h-0">
              <div className="flex items-center justify-between">
                <Label>Upload Queue ({uploadQueue.length} files)</Label>
                <div className="flex gap-2">
                  {failedFiles.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retryFailedFiles}
                      disabled={isProcessing}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Retry Failed
                    </Button>
                  )}
                  {completedFiles.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCompletedFiles}
                      disabled={isProcessing}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear Completed
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Summary */}
              {isProcessing && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Processing: {currentlyProcessing || 'Preparing...'}
                    <br />
                    {completedFiles.length} completed, {failedFiles.length} failed, {pendingFiles.length + processingFiles.length} remaining
                  </AlertDescription>
                </Alert>
              )}

              {/* File List */}
              <ScrollArea className="flex-1 border rounded-md">
                <div className="p-4 space-y-3">
                  {uploadQueue.map((fileItem, index) => (
                    <div key={`${fileItem.file.name}-${index}`} className="space-y-3 p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {getStatusIcon(fileItem.status)}
                          <span className="font-medium truncate">{fileItem.file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(fileItem.file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                          {getStatusBadge(fileItem.status)}
                        </div>
                        {fileItem.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFileFromQueue(index)}
                            disabled={isProcessing}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {fileItem.status === 'processing' && fileItem.progress !== undefined && (
                        <Progress value={fileItem.progress} className="h-2" />
                      )}

                      {fileItem.error && (
                        <Alert variant="destructive" className="py-2">
                          <AlertDescription className="text-xs">
                            {fileItem.error}
                          </AlertDescription>
                        </Alert>
                      )}

                      {(fileItem.status === 'pending' || fileItem.status === 'failed') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Document Title</Label>
                            <Input
                              value={fileItem.title}
                              onChange={(e) => handleTitleChange(index, e.target.value)}
                              disabled={isProcessing}
                              className="h-8 text-xs"
                            />
                          </div>
                          {allowCaseSelection && (
                            <div className="space-y-1">
                              <Label className="text-xs">Case Assignment</Label>
                              <CaseSelector
                                cases={cases}
                                selectedCaseId={fileItem.caseId}
                                onCaseSelect={(caseId) => handleCaseChange(index, caseId)}
                                allowClientLevel={true}
                                placeholder="Select case"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {uploadQueue.length > 0 && (
                <>
                  {completedFiles.length} completed • {failedFiles.length} failed • {pendingFiles.length} pending
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Close'}
              </Button>
              {pendingFiles.length > 0 && (
                <Button 
                  onClick={handleStartUpload}
                  disabled={isProcessing || pendingFiles.length === 0}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload {pendingFiles.length} Document{pendingFiles.length === 1 ? '' : 's'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkDocumentUploadDialog;