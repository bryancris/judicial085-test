
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";

interface ContractsTabContentProps {
  clientId: string;
}

const ContractsTabContent: React.FC<ContractsTabContentProps> = ({ clientId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Contract Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Contract management functionality coming soon.</p>
          <p className="text-sm">This will handle contract reviews and management.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractsTabContent;
