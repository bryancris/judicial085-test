
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface CasesListErrorProps {
  error: string;
}

const CasesListError = ({ error }: CasesListErrorProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center text-red-500">
          <p>Error loading cases: {error}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CasesListError;
