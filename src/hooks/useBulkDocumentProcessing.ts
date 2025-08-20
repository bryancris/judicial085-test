import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { processPdfDocument } from '@/utils/pdfUtils';
import { validateDocumentTitle } from '@/utils/documentCleanupService';

export interface BulkUploadFile {
  file: File;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  progress?: number;
  caseId?: string;
}

export const useBulkDocumentProcessing = (
  clientId: string,
  onComplete?: () => void
) => {
  const [uploadQueue, setUploadQueue] = useState<BulkUploadFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const addFilesToQueue = useCallback((files: File[], defaultCaseId?: string) => {
    const newFiles: BulkUploadFile[] = files.map(file => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for default title
      status: 'pending',
      caseId: defaultCaseId
    }));
    
    setUploadQueue(prev => [...prev, ...newFiles]);
    return newFiles;
  }, []);

  const updateFileInQueue = useCallback((fileIndex: number, updates: Partial<BulkUploadFile>) => {
    setUploadQueue(prev => prev.map((item, index) => 
      index === fileIndex ? { ...item, ...updates } : item
    ));
  }, []);

  const removeFileFromQueue = useCallback((fileIndex: number) => {
    setUploadQueue(prev => prev.filter((_, index) => index !== fileIndex));
  }, []);

  const clearCompletedFiles = useCallback(() => {
    setUploadQueue(prev => prev.filter(item => item.status !== 'completed'));
  }, []);

  const retryFailedFiles = useCallback(() => {
    setUploadQueue(prev => prev.map(item => 
      item.status === 'failed' ? { ...item, status: 'pending', error: undefined } : item
    ));
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing || uploadQueue.length === 0) return;

    setIsProcessing(true);
    const pendingFiles = uploadQueue.filter(item => item.status === 'pending');
    
    if (pendingFiles.length === 0) {
      setIsProcessing(false);
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    // Process files sequentially to avoid overwhelming the server
    for (const fileItem of pendingFiles) {
      const fileIndex = uploadQueue.findIndex(item => item.file === fileItem.file);
      if (fileIndex === -1) continue;

      try {
        // Update status to processing
        setCurrentlyProcessing(fileItem.file.name);
        updateFileInQueue(fileIndex, { 
          status: 'processing', 
          progress: 0 
        });

        // Validate title
        const validation = validateDocumentTitle(fileItem.title);
        if (!validation.valid) {
          throw new Error(validation.error || 'Invalid document title');
        }

        // Process the document
        const result = await processPdfDocument(
          fileItem.file,
          fileItem.title,
          clientId,
          fileItem.caseId
        );

        if (result.success) {
          updateFileInQueue(fileIndex, { 
            status: 'completed', 
            progress: 100 
          });
          successCount++;
        } else {
          throw new Error(result.error || 'Failed to process document');
        }
      } catch (error: any) {
        console.error(`Error processing file ${fileItem.file.name}:`, error);
        updateFileInQueue(fileIndex, { 
          status: 'failed', 
          error: error.message || 'Unknown error occurred',
          progress: 0 
        });
        failureCount++;
      }
    }

    setCurrentlyProcessing(null);
    setIsProcessing(false);

    // Show completion toast
    if (successCount > 0 && failureCount === 0) {
      toast({
        title: "Bulk upload completed",
        description: `Successfully uploaded ${successCount} document${successCount === 1 ? '' : 's'}.`,
      });
    } else if (successCount > 0 && failureCount > 0) {
      toast({
        title: "Bulk upload completed with errors",
        description: `${successCount} document${successCount === 1 ? '' : 's'} uploaded successfully, ${failureCount} failed.`,
        variant: "destructive",
      });
    } else if (failureCount > 0) {
      toast({
        title: "Bulk upload failed",
        description: `All ${failureCount} document${failureCount === 1 ? '' : 's'} failed to upload.`,
        variant: "destructive",
      });
    }

    // Call completion callback
    if (onComplete) {
      onComplete();
    }
  }, [uploadQueue, isProcessing, clientId, updateFileInQueue, toast, onComplete]);

  const resetQueue = useCallback(() => {
    setUploadQueue([]);
    setIsProcessing(false);
    setCurrentlyProcessing(null);
  }, []);

  return {
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
  };
};