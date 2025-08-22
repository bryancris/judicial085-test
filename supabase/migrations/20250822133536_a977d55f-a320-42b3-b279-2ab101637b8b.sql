-- Create early_access_signups table
CREATE TABLE public.early_access_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  firm_name TEXT,
  role TEXT,
  state TEXT,
  phone TEXT,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;

-- Create policies for early access signups
CREATE POLICY "Super admins can view all early access signups" 
ON public.early_access_signups 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Anyone can create early access signups" 
ON public.early_access_signups 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_early_access_signups_updated_at
BEFORE UPDATE ON public.early_access_signups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();