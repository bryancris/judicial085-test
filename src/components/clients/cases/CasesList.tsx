
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, Edit, Trash2, Clock, FileText } from "lucide-react";
import { Case } from "@/types/case";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import CaseForm from "./CaseForm";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useClientCases } from "@/hooks/useClientCases";
import { Skeleton } from "@/components/ui/skeleton";

interface CasesListProps {
  clientId: string;
  onSelectCase: (caseData: Case) => void;
}

const CasesList = ({ clientId, onSelectCase }: CasesListProps) => {
  const { cases, loading, error, updateCase, deleteCase } = useClientCases(clientId);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  
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
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>Error loading cases: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cases.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 opacity-50 mb-2" />
            <p>No cases found for this client.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {cases.map((caseData) => (
        <Card 
          key={caseData.id} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectCase(caseData)}
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
                    handleEditClick(caseData);
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
                    handleDeleteClick(caseData);
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
      ))}
      
      {isEditDialogOpen && selectedCase && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Case</DialogTitle>
              <DialogDescription>
                Make changes to the case details below.
              </DialogDescription>
            </DialogHeader>
            <CaseForm
              initialData={selectedCase}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the case "{selectedCase?.case_title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CasesList;
