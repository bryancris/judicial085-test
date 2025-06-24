
import React from 'react';
import { Separator } from "@/components/ui/separator";

const DocumentSidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white border-r p-4 hidden lg:block print-hide">
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm mb-2">Document outline</h3>
          <p className="text-xs text-gray-500">No headings in document</p>
        </div>
        <Separator />
        <div>
          <h3 className="font-medium text-sm mb-2">Page navigation</h3>
          <p className="text-xs text-gray-500">Page 1 of 1</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentSidebar;
