
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const CaseAnalysisLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Case Analysis</h2>
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-[150px] w-full mb-6" />
      <Skeleton className="h-[300px] w-full mb-6" />
      <Skeleton className="h-[200px] w-full mb-6" />
      <Skeleton className="h-[250px] w-full" />
    </div>
  );
};

export default CaseAnalysisLoadingSkeleton;
