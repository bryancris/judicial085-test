
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ClientSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const ClientSearch = ({ searchTerm, setSearchTerm }: ClientSearchProps) => {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
      <Input
        type="text"
        placeholder="Search clients..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-9"
      />
    </div>
  );
};

export default ClientSearch;
