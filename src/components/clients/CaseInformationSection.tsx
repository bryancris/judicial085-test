
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Client } from "@/types/client";

interface CaseInformationSectionProps {
  client: Client;
}

const CaseInformationSection = ({ client }: CaseInformationSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Referred By</Label>
                <div className="mt-1 p-2 border rounded-md">{client.referred_by || "Not provided"}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Case Notes</Label>
                <div className="mt-1 p-2 border rounded-md min-h-[100px] whitespace-pre-wrap">
                  {client.case_notes || "No notes provided"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CaseInformationSection;
