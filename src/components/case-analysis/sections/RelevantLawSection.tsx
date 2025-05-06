
import React from "react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

interface RelevantLawSectionProps {
  content: string;
  isOpen: boolean;
  isProcessing: boolean;
  onToggle: () => void;
  processedContent: string;
}

const RelevantLawSection: React.FC<RelevantLawSectionProps> = ({
  content,
  isOpen,
  isProcessing,
  onToggle,
  processedContent
}) => {
  // Convert markdown content to React elements with links
  const formatMarkdown = () => {
    const paragraphs = processedContent.split('\n\n');
    
    return paragraphs.map((paragraph, idx) => (
      <p 
        key={idx} 
        className="mb-3" 
        dangerouslySetInnerHTML={{ __html: paragraph }} 
      />
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
          <span className="flex items-center">
            Relevant Texas Law
            {isProcessing && (
              <span className="ml-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            )}
          </span>
          {isOpen ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        {formatMarkdown()}
        <div className="mt-2 text-xs text-muted-foreground">
          <p>Click on law references to open the full text document in a new tab.</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default RelevantLawSection;
