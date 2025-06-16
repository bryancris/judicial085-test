
import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trash2, Loader2, AlertCircle, Zap, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { massDeleteTestDocuments, cleanupAllDuplicateDocuments, monitorTestDocuments } from "@/utils/documentCleanupService";

interface DocumentCleanupDialogProps {
  clientId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCleanupComplete: () => void;
}

const DocumentCleanupDialog: React.FC<DocumentCleanupDialogProps> = ({
  clientId,
  isOpen,
  onOpenChange,
  onCleanupComplete
}) => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupType, setCleanupType] = useState<'test' | 'all' | 'mass-test' | null>(null);
  const [progress, setProgress] = useState(0);
  const [testDocumentCount, setTestDocumentCount] = useState(0);
  const { toast } = useToast();

  // Monitor test documents when dialog opens
  useEffect(() => {
    if (isOpen) {
      const checkTestDocs = async () => {
        const monitor = await monitorTestDocuments(clientId);
        setTestDocumentCount(monitor.testDocumentCount);
      };
      checkTestDocs();
      
      // Set up interval to check for new test documents
      const interval = setInterval(checkTestDocs, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, clientId]);

  const handleMassTestCleanup = async () => {
    setIsCleaningUp(true);
    setCleanupType('mass-test');
    setProgress(0);
    
    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const result = await massDeleteTestDocuments(clientId);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result.success) {
        toast({
          title: "Mass cleanup completed",
          description: `Permanently removed ${result.deletedCount} test documents.`,
        });
        
        // Check if new test documents appeared during cleanup
        setTimeout(async () => {
          const monitor = await monitorTestDocuments(clientId);
          if (monitor.testDocumentCount > 0) {
            toast({
              title: "Warning: New test documents detected",
              description: `${monitor.testDocumentCount} new test documents appeared. There may be an automated process creating them.`,
              variant: "destructive",
            });
          }
        }, 2000);
      } else {
        throw new Error(result.error || "Mass cleanup failed");
      }
      
      onCleanupComplete();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error("Mass cleanup error:", error);
      toast({
        title: "Mass cleanup failed",
        description: error.message || "An error occurred during mass cleanup",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
      setCleanupType(null);
      setProgress(0);
    }
  };

  const handleCleanup = async (type: 'test' | 'all') => {
    setIsCleaningUp(true);
    setCleanupType(type);
    
    try {
      let result;
      if (type === 'test') {
        result = await massDeleteTestDocuments(clientId);
        
        if (result.success) {
          toast({
            title: "Test documents cleaned up",
            description: `Removed ${result.deletedCount} test documents.`,
          });
        }
      } else {
        result = await cleanupAllDuplicateDocuments(clientId);
        
        if (result.success) {
          toast({
            title: "Duplicate documents cleaned up",
            description: `Removed ${result.duplicatesRemoved} duplicate documents.`,
          });
        }
      }
      
      if (!result.success) {
        throw new Error(result.error || "Cleanup failed");
      }
      
      onCleanupComplete();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error("Cleanup error:", error);
      toast({
        title: "Cleanup failed",
        description: error.message || "An error occurred during cleanup",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
      setCleanupType(null);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
            Clean Up Documents
          </AlertDialogTitle>
          <AlertDialogDescription>
            Choose what type of cleanup you'd like to perform:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          {testDocumentCount > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>{testDocumentCount}</strong> test documents detected in the last 5 minutes. 
                This suggests an automated process is creating them.
              </p>
            </div>
          )}
          
          {isCleaningUp && cleanupType === 'mass-test' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Mass deleting test documents...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
          
          <div className="space-y-3">
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleMassTestCleanup}
              disabled={isCleaningUp}
            >
              {isCleaningUp && cleanupType === 'mass-test' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Mass Delete ALL Test Documents
              <span className="ml-auto text-sm text-muted-foreground">
                Aggressive cleanup
              </span>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleCleanup('test')}
              disabled={isCleaningUp}
            >
              {isCleaningUp && cleanupType === 'test' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remove Test Documents
              <span className="ml-auto text-sm text-muted-foreground">
                "Test 1" documents only
              </span>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleCleanup('all')}
              disabled={isCleaningUp}
            >
              {isCleaningUp && cleanupType === 'all' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Remove All Duplicates
              <span className="ml-auto text-sm text-muted-foreground">
                Keeps most recent of each title
              </span>
            </Button>
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCleaningUp}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DocumentCleanupDialog;
