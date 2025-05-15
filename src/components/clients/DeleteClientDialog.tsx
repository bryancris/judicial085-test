
import React from "react";
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
import { Client } from "@/types/client";

interface DeleteClientDialogProps {
  client: Client;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteClientDialog = ({
  client,
  isOpen,
  setIsOpen,
  onConfirm,
  isDeleting,
}: DeleteClientDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            <p>
              This will permanently delete {client.first_name} {client.last_name} and all associated data including:
            </p>
            {/* List moved outside of paragraph tag to fix DOM nesting */}
            <ul className="list-disc pl-5 text-sm mt-2">
              <li>Contract reviews</li>
              <li>Case discussions</li>
              <li>Case analysis notes</li>
              <li>Legal analyses</li>
              <li>Client messages</li>
              <li>Discovery documents</li>
              <li>All cases</li>
            </ul>
            <p className="font-medium text-red-500 pt-2">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-red-500 hover:bg-red-600"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Yes, delete client"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteClientDialog;
