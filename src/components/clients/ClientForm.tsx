
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

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

const clientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  case_number: z.string().optional(),
  case_types: z.array(z.string()).default([]),
  referred_by: z.string().optional(),
  case_notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

const ClientForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      case_number: "",
      case_types: [],
      referred_by: "",
      case_notes: "",
    },
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
        case_number: data.case_number || null,
        case_types: data.case_types,
        referred_by: data.referred_by || null,
        case_notes: data.case_notes || null
      };
      
      const { error } = await supabase.from('clients').insert(clientData);
      
      if (error) throw error;
      
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="johndoe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 555-5555" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="New York" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="NY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="zip_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="10001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Case Information</h3>
          
          <FormField
            control={form.control}
            name="case_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Case Number</FormLabel>
                <FormControl>
                  <Input placeholder="CAS-12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-3">
            <FormLabel>Case Types</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CASE_TYPES.map((type) => (
                <FormField
                  key={type.id}
                  control={form.control}
                  name="case_types"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={type.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(type.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, type.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== type.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {type.label}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </div>
          
          <FormField
            control={form.control}
            name="referred_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referred By</FormLabel>
                <FormControl>
                  <Input placeholder="Referral source" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="case_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Case Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter any additional notes about the case here..." 
                    className="min-h-[120px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
