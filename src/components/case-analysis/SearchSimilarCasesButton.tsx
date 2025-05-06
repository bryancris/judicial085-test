
import React from "react";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SearchSimilarCasesButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

const SearchSimilarCasesButton: React.FC<SearchSimilarCasesButtonProps> = ({
  onClick,
  isLoading
}) => {
  return (
    <div className="flex flex-col items-center my-6">
      <Button 
        onClick={onClick} 
        disabled={isLoading}
        className="w-full sm:w-auto mb-2"
        size="lg"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            Searching Court Records...
          </>
        ) : (
          <>
            <Search className="h-4 w-4 mr-2" />
            Search for Similar Cases
          </>
        )}
      </Button>

      <div className="text-xs text-muted-foreground flex gap-2 items-center mt-1 flex-wrap justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-[10px] font-normal cursor-help">
              Powered by CourtListener
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Searches real legal cases from across the U.S. court system</p>
          </TooltipContent>
        </Tooltip>
        <span>Searches U.S. court records & your firm's database</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center text-amber-500 cursor-help">
              <AlertCircle className="h-3 w-3 mr-1" /> 
              Requires legal analysis
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs max-w-[200px]">Make sure a legal analysis is generated first to get the most relevant results. Uses AI to find semantically similar cases.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default SearchSimilarCasesButton;
