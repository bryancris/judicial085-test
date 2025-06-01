
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface KnowledgeTabContentProps {
  clientId: string;
}

const KnowledgeTabContent: React.FC<KnowledgeTabContentProps> = ({ clientId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create Document
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Document creation functionality coming soon.</p>
          <p className="text-sm">This will handle creating new legal documents.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default KnowledgeTabContent;
