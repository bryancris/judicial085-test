
import React, { useState } from "react";
import { Case } from "@/types/case";
import { useClientCases } from "@/hooks/useClientCases";
import { Skeleton } from "@/components/ui/skeleton";
import CaseCard from "./CaseCard";
import EmptyCasesList from "./EmptyCasesList";
import CasesListError from "./CasesListError";
import EditCaseDialog from "./EditCaseDialog";
import DeleteCaseDialog from "./DeleteCaseDialog";

interface CasesListProps {
  clientId: string;
  onSelectCase: (caseData: Case) => void;
}

const CasesList = ({ clientId, onSelectCase }: CasesListProps) => {
  const { cases, loading, error, updateCase, deleteCase } = useClientCases(clientId);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  
  console.log("CasesList rendering with clientId:", clientId);
  console.log("Cases data in component:", cases);
  
  const handleEditClick = (caseData: Case) => {
    setSelectedCase(caseData);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (caseData: Case) => {
    setSelectedCase(caseData);
    setIsDeleteDialogOpen(true);
  };
  
  const handleEditSubmit = async (formData: any) => {
    if (selectedCase) {
      await updateCase(selectedCase.id, formData);
      setIsEditDialogOpen(false);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (selectedCase) {
      await deleteCase(selectedCase.id);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="hover:shadow-md transition-shadow">
            <div className="pb-2 p-6">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="px-6 pb-6">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <CasesListError error={error} />;
  }

  if (!cases || cases.length === 0) {
    return <EmptyCasesList />;
  }

  return (
    <div className="space-y-4">
      {cases.map((caseData) => (
        <CaseCard
          key={caseData.id}
          caseData={caseData}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onClick={() => onSelectCase(caseData)}
        />
      ))}
      
      <EditCaseDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedCase={selectedCase}
        onSubmit={handleEditSubmit}
      />
      
      <DeleteCaseDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        selectedCase={selectedCase}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default CasesList;
