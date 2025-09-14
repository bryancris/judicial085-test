-- Create Personal Injury Analysis Tables for Phase 1 Implementation

-- Table for medical document analyses
CREATE TABLE public.medical_document_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT NOT NULL,
  client_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('medical_record', 'diagnostic_report', 'imaging_result', 'treatment_note')),
  authenticity_score NUMERIC NOT NULL DEFAULT 0.0 CHECK (authenticity_score >= 0.0 AND authenticity_score <= 1.0),
  extracted_data JSONB NOT NULL DEFAULT '{}',
  timeline_events JSONB NOT NULL DEFAULT '[]',
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for legal document analyses  
CREATE TABLE public.legal_document_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT NOT NULL,
  client_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('police_report', 'witness_statement', 'incident_report', 'legal_correspondence')),
  key_issues TEXT[] NOT NULL DEFAULT '{}',
  source_credibility NUMERIC NOT NULL DEFAULT 0.0 CHECK (source_credibility >= 0.0 AND source_credibility <= 1.0),
  information_classification JSONB NOT NULL DEFAULT '{}',
  legal_elements JSONB NOT NULL DEFAULT '[]',
  arguments_analysis JSONB NOT NULL DEFAULT '{}',
  case_strength JSONB NOT NULL DEFAULT '{}',
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for PI case metrics (real-time dashboard data)
CREATE TABLE public.pi_case_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  case_id UUID,
  case_strength_score NUMERIC NOT NULL DEFAULT 0.0 CHECK (case_strength_score >= 0.0 AND case_strength_score <= 1.0),
  settlement_range_low INTEGER DEFAULT 0,
  settlement_range_high INTEGER DEFAULT 0,
  days_since_incident INTEGER DEFAULT 0,
  medical_record_completion NUMERIC DEFAULT 0.0 CHECK (medical_record_completion >= 0.0 AND medical_record_completion <= 1.0),
  incident_data JSONB DEFAULT '{}',
  medical_data JSONB DEFAULT '{}',
  functional_data JSONB DEFAULT '{}',
  financial_data JSONB DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for PI timeline events
CREATE TABLE public.pi_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('injury', 'treatment', 'diagnosis', 'medication', 'therapy', 'imaging', 'legal_milestone')),
  description TEXT NOT NULL,
  provider TEXT,
  reliability_score NUMERIC NOT NULL DEFAULT 0.0 CHECK (reliability_score >= 0.0 AND reliability_score <= 1.0),
  source_document TEXT,
  source_type TEXT CHECK (source_type IN ('medical', 'legal', 'manual_entry')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medical_document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pi_case_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pi_timeline_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_document_analyses
CREATE POLICY "Users can view their own medical analyses" 
ON public.medical_document_analyses 
FOR SELECT 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create their own medical analyses" 
ON public.medical_document_analyses 
FOR INSERT 
WITH CHECK (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own medical analyses" 
ON public.medical_document_analyses 
FOR UPDATE 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their own medical analyses" 
ON public.medical_document_analyses 
FOR DELETE 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- RLS Policies for legal_document_analyses
CREATE POLICY "Users can view their own legal analyses" 
ON public.legal_document_analyses 
FOR SELECT 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create their own legal analyses" 
ON public.legal_document_analyses 
FOR INSERT 
WITH CHECK (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own legal analyses" 
ON public.legal_document_analyses 
FOR UPDATE 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their own legal analyses" 
ON public.legal_document_analyses 
FOR DELETE 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- RLS Policies for pi_case_metrics
CREATE POLICY "Users can view their own PI case metrics" 
ON public.pi_case_metrics 
FOR SELECT 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create their own PI case metrics" 
ON public.pi_case_metrics 
FOR INSERT 
WITH CHECK (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own PI case metrics" 
ON public.pi_case_metrics 
FOR UPDATE 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their own PI case metrics" 
ON public.pi_case_metrics 
FOR DELETE 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- RLS Policies for pi_timeline_events
CREATE POLICY "Users can view their own PI timeline events" 
ON public.pi_timeline_events 
FOR SELECT 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create their own PI timeline events" 
ON public.pi_timeline_events 
FOR INSERT 
WITH CHECK (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own PI timeline events" 
ON public.pi_timeline_events 
FOR UPDATE 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their own PI timeline events" 
ON public.pi_timeline_events 
FOR DELETE 
USING (client_id IN (
  SELECT id FROM clients WHERE user_id = auth.uid()
));

-- Triggers for updated_at
CREATE TRIGGER update_medical_document_analyses_updated_at
  BEFORE UPDATE ON public.medical_document_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_document_analyses_updated_at
  BEFORE UPDATE ON public.legal_document_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pi_case_metrics_updated_at
  BEFORE UPDATE ON public.pi_case_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pi_timeline_events_updated_at
  BEFORE UPDATE ON public.pi_timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_medical_document_analyses_client_id ON public.medical_document_analyses(client_id);
CREATE INDEX idx_medical_document_analyses_document_id ON public.medical_document_analyses(document_id);
CREATE INDEX idx_legal_document_analyses_client_id ON public.legal_document_analyses(client_id);
CREATE INDEX idx_legal_document_analyses_document_id ON public.legal_document_analyses(document_id);
CREATE INDEX idx_pi_case_metrics_client_id ON public.pi_case_metrics(client_id);
CREATE INDEX idx_pi_timeline_events_client_id ON public.pi_timeline_events(client_id);
CREATE INDEX idx_pi_timeline_events_date ON public.pi_timeline_events(event_date);