
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, BookOpenCheck, User } from "lucide-react";
import { Case } from "@/types/case";

interface DocumentScopeAlertProps {
  allowCaseSelection: boolean;
  selectedCaseId?: string;
  caseId?: string;
  caseName?: string;
  cases?: Case[];
}

const DocumentScopeAlert: React.FC<DocumentScopeAlertProps> = ({
  allowCaseSelection,
  selectedCaseId,
  caseId,
  caseName,
  cases
}) => {
  const getSelectedCaseName = () => {
    if (!selectedCaseId) return null;
    const selectedCase = cases?.find(c => c.id === selectedCaseId);
    return selectedCase?.case_title || caseName;
  };

  const selectedCaseName = getSelectedCaseName();

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        {allowCaseSelection ? (
          selectedCaseId ? (
            <div className="flex items-center gap-2">
              <BookOpenCheck className="h-4 w-4 text-blue-600" />
              <span>This document will be added to case: <strong>{selectedCaseName}</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" />
              <span>This document will be added to the client's general documents (not case-specific)</span>
            </div>
          )
        ) : (
          caseId ? (
            <div className="flex items-center gap-2">
              <BookOpenCheck className="h-4 w-4 text-blue-600" />
              <span>This document will be added to case: <strong>{caseName}</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" />
              <span>This document will be added to the client's general documents</span>
            </div>
          )
        )}
      </AlertDescription>
    </Alert>
  );
};

export default DocumentScopeAlert;
