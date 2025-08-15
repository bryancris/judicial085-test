import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { TemplatesTabContent } from "../clients/ClientDetailTabs/TemplatesTabContent";

interface TemplatesDialogProps {
  trigger?: React.ReactNode;
}

export const TemplatesDialog = ({ trigger }: TemplatesDialogProps) => {
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <Button variant="outline" className="flex items-center gap-2">
      <FileText className="h-4 w-4" />
      Templates
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Templates</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <TemplatesTabContent />
        </div>
      </DialogContent>
    </Dialog>
  );
};