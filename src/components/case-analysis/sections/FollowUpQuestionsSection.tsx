
import React from "react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

interface FollowUpQuestionsSectionProps {
  questions: string[];
  isOpen: boolean;
  searchTerm: string;
  onToggle: () => void;
}

const FollowUpQuestionsSection: React.FC<FollowUpQuestionsSectionProps> = ({
  questions,
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

  return (
    <Collapsible open={isOpen} className="border rounded-md">
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex w-full justify-between p-3 font-semibold" 
          onClick={onToggle}
        >
          <span>Recommended Follow-up Questions</span>
          {isOpen ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-2 pb-2">
        <ol className="list-decimal pl-5 space-y-0">
          {questions.map((question, index) => (
            <li key={index}>{highlightSearch(question)}</li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default FollowUpQuestionsSection;
