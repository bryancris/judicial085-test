
import React from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Client } from "@/types/client";
import PersonalInfoSection from "./PersonalInfoSection";
import AddressSection from "./AddressSection";
import CaseInformationSection from "./CaseInformationSection";

interface ClientInformationAccordionProps {
  client: Client;
  onEditClick: () => void;
}

const ClientInformationAccordion = ({ client, onEditClick }: ClientInformationAccordionProps) => {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="client-info">
        <div className="flex justify-between items-center">
          <AccordionTrigger className="bg-background hover:bg-muted px-4 py-3 rounded-md border text-lg font-medium flex-grow">
            Client Information
          </AccordionTrigger>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2 flex items-center gap-1"
            onClick={onEditClick}
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
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
  );
};

export default ClientInformationAccordion;
