
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

const EmptyCasesList = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center text-muted-foreground">
          <FileText className="mx-auto h-12 w-12 opacity-50 mb-2" />
          <p>No cases found for this client.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyCasesList;
