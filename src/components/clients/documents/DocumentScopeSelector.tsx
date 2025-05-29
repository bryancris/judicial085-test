
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, BookOpenCheck, FolderOpen, FileText } from "lucide-react";
import { Case } from "@/types/client";

interface DocumentScopeSelectorProps {
  cases: Case[];
  selectedScope: string;
  onScopeChange: (scope: string) => void;
  currentCase?: Case | null;
  className?: string;
}

const DocumentScopeSelector: React.FC<DocumentScopeSelectorProps> = ({
  cases,
  selectedScope,
  onScopeChange,
  currentCase,
  className
}) => {
  return (
    <Select value={selectedScope} onValueChange={onScopeChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select document scope" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="client">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Client Level</span>
            <Badge variant="outline">General</Badge>
          </div>
        </SelectItem>
        
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span>All Documents</span>
            <Badge variant="outline">Everything</Badge>
          </div>
        </SelectItem>
        
        {currentCase && (
          <SelectItem value="case">
            <div className="flex items-center gap-2">
              <BookOpenCheck className="h-4 w-4" />
              <span>Current Case</span>
              <Badge variant="secondary">{currentCase.case_title}</Badge>
            </div>
          </SelectItem>
        )}
        
        {cases && cases.length > 0 && (
          <>
            {cases.map(caseItem => (
              <SelectItem key={caseItem.id} value={caseItem.id}>
                <div className="flex items-center gap-2 truncate max-w-[200px]">
                  <FileText className="h-4 w-4" />
                  <span className="truncate">{caseItem.case_title}</span>
                  <Badge variant="outline" className="text-xs">
                    {caseItem.case_type || 'Case'}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
};

export default DocumentScopeSelector;
