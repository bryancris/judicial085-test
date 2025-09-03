import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { exportQuickConsult } from "@/utils/exportService";
import { useToast } from "@/hooks/use-toast";

interface AttorneyResearchExportButtonProps {
  sessionId: string;
  disabled?: boolean;
}

export const AttorneyResearchExportButton: React.FC<AttorneyResearchExportButtonProps> = ({
  sessionId,
  disabled = false
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      await exportQuickConsult({
        sessionId,
        format: 'word'
      });
      
      toast({
        title: "Export Successful",
        description: "Attorney research session has been exported as Word document.",
      });
    } catch (error: any) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          Export to Word
        </>
      )}
    </Button>
  );
};