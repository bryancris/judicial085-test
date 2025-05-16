
import React from "react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon, AlertCircle } from "lucide-react";

interface RelevantLawSectionProps {
  content: string;
  isOpen: boolean;
  isProcessing: boolean;
  onToggle: () => void;
  processedContent: string;
  isConsumerCase?: boolean;
}

const RelevantLawSection: React.FC<RelevantLawSectionProps> = ({
  content,
  isOpen,
  isProcessing,
  onToggle,
  processedContent,
  isConsumerCase = false
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
            {isConsumerCase && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 rounded-full">
                DTPA
              </span>
            )}
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
        
        {isConsumerCase && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Key Consumer Protection Laws:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Texas Deceptive Trade Practices Act (DTPA) - Tex. Bus. & Com. Code § 17.41-17.63</li>
                <li>Texas Home Solicitation Act - Tex. Bus. & Com. Code § 601.001 et seq.</li>
                <li>Texas Debt Collection Act - Tex. Finance Code § 392.001 et seq.</li>
              </ul>
            </div>
          </div>
        )}
        
        <div className="mt-2 text-xs text-muted-foreground">
          <p>Click on law references to open the full text document in a new tab.</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default RelevantLawSection;
