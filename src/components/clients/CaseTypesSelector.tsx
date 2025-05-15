import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Control } from "react-hook-form";

export const caseTypes = [
  { id: "family", label: "Family Law" },
  { id: "criminal", label: "Criminal Defense" },
  { id: "immigration", label: "Immigration" },
  { id: "personal_injury", label: "Personal Injury" },
  { id: "estate", label: "Estate Planning" },
  { id: "business", label: "Business Law" },
  { id: "real_estate", label: "Real Estate" },
  { id: "intellectual_property", label: "Intellectual Property" },
  { id: "employment", label: "Employment" },
  { id: "contract_review", label: "Contract Review" }
];

interface CaseTypesSelectorProps {
  control: Control<any>;
}

const CaseTypesSelector = ({ control }: CaseTypesSelectorProps) => {
  return (
    <div className="space-y-3">
      <FormLabel>Case Types</FormLabel>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {caseTypes.map((type) => (
          <FormField
            key={type.id}
            control={control}
            name="case_types"
            render={({ field }) => {
              return (
                <FormItem
                  key={type.id}
                  className="flex flex-row items-start space-x-3 space-y-0"
                >
                  <Checkbox
                    checked={field.value?.includes(type.id)}
                    onCheckedChange={(checked) => {
                      return checked
                        ? field.onChange([...field.value, type.id])
                        : field.onChange(
                            field.value?.filter(
                              (value: string) => value !== type.id
                            )
                          )
                    }}
                  />
                  <FormLabel className="font-normal cursor-pointer">
                    {type.label}
                  </FormLabel>
                </FormItem>
              )
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CaseTypesSelector;
