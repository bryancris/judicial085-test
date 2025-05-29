
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BookOpenCheck, AlertCircle } from "lucide-react";
import { Case } from "@/types/case";

interface DocumentScopeAlertProps {
  allowCaseSelection: boolean;
  selectedCaseId?: string;
  caseId?: string;
  caseName?: string;
  cases: Case[];
}

const DocumentScopeAlert: React.FC<DocumentScopeAlertProps> = ({
  allowCaseSelection,
  selectedCaseId,
  caseId,
  caseName,
  cases
}) => {
  const getSelectedCaseName = () => {
    if (!selectedCaseId) return "Client-Level";
    const selectedCase = cases.find(c => c.id === selectedCaseId);
    return selectedCase?.case_title || caseName || "Selected Case";
  };

  if (allowCaseSelection) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {selectedCaseId 
            ? `This document will be associated with: ${getSelectedCaseName()}`
            : "This document will be stored at the client level (accessible across all cases)"}
        </AlertDescription>
      </Alert>
    );
  }

  if (!allowCaseSelection && (caseId || caseName)) {
    return (
      <Alert>
        <BookOpenCheck className="h-4 w-4" />
        <AlertDescription>
          This document will be added to case: <strong>{caseName || "Selected Case"}</strong>
          <Badge className="ml-2" variant="secondary">Case Document</Badge>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default DocumentScopeAlert;
