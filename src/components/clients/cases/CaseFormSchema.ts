import * as z from "zod";

export const caseSchema = z.object({
  case_title: z.string().min(1, "Case title is required"),
  case_type: z.string().optional(),
  case_description: z.string().optional(),
  case_notes: z.string().optional(),
  case_number: z.string().optional(),
  status: z.string().default("active"),
});

export type CaseFormValues = z.infer<typeof caseSchema>;

export const caseDefaultValues: CaseFormValues = {
  case_title: "",
  case_type: "",
  case_description: "",
  case_notes: "",
  case_number: "",
  status: "active",
};