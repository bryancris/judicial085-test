import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  ExternalLink,
  Sparkles,
  Clock,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ResearchActionsProps {
  messageContent: string;
  clientId: string;
  researchType?: 'similar-cases' | 'legal-research' | null;
  confidence?: number;
  onSaveToAnalysis?: () => void;
  onResearchFurther?: () => void;
}

const ResearchActions: React.FC<ResearchActionsProps> = ({
  messageContent,
  clientId,
  researchType,
  confidence,
  onSaveToAnalysis,
  onResearchFurther
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const { toast } = useToast();

  const handleSaveToAnalysis = async () => {
    setIsSaving(true);
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasSaved(true);
      onSaveToAnalysis?.();
      toast({
        title: "Research Saved",
        description: "Research findings have been added to the legal analysis.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save research to analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResearchFurther = async () => {
    setIsResearching(true);
    try {
      onResearchFurther?.();
      toast({
        title: "Additional Research",
        description: "Performing deeper research on this topic...",
      });
    } catch (error) {
      toast({
        title: "Research Failed",
        description: "Could not perform additional research. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResearching(false);
    }
  };

  const handleCopyResearch = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      toast({
        title: "Copied to Clipboard",
        description: "Research content has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getConfidenceBadge = () => {
    if (!confidence) return null;
    
    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
    let text = "Medium";
    let color = "text-yellow-600";
    
    if (confidence >= 0.8) {
      variant = "default";
      text = "High";
      color = "text-green-600";
    } else if (confidence < 0.6) {
      variant = "outline";
      text = "Low";
      color = "text-orange-600";
    }
    
    return (
      <Badge variant={variant} className={cn("text-xs", color)}>
        <Sparkles className="h-3 w-3 mr-1" />
        {text} Confidence
      </Badge>
    );
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Research Quality Indicator */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          {getConfidenceBadge()}
          {researchType && (
            <Badge variant="secondary" className="text-xs">
              {researchType === 'similar-cases' ? 'Case Research' : 'Legal Research'}
            </Badge>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs h-6 px-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Actions
            </>
          )}
        </Button>
      </div>

      {/* Expandable Actions */}
      {isExpanded && (
        <div className="flex flex-wrap gap-2 p-3 bg-secondary/20 rounded-lg border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveToAnalysis}
            disabled={isSaving || hasSaved}
            className="text-xs h-8"
          >
            {isSaving ? (
              <Clock className="h-3 w-3 mr-1 animate-spin" />
            ) : hasSaved ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <Save className="h-3 w-3 mr-1" />
            )}
            {hasSaved ? "Saved" : "Save to Analysis"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleResearchFurther}
            disabled={isResearching}
            className="text-xs h-8"
          >
            {isResearching ? (
              <Clock className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Search className="h-3 w-3 mr-1" />
            )}
            Research Further
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyResearch}
            className="text-xs h-8"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/knowledge', '_blank')}
            className="text-xs h-8"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Knowledge Base
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResearchActions;