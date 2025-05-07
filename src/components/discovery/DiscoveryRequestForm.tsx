
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createDiscoveryRequest } from '@/utils/discoveryService';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }),
  requesting_party: z.string().optional(),
  date_received: z.date().optional(),
});

interface DiscoveryRequestFormProps {
  clientId: string;
  onRequestCreated: () => void;
}

const DiscoveryRequestForm: React.FC<DiscoveryRequestFormProps> = ({ 
  clientId,
  onRequestCreated 
}) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      requesting_party: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const requestData = {
        client_id: clientId,
        title: values.title,
        content: values.content,
        requesting_party: values.requesting_party || null,
        date_received: values.date_received ? values.date_received.toISOString() : null,
        status: 'pending' as const,
      };

      const { request, error } = await createDiscoveryRequest(requestData);
      
      if (error) {
        toast({
          title: "Error creating request",
          description: error,
          variant: "destructive",
        });
        return;
      }
      
      form.reset();
      onRequestCreated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create discovery request",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Request Title</FormLabel>
              <FormControl>
                <Input placeholder="E.g., First Set of Interrogatories" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="requesting_party"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requesting Party</FormLabel>
              <FormControl>
                <Input placeholder="E.g., Plaintiff John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="date_received"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date Received</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={`w-full pl-3 text-left font-normal ${
                        !field.value && "text-muted-foreground"
                      }`}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Request Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Paste the full text of the discovery request here..." 
                  className="min-h-[200px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full">Create Discovery Request</Button>
      </form>
    </Form>
  );
};

export default DiscoveryRequestForm;
