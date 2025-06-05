
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Download } from "lucide-react";
import { exportCaseAnalysis, ExportOptions } from "@/utils/exportService";
import { useToast } from "@/hooks/use-toast";

interface ExportOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  caseId?: string;
}

export const ExportOptionsDialog: React.FC<ExportOptionsDialogProps> = ({
  isOpen,
  onClose,
  clientId,
  caseId
}) => {
  const [format, setFormat] = useState<'pdf' | 'word'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const options: ExportOptions = {
        clientId,
        caseId,
        format,
      };

      await exportCaseAnalysis(options);
      
      toast({
        title: "Export Successful",
        description: `Case analysis has been exported as ${format.toUpperCase()}.`,
      });
      
      onClose();
    } catch (error: any) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export case analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Case Analysis
          </DialogTitle>
          <DialogDescription>
            Choose the format for your case analysis export. The document will include
            all available analysis data, similar cases, and supporting information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'pdf' | 'word')} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="cursor-pointer">
                  PDF Document (.pdf)
                  <span className="block text-xs text-muted-foreground">
                    Professional formatting, ready for printing or sharing
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="word" id="word" />
                <Label htmlFor="word" className="cursor-pointer">
                  Word Document (.docx)
                  <span className="block text-xs text-muted-foreground">
                    Editable format with structured headings and hyperlinks
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
