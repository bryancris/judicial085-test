
import React from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchSimilarCasesButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

const SearchSimilarCasesButton: React.FC<SearchSimilarCasesButtonProps> = ({
  onClick,
  isLoading
}) => {
  return (
    <div className="flex justify-center my-6">
      <Button 
        onClick={onClick} 
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            Searching...
          </>
        ) : (
          <>
            <Search className="h-4 w-4 mr-2" />
            Search for Similar Cases
          </>
        )}
      </Button>
    </div>
  );
};

export default SearchSimilarCasesButton;
