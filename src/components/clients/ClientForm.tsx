
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { clientSchema, ClientFormValues, defaultValues } from "./ClientFormSchema";
import PersonalInfoFields from "./PersonalInfoFields";
import AddressFields from "./AddressFields";
import CaseInfoFields from "./CaseInfoFields";
import { useClientCases } from "@/hooks/useClientCases";

const ClientForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
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
        case_number: null,
        case_description: null,
        case_types: [], // Empty array since we removed case types
        referred_by: data.referred_by || null,
        case_notes: data.notes || null
      };
      
      // Insert the client and get the returned client data with the generated ID
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create a default case if client was successfully created
      if (newClient) {
        // Create a simple case with the client's name
        const caseData = {
          client_id: newClient.id,
          case_title: `${data.first_name} ${data.last_name} - General`,
          case_number: null,
          case_type: "general",
          case_description: null,
          case_notes: data.notes || null,
          status: "active"
        };
        
        // Create the case
        await createCase(caseData);
        
        // Navigate to the newly created client's page
        navigate(`/clients/${newClient.id}`);
      }
      
      toast({
        title: "Client added successfully",
        description: `${data.first_name} ${data.last_name} has been added to your client list.`,
      });
      
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
          <h3 className="text-lg font-medium">Notes</h3>
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
