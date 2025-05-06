
import React from "react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

interface AnalysisSectionProps {
  title: string;
  content: string;
  isOpen: boolean;
  searchTerm: string;
  onToggle: () => void;
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({
  title,
  content,
  isOpen,
  searchTerm,
  onToggle
}) => {
  // Highlight search terms
  const highlightSearch = (text: string) => {
    if (!searchTerm) return text;
    
    // Simple split/join approach for highlighting
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200">{part}</mark> 
        : part
    );
  };

  // Format markdown content
  const formatMarkdown = () => {
    const paragraphs = content.split('\n\n');
    
    return paragraphs.map((paragraph, idx) => (
      <p key={idx} className="mb-3">
        {highlightSearch(paragraph)}
      </p>
    ));
  };

  return (
    <Collapsible open={isOpen} className="border rounded-md">
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex w-full justify-between p-4 font-semibold" 
          onClick={onToggle}
        >
          <span>{title}</span>
          {isOpen ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        {formatMarkdown()}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AnalysisSection;
