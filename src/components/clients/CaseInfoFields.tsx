
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import CaseTypesSelector from "./CaseTypesSelector";

interface CaseInfoFieldsProps {
  control: Control<any>;
}

const CaseInfoFields = ({ control }: CaseInfoFieldsProps) => {
  return (
    <>
      <FormField
        control={control}
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
      
      <CaseTypesSelector control={control} />
      
      <FormField
        control={control}
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
        control={control}
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
    </>
  );
};

export default CaseInfoFields;
