
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
  case_types: string[] | null;
  referred_by: string | null;
  case_notes: string | null;
  created_at: string;
}
