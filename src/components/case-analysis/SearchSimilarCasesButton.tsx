
import React from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
        <Badge variant="outline" className="text-[10px] font-normal">Powered by CourtListener</Badge>
        <span>Searches U.S. court records & your firm's database</span>
      </div>
    </div>
  );
};

export default SearchSimilarCasesButton;
