
import * as z from "zod";

export const clientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  case_number: z.string().optional(),
  case_description: z.string().optional(),
  case_types: z.array(z.string()).default([]),
  referred_by: z.string().optional(),
  case_notes: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const defaultValues: ClientFormValues = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  case_number: "",
  case_description: "",
  case_types: [],
  referred_by: "",
  case_notes: "",
};
