import React from "react";
import { Button } from "@/components/ui/button";
import { Search, FileSearch, Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchSimilarCasesButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  lastUpdated?: string;
  existingCasesCount?: number;
}

const SearchSimilarCasesButton: React.FC<SearchSimilarCasesButtonProps> = ({
  onClick,
  isLoading = false,
  lastUpdated,
  existingCasesCount = 0
}) => {
  const hasRecentCases = existingCasesCount > 0 && lastUpdated;

  return (
    <div className="space-y-2">
      <Button
        onClick={onClick}
        disabled={isLoading}
        className="mb-2 w-full"
        size="lg"
        variant={hasRecentCases ? "outline" : "default"}
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            Searching Similar Cases...
          </>
        ) : hasRecentCases ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Search Similar Cases (Fresh)
          </>
        ) : (
          <>
            <FileSearch className="h-4 w-4 mr-2" />
            Search Similar Cases
          </>
        )}
      </Button>
      
      {hasRecentCases && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {existingCasesCount} cases found {lastUpdated}
          </span>
          <Badge variant="secondary" className="text-xs">
            Cached
          </Badge>
        </div>
      )}
    </div>
  );
};

export default SearchSimilarCasesButton;