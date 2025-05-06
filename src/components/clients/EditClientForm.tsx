
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { clientSchema, ClientFormValues } from "./ClientFormSchema";
import PersonalInfoFields from "./PersonalInfoFields";
import AddressFields from "./AddressFields";
import CaseInfoFields from "./CaseInfoFields";
import { Client } from "@/types/client";

interface EditClientFormProps {
  client: Client;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditClientForm = ({ client, onSuccess, onCancel }: EditClientFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with client data
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone,
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      zip_code: client.zip_code || "",
      case_number: client.case_number || "",
      case_types: client.case_types || [],
      referred_by: client.referred_by || "",
      case_notes: client.case_notes || "",
    }
  });

  async function onSubmit(data: ClientFormValues) {
    setIsSubmitting(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      if (!user) {
        throw new Error("You must be logged in to update a client");
      }
      
      // Update client data
      const { error } = await supabase
        .from('clients')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip_code: data.zip_code || null,
          case_number: data.case_number || null,
          case_types: data.case_types,
          referred_by: data.referred_by || null,
          case_notes: data.case_notes || null
        })
        .eq('id', client.id);
      
      if (error) throw error;
      
      toast({
        title: "Client updated successfully",
        description: `${data.first_name} ${data.last_name}'s information has been updated.`,
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast({
        title: "Error updating client",
        description: error.message || "There was a problem updating the client.",
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
          <h3 className="text-lg font-medium">Case Information</h3>
          <CaseInfoFields control={form.control} />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditClientForm;
