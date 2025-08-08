
import React, { useMemo, useState } from "react";
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
import { useFirmCaseTypes } from "@/hooks/useFirmCaseTypes";
import AddCaseTypeDialog from "./AddCaseTypeDialog";

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
  clientId?: string; // Add clientId prop
}

const CaseForm = ({ 
  onSubmit, 
  onCancel, 
  initialData,
  isLoading = false,
  clientId  // Accept clientId prop
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

  const { types: firmTypes } = useFirmCaseTypes();
  const [addOpen, setAddOpen] = useState(false);

  const allOptions = useMemo(() => {
    const builtins = caseTypes.map(t => ({ value: t.id, label: t.label }));
    const existing = new Set(builtins.map(b => b.value.toLowerCase()));
    const customs = (firmTypes || [])
      .filter(t => t.is_active)
      .map(t => ({ value: t.value, label: t.name }))
      .filter(t => !existing.has(t.value.toLowerCase()));
    return [...builtins, ...customs];
  }, [firmTypes]);

  // Get current case type to dynamically change field labels
  const caseType = form.watch("case_type");
  const isContractReview = caseType === "contract_review";

  const handleFormSubmit = (data: CaseFormValues) => {
    // The clientId is now passed from the parent component
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
                onValueChange={(val) => {
                  if (val === "__add__") { setAddOpen(true); return; }
                  field.onChange(val);
                }} 
                defaultValue={field.value || ""} 
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="__add__">+ Create new case type</SelectItem>
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
      <AddCaseTypeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(value) => {
          form.setValue("case_type", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
        }}
      />
    </Form>
  );
};

export default CaseForm;
