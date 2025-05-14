
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BookOpen, FileSearch, Video, FileChartLine, MessageSquare, FileCheck } from "lucide-react";
import { tabColors, tabHoverColors } from "./tabStyles";

const ClientDetailTabsList = () => {
  const tabs = [
    { value: "client-intake", icon: <FileText className="h-4 w-4" /> },
    { value: "contract-review", icon: <FileCheck className="h-4 w-4" /> },
    { value: "fact-pattern", icon: <BookOpen className="h-4 w-4" /> },
    { value: "discovery", icon: <FileSearch className="h-4 w-4" /> },
    { value: "deposition", icon: <Video className="h-4 w-4" /> },
    { value: "case-analysis", icon: <FileChartLine className="h-4 w-4" /> },
    { value: "discuss-case", icon: <MessageSquare className="h-4 w-4" /> },
  ];

  return (
    <TabsList className="w-full grid grid-cols-7 mb-6">
      {tabs.map(({ value, icon }) => (
        <TabsTrigger 
          key={value}
          value={value} 
          className={`flex items-center gap-2 ${tabColors[value as keyof typeof tabColors]} ${tabHoverColors[value as keyof typeof tabHoverColors]} data-[state=inactive]:opacity-70`}
        >
          {icon}
          {value.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
        </TabsTrigger>
      ))}
    </TabsList>
  );
};

export default ClientDetailTabsList;
