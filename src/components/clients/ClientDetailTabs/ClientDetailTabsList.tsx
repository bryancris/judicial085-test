
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  FileText, 
  Note, 
  HelpCircle, 
  BookOpen, 
  Scale, 
  MessageCircle,
  Building,
  FileQuestion
} from "lucide-react";

const ClientDetailTabsList = () => {
  return (
    <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 lg:grid-cols-9 mb-4 h-auto">
      <TabsTrigger
        value="client-intake"
        className="data-[state=active]:bg-brand-burgundy data-[state=active]:text-white flex items-center gap-1"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden lg:inline">Intake Chat</span>
        <span className="lg:hidden">Intake</span>
      </TabsTrigger>
      <TabsTrigger
        value="analysis"
        className="data-[state=active]:bg-brand-burgundy data-[state=active]:text-white flex items-center gap-1"
      >
        <Scale className="h-4 w-4" />
        <span>Analysis</span>
      </TabsTrigger>
      <TabsTrigger
        value="discovery"
        className="data-[state=active]:bg-brand-burgundy data-[state=active]:text-white flex items-center gap-1"
      >
        <FileQuestion className="h-4 w-4" />
        <span>Discovery</span>
      </TabsTrigger>
      <TabsTrigger
        value="discussion"
        className="data-[state=active]:bg-brand-burgundy data-[state=active]:text-white flex items-center gap-1"
      >
        <MessageSquare className="h-4 w-4" />
        <span>Discussion</span>
      </TabsTrigger>
      <TabsTrigger
        value="contracts"
        className="data-[state=active]:bg-brand-burgundy data-[state=active]:text-white flex items-center gap-1"
      >
        <FileText className="h-4 w-4" />
        <span>Contracts</span>
      </TabsTrigger>
      <TabsTrigger
        value="documents"
        className="data-[state=active]:bg-brand-burgundy data-[state=active]:text-white flex items-center gap-1"
      >
        <BookOpen className="h-4 w-4" />
        <span>Documents</span>
      </TabsTrigger>
      <TabsTrigger
        value="knowledge"
        className="data-[state=active]:bg-brand-burgundy data-[state=active]:text-white flex items-center gap-1"
      >
        <Building className="h-4 w-4" />
        <span>Resources</span>
      </TabsTrigger>
      <TabsTrigger
        value="notes"
        className="data-[state=active]:bg-brand-burgundy data-[state=active]:text-white flex items-center gap-1"
      >
        <Note className="h-4 w-4" />
        <span>Notes</span>
      </TabsTrigger>
      <TabsTrigger
        value="faq"
        className="data-[state=active]:bg-brand-burgundy data-[state=active]:text-white flex items-center gap-1"
      >
        <HelpCircle className="h-4 w-4" />
        <span>FAQ</span>
      </TabsTrigger>
    </TabsList>
  );
};

export default ClientDetailTabsList;
