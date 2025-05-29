
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpenCheck, User, FolderOpen } from "lucide-react";
import { Case } from "@/types/client";

interface CaseSelectorProps {
  cases: Case[];
  selectedCaseId?: string;
  onCaseSelect: (caseId: string | undefined) => void;
  allowClientLevel?: boolean;
  placeholder?: string;
  className?: string;
}

const CaseSelector: React.FC<CaseSelectorProps> = ({
  cases,
  selectedCaseId,
  onCaseSelect,
  allowClientLevel = true,
  placeholder = "Select case or client-level",
  className
}) => {
  return (
    <Select value={selectedCaseId || "client"} onValueChange={(value) => onCaseSelect(value === "client" ? undefined : value)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowClientLevel && (
          <SelectItem value="client">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Client-Level Document</span>
              <Badge variant="outline">General</Badge>
            </div>
          </SelectItem>
        )}
        {cases && cases.length > 0 ? (
          cases.map((caseItem) => (
            <SelectItem key={caseItem.id} value={caseItem.id}>
              <div className="flex items-center gap-2">
                <BookOpenCheck className="h-4 w-4" />
                <span className="truncate max-w-[200px]">{caseItem.case_title}</span>
                <Badge variant="secondary">{caseItem.case_type || 'Case'}</Badge>
              </div>
            </SelectItem>
          ))
        ) : (
          <SelectItem value="no-cases" disabled>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FolderOpen className="h-4 w-4" />
              <span>No cases available</span>
            </div>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default CaseSelector;
