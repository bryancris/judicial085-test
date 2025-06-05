
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { ExportOptionsDialog } from "./ExportOptionsDialog";

interface ExportButtonProps {
  clientId: string;
  caseId?: string;
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  clientId,
  caseId,
  disabled = false
}) => {
  const [showExportDialog, setShowExportDialog] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowExportDialog(true)}
        disabled={disabled}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export Analysis
      </Button>

      <ExportOptionsDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        clientId={clientId}
        caseId={caseId}
      />
    </>
  );
};
