
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, BarChart3, Users, Upload, Plus, HelpCircle, Scale, FileText } from "lucide-react";
import { tabColors, tabHoverColors } from "./tabStyles";

const ClientDetailTabsList: React.FC = () => {
  return (
    <div className="space-y-2">
      {/* Top row */}
      <TabsList className="grid w-full grid-cols-4 h-12">
        <TabsTrigger 
          value="client-intake" 
          className={`flex items-center gap-2 ${tabColors["client-intake"]} ${tabHoverColors["client-intake"]} data-[state=active]:${tabColors["client-intake"]} data-[state=active]:opacity-100`}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Client Intake</span>
          <span className="sm:hidden">Intake</span>
        </TabsTrigger>
        <TabsTrigger 
          value="case-analysis" 
          className={`flex items-center gap-2 ${tabColors["analysis"]} ${tabHoverColors["analysis"]} data-[state=active]:${tabColors["analysis"]} data-[state=active]:opacity-100`}
        >
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Case Analysis</span>
          <span className="sm:hidden">Analysis</span>
        </TabsTrigger>
        <TabsTrigger 
          value="case-discussion" 
          className={`flex items-center gap-2 ${tabColors["discussion"]} ${tabHoverColors["discussion"]} data-[state=active]:${tabColors["discussion"]} data-[state=active]:opacity-100`}
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Case Discussion</span>
          <span className="sm:hidden">Discussion</span>
        </TabsTrigger>
        <TabsTrigger 
          value="contracts" 
          className={`flex items-center gap-2 ${tabColors["contracts"]} ${tabHoverColors["contracts"]} data-[state=active]:${tabColors["contracts"]} data-[state=active]:opacity-100`}
        >
          <Scale className="h-4 w-4" />
          <span className="hidden sm:inline">Contracts</span>
          <span className="sm:hidden">Contracts</span>
        </TabsTrigger>
      </TabsList>

      {/* Bottom row */}
      <TabsList className="grid w-full grid-cols-4 h-12">
        <TabsTrigger 
          value="discovery" 
          className={`flex items-center gap-2 ${tabColors["discovery"]} ${tabHoverColors["discovery"]} data-[state=active]:${tabColors["discovery"]} data-[state=active]:opacity-100`}
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Discovery</span>
          <span className="sm:hidden">Discovery</span>
        </TabsTrigger>
        <TabsTrigger 
          value="documents" 
          className={`flex items-center gap-2 ${tabColors["documents"]} ${tabHoverColors["documents"]} data-[state=active]:${tabColors["documents"]} data-[state=active]:opacity-100`}
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload Documents</span>
          <span className="sm:hidden">Upload</span>
        </TabsTrigger>
        <TabsTrigger 
          value="knowledge" 
          className={`flex items-center gap-2 ${tabColors["knowledge"]} ${tabHoverColors["knowledge"]} data-[state=active]:${tabColors["knowledge"]} data-[state=active]:opacity-100`}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Document</span>
          <span className="sm:hidden">Create</span>
        </TabsTrigger>
        <TabsTrigger 
          value="faq" 
          className={`flex items-center gap-2 ${tabColors["faq"]} ${tabHoverColors["faq"]} data-[state=active]:${tabColors["faq"]} data-[state=active]:opacity-100`}
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">FAQ</span>
          <span className="sm:hidden">FAQ</span>
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

export default ClientDetailTabsList;
