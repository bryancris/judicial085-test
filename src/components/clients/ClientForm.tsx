
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { clientSchema, ClientFormValues, defaultValues } from "./ClientFormSchema";
import PersonalInfoFields from "./PersonalInfoFields";
import AddressFields from "./AddressFields";
import CaseInfoFields from "./CaseInfoFields";
import { useClientCases } from "@/hooks/useClientCases";

const ClientForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { createCase } = useClientCases();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues
  });

  async function onSubmit(data: ClientFormValues) {
    setIsSubmitting(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      if (!user) {
        throw new Error("You must be logged in to add a client");
      }
      
      // Ensure all required fields are present with their proper types
      const clientData = {
        user_id: user.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zip_code: data.zip_code || null,
        case_number: null, // Set to null since we removed the field
        case_description: null, // Set to null since we removed the field
        case_types: data.case_types,
        referred_by: data.referred_by || null,
        case_notes: data.case_notes || null
      };
      
      // Insert the client and get the returned client data with the generated ID
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create a case if client was successfully created
      if (newClient && data.case_types.length > 0) {
        // Determine the case type from the first selected type
        const caseType = data.case_types[0];
        
        // Create the case data
        const caseData = {
          client_id: newClient.id,
          case_title: `${data.first_name} ${data.last_name} - ${getCaseTypeLabel(caseType)}`,
          case_number: null, // Set to null since we removed the field
          case_type: caseType,
          case_description: null, // Set to null since we removed the field
          case_notes: data.case_notes || null,
          status: "active"
        };
        
        // Create the case
        await createCase(caseData);
      }
      
      toast({
        title: "Client added successfully",
        description: `${data.first_name} ${data.last_name} has been added to your client list.`,
      });
      
      form.reset();
    } catch (error: any) {
      console.error("Error adding client:", error);
      toast({
        title: "Error adding client",
        description: error.message || "There was a problem adding the client.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helper function to get a readable label for the case type
  function getCaseTypeLabel(caseTypeId: string): string {
    const caseTypeMap: Record<string, string> = {
      "family": "Family Law",
      "criminal": "Criminal Defense",
      "immigration": "Immigration",
      "personal_injury": "Personal Injury",
      "estate": "Estate Planning",
      "business": "Business Law",
      "real_estate": "Real Estate",
      "intellectual_property": "Intellectual Property",
      "employment": "Employment",
      "contract_review": "Contract Review"
    };
    
    return caseTypeMap[caseTypeId] || "Case";
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Client Information</h3>
          <PersonalInfoFields control={form.control} />
        </div>
        
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Address</h3>
          <AddressFields control={form.control} />
        </div>
        
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Case Types & Notes</h3>
          <CaseInfoFields control={form.control} />
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              "Add Client"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;
