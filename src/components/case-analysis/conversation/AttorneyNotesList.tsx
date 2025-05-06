
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CaseAnalysisNote } from "@/hooks/useCaseAnalysisChat";
import AttorneyNoteItem from "./AttorneyNoteItem";

interface AttorneyNotesListProps {
  notes: CaseAnalysisNote[];
  isLoading: boolean;
}

const AttorneyNotesList: React.FC<AttorneyNotesListProps> = ({ notes, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-[20px] w-full" />
        <Skeleton className="h-[20px] w-3/4" />
        <Skeleton className="h-[20px] w-5/6" />
      </div>
    );
  }
  
  if (notes.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No attorney notes yet. Add your first note below.</p>
    );
  }
  
  return (
    <div className="space-y-2 mb-4">
      {notes.map((note, index) => (
        <AttorneyNoteItem key={index} note={note} />
      ))}
    </div>
  );
};

export default AttorneyNotesList;
