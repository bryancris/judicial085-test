
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Client } from "@/types/client";

interface CaseInformationSectionProps {
  client: Client;
}

const CASE_TYPES = [
  { id: "family", label: "Family Law" },
  { id: "criminal", label: "Criminal Defense" },
  { id: "immigration", label: "Immigration" },
  { id: "personal_injury", label: "Personal Injury" },
  { id: "estate", label: "Estate Planning" },
  { id: "business", label: "Business Law" },
  { id: "real_estate", label: "Real Estate" },
  { id: "intellectual_property", label: "Intellectual Property" },
  { id: "employment", label: "Employment" }
];

const CaseInformationSection = ({ client }: CaseInformationSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Case Information</h3>
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Case Number</Label>
                <div className="mt-1 p-2 border rounded-md">{client.case_number || "Not provided"}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Case Description</Label>
                <div className="mt-1 p-2 border rounded-md whitespace-pre-wrap min-h-[80px]">
                  {client.case_description || "Not provided"}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground block mb-3">Case Types</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {CASE_TYPES.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={type.id} 
                        checked={(client.case_types || []).includes(type.id)} 
                        disabled
                      />
                      <Label 
                        htmlFor={type.id} 
                        className="font-normal cursor-default"
                      >
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
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
