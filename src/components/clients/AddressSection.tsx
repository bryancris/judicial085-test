
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Client } from "@/types/client";

interface AddressSectionProps {
  client: Client;
}

const AddressSection = ({ client }: AddressSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                <div className="mt-1 p-2 border rounded-md">{client.address || "Not provided"}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">City</Label>
                <div className="mt-1 p-2 border rounded-md">{client.city || "Not provided"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">State</Label>
                <div className="mt-1 p-2 border rounded-md">{client.state || "Not provided"}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">ZIP Code</Label>
                <div className="mt-1 p-2 border rounded-md">{client.zip_code || "Not provided"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddressSection;
