
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface DiscoveryTabContentProps {
  clientId: string;
}

const DiscoveryTabContent: React.FC<DiscoveryTabContentProps> = ({ clientId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Discovery Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Discovery management functionality coming soon.</p>
          <p className="text-sm">This will handle discovery requests and responses.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscoveryTabContent;
