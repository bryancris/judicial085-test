import React from "react";
import { Badge } from "@/components/ui/badge";
import { Zap, Database, Clock, AlertCircle } from "lucide-react";

interface SearchResultBadgesProps {
  cacheUsed?: boolean;
  freshApiCall?: boolean;
  searchStrategy?: string;
  responseTime?: number;
  totalResults?: number;
}

const SearchResultBadges: React.FC<SearchResultBadgesProps> = ({
  cacheUsed = false,
  freshApiCall = false,
  searchStrategy,
  responseTime,
  totalResults
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Cache status badge */}
      {cacheUsed && (
        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          <Zap className="h-3 w-3" />
          Cache Hit
        </Badge>
      )}
      
      {freshApiCall && (
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <Database className="h-3 w-3" />
          Fresh API Call
        </Badge>
      )}

      {/* Search strategy */}
      {searchStrategy && (
        <Badge variant="secondary" className="text-xs">
          {searchStrategy === "intelligent" ? "AI-Enhanced Search" : 
           searchStrategy === "fallback" ? "Fallback Search" :
           searchStrategy === "cache-first" ? "Cache-First Search" :
           searchStrategy}
        </Badge>
      )}

      {/* Response time */}
      {responseTime && (
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          {responseTime < 1000 ? `${responseTime}ms` : `${(responseTime / 1000).toFixed(1)}s`}
        </Badge>
      )}

      {/* Results count */}
      {totalResults !== undefined && (
        <Badge variant="default" className="text-xs">
          {totalResults} results
        </Badge>
      )}
    </div>
  );
};

export default SearchResultBadges;