
import React from "react";
import { View } from "lucide-react";
import { Client } from "@/types/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface ClientTableProps {
  clients: Client[];
  handleViewClient: (id: string, name: string) => void;
}

const ClientTable = ({ clients, handleViewClient }: ClientTableProps) => {
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="hidden sm:table-cell">Location</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">
                {client.first_name} {client.last_name}
              </TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell className="hidden sm:table-cell">
                {[client.city, client.state].filter(Boolean).join(", ") || "-"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                    onClick={() => 
                      handleViewClient(
                        client.id, 
                        `${client.first_name} ${client.last_name}`
                      )
                    }
                  >
                    <View className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientTable;
