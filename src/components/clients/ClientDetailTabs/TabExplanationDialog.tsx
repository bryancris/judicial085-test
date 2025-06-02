
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, BarChart3, Users, Upload, Plus, HelpCircle, Scale, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface TabExplanationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TabExplanationDialog: React.FC<TabExplanationDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const tabExplanations = [
    {
      name: "Client Intake",
      icon: <MessageSquare className="h-5 w-5" />,
      color: "bg-[#0EA5E9]",
      description: "Collect and record initial client information, case details, and client concerns. This tab helps establish the foundation of the attorney-client relationship.",
    },
    {
      name: "Case Analysis",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "bg-[#F97316]",
      description: "Review case strengths, weaknesses, and potential outcomes. This tab provides analytical insights and legal strategy recommendations.",
    },
    {
      name: "Case Discussion",
      icon: <Users className="h-5 w-5" />,
      color: "bg-[#9b87f5]",
      description: "Collaborate with colleagues or AI assistants on case strategy, legal theories, and approaches to specific legal issues.",
    },
    {
      name: "Contracts",
      icon: <Scale className="h-5 w-5" />,
      color: "bg-[#22C55E]",
      description: "Review and analyze contracts, agreements, and legal documents. Identify potential issues, risks, and suggested modifications using AI-powered contract analysis.",
    },
    {
      name: "Discovery",
      icon: <FileText className="h-5 w-5" />,
      color: "bg-[#8B5CF6]",
      description: "Manage discovery requests and responses, organize evidence, and prepare document production for litigation cases.",
    },
    {
      name: "Upload Documents",
      icon: <Upload className="h-5 w-5" />,
      color: "bg-[#F97316]",
      description: "Upload and store client documents, evidence, contracts, and other case-related files. Organize documents for easy access and reference.",
    },
    {
      name: "Create Document",
      icon: <Plus className="h-5 w-5" />,
      color: "bg-[#D946EF]",
      description: "Create new legal documents using our document editor. Draft contracts, pleadings, letters, and other legal documents with built-in templates and formatting.",
    },
    {
      name: "FAQ",
      icon: <HelpCircle className="h-5 w-5" />,
      color: "bg-[#3B82F6]",
      description: "Access help and guidance on using the client management interface. View explanations of each tab's functionality and features.",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Client Detail Tabs Guide</DialogTitle>
          <DialogDescription>
            Understanding the purpose of each tab in the client management interface
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {tabExplanations.map((tab, index) => (
            <div key={tab.name} className="space-y-2">
              <div className="flex items-center gap-3">
                <div className={`${tab.color} p-2 rounded-md text-white`}>
                  {tab.icon}
                </div>
                <h3 className="text-lg font-semibold">{tab.name}</h3>
              </div>
              <p className="text-muted-foreground ml-11">{tab.description}</p>
              {index < tabExplanations.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TabExplanationDialog;
