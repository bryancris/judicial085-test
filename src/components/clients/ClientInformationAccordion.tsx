
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Client } from "@/types/client";
import PersonalInfoSection from "./PersonalInfoSection";
import AddressSection from "./AddressSection";
import CaseInformationSection from "./CaseInformationSection";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import EditClientForm from "./EditClientForm";

interface ClientInformationAccordionProps {
  client: Client;
  onEditClick: () => void;
  refreshClient: () => void;
}

const ClientInformationAccordion = ({ 
  client, 
  onEditClick, 
  refreshClient 
}: ClientInformationAccordionProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
    onEditClick();
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    refreshClient();
  };

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="client-info">
          <div className="flex justify-between items-center">
            <AccordionTrigger className="bg-background hover:bg-muted px-4 py-3 rounded-md border text-lg font-medium flex-grow">
              Client Information
            </AccordionTrigger>
            <div className="flex">
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2 flex items-center gap-1"
                onClick={handleEditClick}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
          <AccordionContent className="pt-6">
            <div className="space-y-8">
              <PersonalInfoSection client={client} />
              <AddressSection client={client} />
              <CaseInformationSection client={client} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Client Information</AlertDialogTitle>
            <AlertDialogDescription>
              Make changes to {client.first_name} {client.last_name}'s information below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <EditClientForm
            client={client}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ClientInformationAccordion;
