
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Check, AlertCircle } from "lucide-react";
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
  const [isDuplicate, setIsDuplicate] = useState(false);
  const { toast } = useToast();

  // Enhanced hash generation for content comparison
  const generateContentHash = (content: string): string => {
    const cleanContent = content.trim().toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s§]/g, ''); // Remove punctuation but keep section symbols
    let hash = 0;
    for (let i = 0; i < cleanContent.length; i++) {
      const char = cleanContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  };

  // Enhanced detection of legal findings with more specific patterns
  const hasLegalFindings = (content: string): boolean => {
    const legalPatterns = [
      /§\s*\d+\.\d+/i, // Section references like § 17.46
      /section\s+\d+\.\d+/i, // "Section 17.46"
      /dtpa\s+§/i, // DTPA section references
      /texas\s+business\s+&\s+commerce\s+code/i, // Texas Business & Commerce Code
      /texas\s+deceptive\s+trade\s+practices/i, // Texas Deceptive Trade Practices
      /violation.*of.*§/i, // Violation of section
      /under\s+§/i, // Under section
      /pursuant\s+to\s+§/i, // Pursuant to section
      /code\s+§\s*\d+/i, // Code section references
      /treble\s+damages/i, // Treble damages
      /economic\s+damages/i, // Economic damages
      /mental\s+anguish/i, // Mental anguish
      /attorney\s+fees/i, // Attorney fees
      /pre-suit\s+notice/i, // Pre-suit notice
      /knowing\s+violations/i, // Knowing violations
    ];
    
    return legalPatterns.some(pattern => pattern.test(content));
  };

  // Enhanced duplicate checking with better integration detection
  const checkForDuplicates = async (content: string): Promise<boolean> => {
    try {
      const { data: existingAnalysis, error } = await supabase
        .from("legal_analyses")
        .select("content")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error checking for duplicates:", error);
        return false;
      }

      if (!existingAnalysis || existingAnalysis.length === 0) {
        return false;
      }

      const contentHash = generateContentHash(content);
      
      // Extract key legal concepts from the content
      const keyStatutes = extractKeyStatutes(content);
      const keyPhrases = extractKeyPhrases(content);
      
      // Check if the content or its key legal concepts are already in the analysis
      for (const analysis of existingAnalysis) {
        const existingHash = generateContentHash(analysis.content);
        
        // Check for exact hash match
        if (existingHash === contentHash) {
          return true;
        }
        
        // Check if key statutes are already well-represented in the analysis
        if (keyStatutes.length > 0) {
          const statuteMatches = keyStatutes.filter(statute => 
            analysis.content.toLowerCase().includes(statute.toLowerCase())
          );
          
          // If most key statutes are present and detailed, consider it integrated
          if (statuteMatches.length >= keyStatutes.length * 0.7) {
            // Check if there's substantial detail about these statutes
            const hasSubstantialDetail = keyPhrases.some(phrase => 
              analysis.content.toLowerCase().includes(phrase.toLowerCase())
            );
            
            if (hasSubstantialDetail) {
              return true;
            }
          }
        }
        
        // Check for research updates integration (look for similar content patterns)
        const contentWords = content.toLowerCase().split(/\s+/).filter(word => word.length > 3);
        const analysisWords = analysis.content.toLowerCase().split(/\s+/);
        const matchingWords = contentWords.filter(word => analysisWords.includes(word));
        
        // If substantial content overlap (>60%) and key legal terms present, consider integrated
        if (matchingWords.length >= contentWords.length * 0.6 && keyStatutes.length > 0) {
          return true;
        }
        
        // Check if the exact content is already included
        if (analysis.content.includes(content.trim()) || 
            content.trim().includes(analysis.content.trim())) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error in duplicate check:", error);
      return false;
    }
  };

  // Helper function to extract key statutes from content
  const extractKeyStatutes = (content: string): string[] => {
    const statutes: string[] = [];
    const patterns = [
      /§\s*\d+\.\d+/gi,
      /section\s+\d+\.\d+/gi,
      /dtpa/gi,
      /texas\s+business\s+&\s+commerce\s+code/gi,
      /texas\s+deceptive\s+trade\s+practices/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        statutes.push(...matches);
      }
    });
    
    return [...new Set(statutes)];
  };

  // Helper function to extract key phrases from content
  const extractKeyPhrases = (content: string): string[] => {
    const phrases: string[] = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('treble damages')) phrases.push('treble damages');
    if (lowerContent.includes('economic damages')) phrases.push('economic damages');
    if (lowerContent.includes('mental anguish')) phrases.push('mental anguish');
    if (lowerContent.includes('attorney fees')) phrases.push('attorney fees');
    if (lowerContent.includes('pre-suit notice')) phrases.push('pre-suit notice');
    if (lowerContent.includes('knowing violations')) phrases.push('knowing violations');
    if (lowerContent.includes('consumer protection')) phrases.push('consumer protection');
    if (lowerContent.includes('deceptive practices')) phrases.push('deceptive practices');
    
    return phrases;
  };

  // Check for duplicates when component mounts and when clientId changes
  useEffect(() => {
    if (hasLegalFindings(messageContent)) {
      checkForDuplicates(messageContent).then(isDupe => {
        setIsDuplicate(isDupe);
        setIsAdded(isDupe); // If it's a duplicate, mark as added
      });
    }
  }, [messageContent, clientId]);

  const handleAddToAnalysis = async () => {
    if (!hasLegalFindings(messageContent)) {
      toast({
        title: "No Legal Findings Detected",
        description: "This message doesn't contain transferable legal findings.",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicates before adding
    const isDuplicateContent = await checkForDuplicates(messageContent);
    if (isDuplicateContent) {
      setIsDuplicate(true);
      setIsAdded(true);
      toast({
        title: "Content Already Integrated",
        description: "This research has already been integrated into the case analysis.",
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
      const researchUpdate = `**RESEARCH UPDATE (${timestamp}):**\n\n${messageContent}`;

      if (existingAnalysis && existingAnalysis.length > 0) {
        // Update existing analysis with improved formatting
        const existingContent = existingAnalysis[0].content;
        let updatedContent;
        
        // Check if there are already research updates and append appropriately
        if (existingContent.includes('**RESEARCH UPDATE')) {
          updatedContent = existingContent + '\n\n' + researchUpdate;
        } else {
          updatedContent = existingContent + '\n\n' + researchUpdate;
        }
        
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
      setIsDuplicate(false); // Reset duplicate status since we successfully added
      
      toast({
        title: "Research Added to Case Analysis",
        description: "The legal findings have been successfully added to the case analysis and will be preserved during regeneration.",
      });

      if (onFindingsAdded) {
        onFindingsAdded();
      }

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

  // Show different states based on current status
  if (isDuplicate || isAdded) {
    return (
      <Button
        disabled
        size="sm"
        variant="secondary"
        className="text-xs bg-green-50 hover:bg-green-50 text-green-700 border border-green-200 cursor-not-allowed"
      >
        <Check className="h-3 w-3 mr-1" />
        Integrated in Analysis
      </Button>
    );
  }

  return (
    <Button
      onClick={handleAddToAnalysis}
      disabled={isAdding}
      size="sm"
      variant="secondary"
      className="text-xs bg-white/80 hover:bg-white/90 text-blue-900 border border-blue-200"
    >
      {isAdding ? (
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Adding...
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <PlusCircle className="h-3 w-3" />
          Add to Case Analysis
        </span>
      )}
    </Button>
  );
};

export default ResearchFindingsButton;
