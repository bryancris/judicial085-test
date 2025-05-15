
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BookOpen, FileSearch, Video, FileChartLine, MessageSquare, FileCheck, HelpCircle } from "lucide-react";
import { tabColors, tabHoverColors } from "./tabStyles";
import TabExplanationDialog from "./TabExplanationDialog";

const ClientDetailTabsList = () => {
  const [showExplanationDialog, setShowExplanationDialog] = React.useState(false);
  
  const tabs = [
    // First row
    { value: "client-intake", icon: <FileText className="h-4 w-4" /> },
    { value: "case-analysis", icon: <FileChartLine className="h-4 w-4" /> },
    { value: "discuss-case", icon: <MessageSquare className="h-4 w-4" /> },
    { value: "contract-review", icon: <FileCheck className="h-4 w-4" /> },
    
    // Second row
    { value: "discovery", icon: <FileSearch className="h-4 w-4" /> },
    { value: "fact-pattern", icon: <BookOpen className="h-4 w-4" /> },
    { value: "deposition", icon: <Video className="h-4 w-4" /> },
  ];

  const handleFaqClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default tab switching
    setShowExplanationDialog(true);
  };

  return (
    <div className="mb-6">
      <TabsList className="w-full grid grid-cols-4 gap-2">
        {tabs.slice(0, 4).map(({ value, icon }) => (
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
      
      <div className="h-2"></div>
      
      <TabsList className="w-full grid grid-cols-4 gap-2">
        {tabs.slice(4, 7).map(({ value, icon }) => (
          <TabsTrigger 
            key={value}
            value={value} 
            className={`flex items-center gap-2 ${tabColors[value as keyof typeof tabColors]} ${tabHoverColors[value as keyof typeof tabHoverColors]} data-[state=inactive]:opacity-70`}
          >
            {icon}
            {value.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
          </TabsTrigger>
        ))}
        <button
          className={`flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${tabColors["faq"]} ${tabHoverColors["faq"]}`}
          onClick={handleFaqClick}
        >
          <HelpCircle className="h-4 w-4" />
          FAQ
        </button>
      </TabsList>

      <TabExplanationDialog 
        isOpen={showExplanationDialog} 
        onClose={() => setShowExplanationDialog(false)} 
      />
    </div>
  );
};

export default ClientDetailTabsList;
