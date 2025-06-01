
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface DocumentsTabContentProps {
  clientId: string;
}

const DocumentsTabContent: React.FC<DocumentsTabContentProps> = ({ clientId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Document Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Document upload functionality coming soon.</p>
          <p className="text-sm">This will handle client document uploads and management.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentsTabContent;
