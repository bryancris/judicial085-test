
export interface Case {
  id: string;
  client_id: string;
  case_number: string | null;
  case_title: string;
  case_type: string | null;
  case_description: string | null;
  case_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
