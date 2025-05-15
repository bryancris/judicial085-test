
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Edit, Folder, Trash2 } from "lucide-react";
import { Case } from "@/types/case";
import { formatDistanceToNow } from "date-fns";

interface CaseCardProps {
  caseData: Case;
  onEdit: (caseData: Case) => void;
  onDelete: (caseData: Case) => void;
  onClick: () => void;
}

const CaseCard = ({ caseData, onEdit, onDelete, onClick }: CaseCardProps) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              {caseData.case_title}
            </CardTitle>
            <CardDescription>
              {caseData.case_number ? `Case #: ${caseData.case_number}` : "No case number"}
              {caseData.case_type ? ` • Type: ${caseData.case_type}` : ""}
            </CardDescription>
          </div>
          <div className="flex space-x-1" onClick={e => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(caseData);
              }}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(caseData);
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {caseData.case_description && (
          <p className="line-clamp-2 text-muted-foreground text-sm">
            {caseData.case_description}
          </p>
        )}
        <div className="flex items-center text-xs text-muted-foreground mt-2">
          <Clock className="h-3 w-3 mr-1" />
          Created {formatDistanceToNow(new Date(caseData.created_at), { addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseCard;
