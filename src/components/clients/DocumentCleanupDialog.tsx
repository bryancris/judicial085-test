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
import { Trash2, Loader2, AlertCircle, Zap, RefreshCw, Skull } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { massDeleteTestDocuments, cleanupAllDuplicateDocuments, monitorTestDocuments } from "@/utils/documentCleanupService";
import { nuclearDeleteTestDocuments, startTestDocumentMonitoring, blockTestDocumentCreation } from "@/utils/aggressiveDocumentCleanup";

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
  const [cleanupType, setCleanupType] = useState<'test' | 'all' | 'mass-test' | 'nuclear' | null>(null);
  const [progress, setProgress] = useState(0);
  const [testDocumentCount, setTestDocumentCount] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [detectedDuringCleanup, setDetectedDuringCleanup] = useState(0);
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

  // Start monitoring when cleanup begins
  useEffect(() => {
    if (isCleaningUp && (cleanupType === 'nuclear' || cleanupType === 'mass-test')) {
      setIsMonitoring(true);
      
      const stopMonitoring = startTestDocumentMonitoring(clientId, (count) => {
        setDetectedDuringCleanup(prev => prev + count);
        toast({
          title: "🚨 Test documents detected during cleanup!",
          description: `${count} new test documents appeared. Auto-deleting...`,
          variant: "destructive",
        });
      });
      
      // Set up document blocking
      blockTestDocumentCreation();
      
      return () => {
        stopMonitoring();
        setIsMonitoring(false);
      };
    }
  }, [isCleaningUp, cleanupType, clientId, toast]);

  const handleNuclearCleanup = async () => {
    setIsCleaningUp(true);
    setCleanupType('nuclear');
    setProgress(0);
    setDetectedDuringCleanup(0);
    
    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 100);
      
      toast({
        title: "🚨 NUCLEAR CLEANUP INITIATED",
        description: "Using admin privileges to eliminate all test documents...",
        variant: "destructive",
      });
      
      const result = await nuclearDeleteTestDocuments(clientId);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result.success) {
        toast({
          title: "☢️ Nuclear cleanup completed",
          description: `Obliterated ${result.deletedCount} test documents using admin privileges.`,
        });
        
        // Wait a moment then check for survivors
        setTimeout(async () => {
          const monitor = await monitorTestDocuments(clientId);
          if (monitor.testDocumentCount > 0) {
            toast({
              title: "⚠️ SURVIVORS DETECTED",
              description: `${monitor.testDocumentCount} test documents survived nuclear cleanup. There's definitely an automated process creating them.`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "✅ Target eliminated",
              description: "All test documents have been successfully eliminated.",
            });
          }
        }, 3000);
      } else {
        throw new Error(result.error || "Nuclear cleanup failed");
      }
      
      onCleanupComplete();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error("Nuclear cleanup error:", error);
      toast({
        title: "☢️ Nuclear cleanup failed",
        description: error.message || "The nuclear option has failed. This is serious.",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
      setCleanupType(null);
      setProgress(0);
    }
  };

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
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                🚨 <strong>{testDocumentCount}</strong> test documents detected! 
                An automated process is likely creating them continuously.
              </p>
            </div>
          )}
          
          {detectedDuringCleanup > 0 && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                ⚡ <strong>{detectedDuringCleanup}</strong> test documents appeared during cleanup!
              </p>
            </div>
          )}
          
          {isCleaningUp && cleanupType === 'nuclear' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-600 font-semibold">☢️ Nuclear cleanup in progress...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full bg-red-100" />
              {isMonitoring && (
                <p className="text-xs text-red-600">🔍 Real-time monitoring active</p>
              )}
            </div>
          )}
          
          <div className="space-y-3">
            <Button
              variant="destructive"
              className="w-full justify-start bg-red-600 hover:bg-red-700"
              onClick={handleNuclearCleanup}
              disabled={isCleaningUp}
            >
              {isCleaningUp && cleanupType === 'nuclear' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Skull className="h-4 w-4 mr-2" />
              )}
              ☢️ NUCLEAR OPTION
              <span className="ml-auto text-sm text-muted-foreground">
                Admin privileges
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
