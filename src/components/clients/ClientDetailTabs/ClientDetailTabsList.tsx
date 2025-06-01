
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Scale, 
  FileQuestion,
  MessageSquare, 
  FileText, 
  HelpCircle, 
  BookOpen,
  Building
} from "lucide-react";

const ClientDetailTabsList = () => {
  return (
    <div className="flex flex-col gap-2 mb-4">
      {/* First row of tabs */}
      <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4 h-auto">
        <TabsTrigger
          value="client-intake"
          className="data-[state=active]:bg-[#0EA5E9] bg-[#0EA5E9]/80 text-white flex items-center gap-1"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden lg:inline">Intake Chat</span>
          <span className="lg:hidden">Intake</span>
        </TabsTrigger>
        <TabsTrigger
          value="analysis"
          className="data-[state=active]:bg-[#F97316] bg-[#F97316]/80 text-white flex items-center gap-1"
        >
          <Scale className="h-4 w-4" />
          <span>Analysis</span>
        </TabsTrigger>
        <TabsTrigger
          value="discussion"
          className="data-[state=active]:bg-[#9b87f5] bg-[#9b87f5]/80 text-white flex items-center gap-1"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Discussion</span>
        </TabsTrigger>
        <TabsTrigger
          value="contracts"
          className="data-[state=active]:bg-[#22C55E] bg-[#22C55E]/80 text-white flex items-center gap-1"
        >
          <FileText className="h-4 w-4" />
          <span>Contracts</span>
        </TabsTrigger>
      </TabsList>

      {/* Second row of tabs */}
      <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4 h-auto">
        <TabsTrigger
          value="discovery"
          className="data-[state=active]:bg-[#8B5CF6] bg-[#8B5CF6]/80 text-white flex items-center gap-1"
        >
          <FileQuestion className="h-4 w-4" />
          <span>Discovery</span>
        </TabsTrigger>
        <TabsTrigger
          value="documents"
          className="data-[state=active]:bg-[#F97316] bg-[#F97316]/80 text-white flex items-center gap-1"
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden lg:inline">Upload Documents</span>
          <span className="lg:hidden">Upload Docs</span>
        </TabsTrigger>
        <TabsTrigger
          value="knowledge"
          className="data-[state=active]:bg-[#D946EF] bg-[#D946EF]/80 text-white flex items-center gap-1"
        >
          <Building className="h-4 w-4" />
          <span>Resources</span>
        </TabsTrigger>
        <TabsTrigger
          value="faq"
          className="data-[state=active]:bg-[#3B82F6] bg-[#3B82F6]/80 text-white flex items-center gap-1"
        >
          <HelpCircle className="h-4 w-4" />
          <span>FAQ</span>
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

export default ClientDetailTabsList;
