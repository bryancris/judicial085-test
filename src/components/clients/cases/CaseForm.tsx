
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Case } from "@/types/case";
import { caseTypes } from "@/components/clients/CaseTypesSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const caseFormSchema = z.object({
  case_title: z.string().min(1, { message: "Title is required" }),
  case_number: z.string().optional().nullable(),
  case_type: z.string().optional().nullable(),
  case_description: z.string().optional().nullable(),
  case_notes: z.string().optional().nullable(),
});

type CaseFormValues = z.infer<typeof caseFormSchema>;

interface CaseFormProps {
  onSubmit: (data: CaseFormValues) => void;
  onCancel: () => void;
  initialData?: Partial<Case>;
  isLoading?: boolean;
}

const CaseForm = ({ 
  onSubmit, 
  onCancel, 
  initialData,
  isLoading = false 
}: CaseFormProps) => {
  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      case_title: initialData?.case_title || "",
      case_number: initialData?.case_number || "",
      case_type: initialData?.case_type || "",
      case_description: initialData?.case_description || "",
      case_notes: initialData?.case_notes || "",
    },
  });

  // Get current case type to dynamically change field labels
  const caseType = form.watch("case_type");
  const isContractReview = caseType === "contract_review";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="case_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Case Title*</FormLabel>
              <FormControl>
                <Input placeholder="Enter case title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="case_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Case Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || ""} 
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {caseTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="case_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isContractReview ? "Contract Name" : "Case Number"}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={isContractReview ? "Enter contract name" : "Enter case number"} 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="case_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isContractReview ? "Contract Description" : "Case Description"}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={isContractReview ? "Describe the contract" : "Describe the case"} 
                  className="min-h-[100px]" 
                  {...field} 
                  value={field.value || ""} 
                />
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
                  placeholder="Additional notes about the case" 
                  className="min-h-[100px]" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Case"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CaseForm;
