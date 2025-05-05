
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ClientListSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
};

export default ClientListSkeleton;
