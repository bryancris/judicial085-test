import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";

interface CaseFormFieldsProps {
  control: Control<any>;
}

const CASE_TYPES = [
  "Personal Injury",
  "Criminal Defense",
  "Family Law",
  "Business Law",
  "Real Estate",
  "Employment Law",
  "Immigration",
  "Bankruptcy",
  "Estate Planning",
  "Other"
];

const CASE_STATUSES = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "closed", label: "Closed" },
  { value: "on_hold", label: "On Hold" }
];

const CaseFormFields = ({ control }: CaseFormFieldsProps) => {
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="case_title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Case Title</FormLabel>
            <FormControl>
              <Input placeholder="Enter case title" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="case_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Case Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CASE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="case_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Case Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter case number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select case status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CASE_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="case_description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Case Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter case description..." 
                className="min-h-[100px]" 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="case_notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Case Notes</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter any additional notes..." 
                className="min-h-[80px]" 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default CaseFormFields;