
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Client } from "@/types/client";

interface PersonalInfoSectionProps {
  client: Client;
}

const PersonalInfoSection = ({ client }: PersonalInfoSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                <div className="mt-1 p-2 border rounded-md">{client.first_name}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                <div className="mt-1 p-2 border rounded-md">{client.last_name}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <div className="mt-1 p-2 border rounded-md">{client.email}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                <div className="mt-1 p-2 border rounded-md">{client.phone}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PersonalInfoSection;
