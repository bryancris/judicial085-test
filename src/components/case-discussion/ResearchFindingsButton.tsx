
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ResearchFindingsButtonProps {
  messageContent: string;
  clientId: string;
  onFindingsAdded?: () => void;
}

const ResearchFindingsButton: React.FC<ResearchFindingsButtonProps> = ({
  messageContent,
  clientId,
  onFindingsAdded
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { toast } = useToast();

  // Detect if message contains transferable legal findings
  const hasLegalFindings = (content: string): boolean => {
    const legalPatterns = [
      /§\s*\d+\.\d+/i, // Section references like § 17.46
      /section\s+\d+\.\d+/i, // "Section 17.46"
      /dtpa\s+§/i, // DTPA section references
      /texas\s+business\s+&\s+commerce\s+code/i, // Texas Business & Commerce Code
      /violation.*of.*§/i, // Violation of section
      /under\s+§/i, // Under section
      /pursuant\s+to\s+§/i, // Pursuant to section
      /code\s+§\s*\d+/i, // Code section references
    ];
    
    return legalPatterns.some(pattern => pattern.test(content));
  };

  const handleAddToAnalysis = async () => {
    if (!hasLegalFindings(messageContent)) {
      toast({
        title: "No Legal Findings Detected",
        description: "This message doesn't contain transferable legal findings.",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Get existing legal analysis
      const { data: existingAnalysis, error: fetchError } = await supabase
        .from("legal_analyses")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) {
        throw new Error(`Failed to fetch existing analysis: ${fetchError.message}`);
      }

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const researchUpdate = `\n\n**RESEARCH UPDATE (${timestamp}):**\n\n${messageContent}`;

      if (existingAnalysis && existingAnalysis.length > 0) {
        // Update existing analysis
        const updatedContent = existingAnalysis[0].content + researchUpdate;
        
        const { error: updateError } = await supabase
          .from("legal_analyses")
          .update({
            content: updatedContent,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingAnalysis[0].id);

        if (updateError) {
          throw new Error(`Failed to update analysis: ${updateError.message}`);
        }
      } else {
        // Create new analysis entry
        const { error: insertError } = await supabase
          .from("legal_analyses")
          .insert({
            client_id: clientId,
            user_id: userId,
            content: `**RESEARCH FINDINGS:**\n\n${messageContent}`,
            timestamp: timestamp
          });

        if (insertError) {
          throw new Error(`Failed to create analysis: ${insertError.message}`);
        }
      }

      setIsAdded(true);
      toast({
        title: "Research Added to Case Analysis",
        description: "The legal findings have been successfully added to the case analysis.",
      });

      if (onFindingsAdded) {
        onFindingsAdded();
      }

      // Reset the added state after 3 seconds
      setTimeout(() => setIsAdded(false), 3000);

    } catch (error: any) {
      console.error("Error adding research to analysis:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add research to case analysis.",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Only show button if message contains legal findings
  if (!hasLegalFindings(messageContent)) {
    return null;
  }

  return (
    <div className="mt-2 flex justify-end">
      <Button
        onClick={handleAddToAnalysis}
        disabled={isAdding || isAdded}
        size="sm"
        variant="outline"
        className="text-xs"
      >
        {isAdding ? (
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            Adding...
          </span>
        ) : isAdded ? (
          <span className="flex items-center gap-1 text-green-600">
            <Check className="h-3 w-3" />
            Added to Analysis
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <PlusCircle className="h-3 w-3" />
            Add to Case Analysis
          </span>
        )}
      </Button>
    </div>
  );
};

export default ResearchFindingsButton;
