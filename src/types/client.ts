
export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  case_number: string | null;
  case_description: string | null;
  case_types: string[] | null;
  referred_by: string | null;
  case_notes: string | null;
  created_at: string;
}

// Extended interface that includes cases
export interface ClientWithCases extends Client {
  cases?: any[]; // You can define a more specific type for cases if needed
}
