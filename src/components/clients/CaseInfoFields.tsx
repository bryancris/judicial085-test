
import React, { useEffect, useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Control, useWatch } from "react-hook-form";
import CaseTypesSelector from "./CaseTypesSelector";

interface CaseInfoFieldsProps {
  control: Control<any>;
}

const CaseInfoFields = ({ control }: CaseInfoFieldsProps) => {
  const [isContractReview, setIsContractReview] = useState(false);
  
  // Watch for changes to case_types field
  const caseTypes = useWatch({
    control,
    name: "case_types",
    defaultValue: []
  });

  // Check if "contract_review" is selected
  useEffect(() => {
    setIsContractReview(caseTypes.includes("contract_review"));
  }, [caseTypes]);

  return (
    <>
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
            <FormLabel>{isContractReview ? "Contract Notes" : "Case Notes"}</FormLabel>
            <FormControl>
              <Textarea 
                placeholder={isContractReview
                  ? "Enter any additional notes about the contract here..." 
                  : "Enter any additional notes about the case here..."} 
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
