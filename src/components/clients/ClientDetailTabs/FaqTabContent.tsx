
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import TabExplanationDialog from "./TabExplanationDialog";

const FaqTabContent = () => {
  const [showExplanationDialog, setShowExplanationDialog] = React.useState(false);
  
  // Automatically open the explanation dialog when the component mounts
  useEffect(() => {
    setShowExplanationDialog(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <HelpCircle className="h-12 w-12 text-blue-500" />
      <h2 className="text-2xl font-semibold text-center">Frequently Asked Questions</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Need help understanding the different tabs in the client detail view?
      </p>
      <Button 
        onClick={() => setShowExplanationDialog(true)}
        className="mt-4"
      >
        View Tabs Guide
      </Button>
      
      <TabExplanationDialog 
        isOpen={showExplanationDialog} 
        onClose={() => setShowExplanationDialog(false)} 
      />
    </div>
  );
};

export default FaqTabContent;
