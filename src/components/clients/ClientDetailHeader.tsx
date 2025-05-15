
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Client } from "@/types/client";

interface ClientDetailHeaderProps {
  client: Client;
  onDeleteClick: () => void;
  isDeleting: boolean;
}

const ClientDetailHeader = ({ client, onDeleteClick, isDeleting }: ClientDetailHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">
        {client.first_name} {client.last_name}
      </h1>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={onDeleteClick}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-red-500" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 text-red-500" />
              Delete Client
            </>
          )}
        </Button>
        <Link to="/clients">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ClientDetailHeader;
