-- Create table for storing additional case law results
CREATE TABLE public.additional_case_law (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  legal_analysis_id UUID,
  perplexity_research_id UUID,
  case_name TEXT NOT NULL,
  court TEXT,
  citation TEXT,
  date_decided TEXT,
  relevant_facts TEXT,
  outcome TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.additional_case_law ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own additional case law" 
ON public.additional_case_law 
FOR SELECT 
USING (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

CREATE POLICY "Users can create their own additional case law" 
ON public.additional_case_law 
FOR INSERT 
WITH CHECK (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

CREATE POLICY "Users can update their own additional case law" 
ON public.additional_case_law 
FOR UPDATE 
USING (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own additional case law" 
ON public.additional_case_law 
FOR DELETE 
USING (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_additional_case_law_updated_at
BEFORE UPDATE ON public.additional_case_law
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();