
import React from "react";
import { User } from "lucide-react";

interface EmptyClientListProps {
  isFiltered?: boolean;
}

const EmptyClientList = ({ isFiltered = false }: EmptyClientListProps) => {
  if (isFiltered) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-gray-500">No clients match your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="text-center py-10">
      <User className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">No clients</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by adding a new client using the "Add Client" tab.
      </p>
    </div>
  );
};

export default EmptyClientList;
