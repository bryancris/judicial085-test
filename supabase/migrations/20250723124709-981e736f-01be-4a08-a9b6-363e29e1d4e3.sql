-- Create perplexity_research table for storing Perplexity API research results
CREATE TABLE public.perplexity_research (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  legal_analysis_id uuid NOT NULL,
  search_type text NOT NULL,
  query text NOT NULL,
  content text NOT NULL,
  model text NOT NULL,
  usage_data jsonb,
  citations text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.perplexity_research ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own perplexity research" 
ON public.perplexity_research 
FOR SELECT 
USING (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

CREATE POLICY "Users can create their own perplexity research" 
ON public.perplexity_research 
FOR INSERT 
WITH CHECK (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

CREATE POLICY "Users can update their own perplexity research" 
ON public.perplexity_research 
FOR UPDATE 
USING (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own perplexity research" 
ON public.perplexity_research 
FOR DELETE 
USING (client_id IN (
  SELECT clients.id FROM clients WHERE clients.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_perplexity_research_updated_at
BEFORE UPDATE ON public.perplexity_research
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();