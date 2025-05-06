
import React from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";

interface AnalysisSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const AnalysisSearch: React.FC<AnalysisSearchProps> = ({ 
  searchTerm, 
  onSearchChange 
}) => {
  return (
    <div className="relative w-64">
      <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search analysis..."
        className="pl-8"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
};

export default AnalysisSearch;
