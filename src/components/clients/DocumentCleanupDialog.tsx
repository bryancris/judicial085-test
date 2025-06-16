
import React, { useState } from "react";
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
import { Trash2, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cleanupTestDocuments, cleanupAllDuplicateDocuments } from "@/utils/documentCleanupService";

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
  const [cleanupType, setCleanupType] = useState<'test' | 'all' | null>(null);
  const { toast } = useToast();

  const handleCleanup = async (type: 'test' | 'all') => {
    setIsCleaningUp(true);
    setCleanupType(type);
    
    try {
      let result;
      if (type === 'test') {
        result = await cleanupTestDocuments(clientId);
        
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
      <AlertDialogContent>
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
          <div className="space-y-3">
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
                Removes all "Test 1" documents
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
                <Trash2 className="h-4 w-4 mr-2" />
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
