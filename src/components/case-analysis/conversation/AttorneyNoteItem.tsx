
import React from "react";
import { User } from "lucide-react";
import { CaseAnalysisNote } from "@/hooks/useCaseAnalysisChat";

interface AttorneyNoteItemProps {
  note: CaseAnalysisNote;
}

const AttorneyNoteItem: React.FC<AttorneyNoteItemProps> = ({ note }) => {
  return (
    <div className="py-2 border-b last:border-b-0 border-gray-100">
      <div className="flex items-center mb-1">
        <User className="h-4 w-4 mr-1 text-primary" />
        <span className="text-xs font-medium px-2 py-1 rounded-full mr-2 bg-primary/10 text-primary">
          Attorney Note
        </span>
        <span className="text-xs text-muted-foreground">{note.timestamp}</span>
      </div>
      <p className="text-sm pl-6">{note.content}</p>
    </div>
  );
};

export default AttorneyNoteItem;
