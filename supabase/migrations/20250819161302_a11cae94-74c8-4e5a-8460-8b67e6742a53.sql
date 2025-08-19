-- Add validation columns to legal_analyses table
ALTER TABLE public.legal_analyses 
ADD COLUMN validation_status text DEFAULT 'pending',
ADD COLUMN validation_score numeric DEFAULT 0.0,
ADD COLUMN validated_at timestamp with time zone,
ADD COLUMN provenance jsonb DEFAULT '{}'::jsonb,
ADD COLUMN fact_sources jsonb DEFAULT '[]'::jsonb,
ADD COLUMN citation_verified boolean DEFAULT false;

-- Add validation columns to perplexity_research table  
ALTER TABLE public.perplexity_research
ADD COLUMN validation_status text DEFAULT 'pending',
ADD COLUMN validation_score numeric DEFAULT 0.0,
ADD COLUMN validated_at timestamp with time zone,
ADD COLUMN fact_sources jsonb DEFAULT '[]'::jsonb,
ADD COLUMN source_verified boolean DEFAULT false;

-- Add validation columns to similar_cases table
ALTER TABLE public.similar_cases
ADD COLUMN validation_status text DEFAULT 'pending', 
ADD COLUMN validation_score numeric DEFAULT 0.0,
ADD COLUMN validated_at timestamp with time zone,
ADD COLUMN courtlistener_verified boolean DEFAULT false;

-- Add validation columns to additional_case_law table
ALTER TABLE public.additional_case_law
ADD COLUMN validation_status text DEFAULT 'pending',
ADD COLUMN validation_score numeric DEFAULT 0.0, 
ADD COLUMN validated_at timestamp with time zone,
ADD COLUMN courtlistener_verified boolean DEFAULT false;

-- Create validation rules table for configurable checks
CREATE TABLE public.validation_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name text NOT NULL,
    rule_type text NOT NULL, -- 'blocking', 'scoring', 'warning'
    table_name text NOT NULL,
    validation_function text NOT NULL,
    min_score numeric DEFAULT 0.0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on validation_rules
ALTER TABLE public.validation_rules ENABLE ROW LEVEL SECURITY;

-- Insert default validation rules
INSERT INTO public.validation_rules (rule_name, rule_type, table_name, validation_function, min_score) VALUES
('non_empty_content', 'blocking', 'legal_analyses', 'check_non_empty_content', 1.0),
('verified_citations', 'scoring', 'legal_analyses', 'check_citation_verification', 0.7),
('fact_overlap', 'scoring', 'legal_analyses', 'check_fact_overlap', 0.6),
('courtlistener_verification', 'scoring', 'similar_cases', 'check_courtlistener_cases', 0.8),
('source_verification', 'scoring', 'perplexity_research', 'check_source_verification', 0.7);

-- Create RLS policies for validation_rules
CREATE POLICY "Users can view validation rules" 
ON public.validation_rules 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create function to validate legal analysis
CREATE OR REPLACE FUNCTION public.validate_legal_analysis(
    analysis_content text,
    fact_sources jsonb DEFAULT '[]'::jsonb,
    citations jsonb DEFAULT '[]'::jsonb
) RETURNS TABLE(
    validation_status text,
    validation_score numeric,
    validation_details jsonb
) 
LANGUAGE plpgsql
AS $$
DECLARE
    score numeric := 0.0;
    details jsonb := '{}'::jsonb;
    total_checks integer := 0;
    passed_checks integer := 0;
BEGIN
    -- Check 1: Non-empty content (blocking)
    total_checks := total_checks + 1;
    IF analysis_content IS NOT NULL AND length(trim(analysis_content)) > 50 THEN
        passed_checks := passed_checks + 1;
        details := details || jsonb_build_object('non_empty_content', true);
    ELSE
        details := details || jsonb_build_object('non_empty_content', false);
        RETURN QUERY SELECT 'rejected'::text, 0.0::numeric, 
            (details || jsonb_build_object('reason', 'Content too short or empty'))::jsonb;
        RETURN;
    END IF;

    -- Check 2: Fact sources verification
    total_checks := total_checks + 1;
    IF jsonb_array_length(fact_sources) > 0 THEN
        passed_checks := passed_checks + 1;
        details := details || jsonb_build_object('has_fact_sources', true);
    ELSE
        details := details || jsonb_build_object('has_fact_sources', false);
    END IF;

    -- Check 3: Citation verification
    total_checks := total_checks + 1;
    IF jsonb_array_length(citations) > 0 THEN
        passed_checks := passed_checks + 1;
        details := details || jsonb_build_object('has_citations', true);
    ELSE
        details := details || jsonb_build_object('has_citations', false);
    END IF;

    -- Check 4: No hallucination markers
    total_checks := total_checks + 1;
    IF analysis_content !~* '(hypothetically|for example|might be|could potentially|assuming|imagine if)' THEN
        passed_checks := passed_checks + 1;
        details := details || jsonb_build_object('no_hallucination_markers', true);
    ELSE
        details := details || jsonb_build_object('no_hallucination_markers', false);
    END IF;

    -- Calculate score
    score := (passed_checks::numeric / total_checks::numeric);
    
    -- Determine status
    IF score >= 0.8 THEN
        RETURN QUERY SELECT 'validated'::text, score, details;
    ELSIF score >= 0.6 THEN
        RETURN QUERY SELECT 'pending_review'::text, score, details;
    ELSE
        RETURN QUERY SELECT 'rejected'::text, score, details;
    END IF;
END;
$$;