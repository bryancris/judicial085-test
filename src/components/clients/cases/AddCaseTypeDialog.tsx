import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFirmCaseTypes } from "@/hooks/useFirmCaseTypes";

interface AddCaseTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (value: string, label: string) => void;
}

const AddCaseTypeDialog: React.FC<AddCaseTypeDialogProps> = ({ open, onOpenChange, onCreated }) => {
  const { addType, canCreate, firmId } = useFirmCaseTypes();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const created = await addType(name.trim());
      onCreated?.(created.value, created.name);
      setName("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setName(""); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create new case type</DialogTitle>
          <DialogDescription>
            {canCreate ? "Add a case type that will be available to everyone in your firm." : (
              firmId === null ? "Join a firm to create shared case types." : "Sign in to create shared case types."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            autoFocus
            placeholder="e.g., Insurance Subrogation"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canCreate || submitting}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canCreate || !name.trim() || submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCaseTypeDialog;
