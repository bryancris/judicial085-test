-- Create global CourtListener case repository
CREATE TABLE public.courtlistener_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courtlistener_id TEXT UNIQUE NOT NULL,
  case_name TEXT NOT NULL,
  court TEXT,
  court_name TEXT,
  citation TEXT,
  date_filed TIMESTAMP WITH TIME ZONE,
  date_decided TIMESTAMP WITH TIME ZONE,
  absolute_url TEXT,
  snippet TEXT,
  full_text TEXT,
  jurisdiction TEXT,
  case_type TEXT,
  precedential_status TEXT,
  first_indexed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  api_fetch_count INTEGER DEFAULT 0
);

-- Create vector embeddings for semantic search
CREATE TABLE public.courtlistener_case_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.courtlistener_cases(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('snippet', 'full_text', 'facts', 'holding')),
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create legal concepts for enhanced search
CREATE TABLE public.courtlistener_case_concepts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.courtlistener_cases(id) ON DELETE CASCADE,
  concept_type TEXT NOT NULL CHECK (concept_type IN ('legal_issue', 'statute', 'doctrine', 'remedy')),
  concept_value TEXT NOT NULL,
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  extracted_by TEXT DEFAULT 'ai_analysis' CHECK (extracted_by IN ('ai_analysis', 'manual', 'keyword_matching')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case-to-case citations tracking
CREATE TABLE public.courtlistener_case_citations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  citing_case_id UUID NOT NULL REFERENCES public.courtlistener_cases(id) ON DELETE CASCADE,
  cited_case_id UUID NOT NULL REFERENCES public.courtlistener_cases(id) ON DELETE CASCADE,
  citation_context TEXT,
  citation_type TEXT CHECK (citation_type IN ('followed', 'distinguished', 'overruled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create search query cache
CREATE TABLE public.courtlistener_search_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_hash TEXT UNIQUE NOT NULL,
  original_query TEXT NOT NULL,
  search_parameters JSONB DEFAULT '{}',
  result_case_ids UUID[] DEFAULT '{}',
  total_results INTEGER DEFAULT 0,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  hit_count INTEGER DEFAULT 0
);

-- Add indexes for performance
CREATE INDEX idx_courtlistener_cases_court ON public.courtlistener_cases(court);
CREATE INDEX idx_courtlistener_cases_case_type ON public.courtlistener_cases(case_type);
CREATE INDEX idx_courtlistener_cases_jurisdiction ON public.courtlistener_cases(jurisdiction);
CREATE INDEX idx_courtlistener_cases_date_decided ON public.courtlistener_cases(date_decided);

CREATE INDEX idx_case_embeddings_case_id ON public.courtlistener_case_embeddings(case_id);
CREATE INDEX idx_case_embeddings_content_type ON public.courtlistener_case_embeddings(content_type);

CREATE INDEX idx_case_concepts_case_id ON public.courtlistener_case_concepts(case_id);
CREATE INDEX idx_case_concepts_type_value ON public.courtlistener_case_concepts(concept_type, concept_value);

CREATE INDEX idx_case_citations_citing ON public.courtlistener_case_citations(citing_case_id);
CREATE INDEX idx_case_citations_cited ON public.courtlistener_case_citations(cited_case_id);

CREATE INDEX idx_search_cache_query_hash ON public.courtlistener_search_cache(query_hash);
CREATE INDEX idx_search_cache_expires ON public.courtlistener_search_cache(expires_at);

-- Add RLS policies for global dataset (public access for all authenticated users)
ALTER TABLE public.courtlistener_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courtlistener_case_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courtlistener_case_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courtlistener_case_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courtlistener_search_cache ENABLE ROW LEVEL SECURITY;

-- Public read access for all authenticated users
CREATE POLICY "Authenticated users can view courtlistener cases" ON public.courtlistener_cases FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view case embeddings" ON public.courtlistener_case_embeddings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view case concepts" ON public.courtlistener_case_concepts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view case citations" ON public.courtlistener_case_citations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view search cache" ON public.courtlistener_search_cache FOR SELECT USING (auth.uid() IS NOT NULL);

-- Service-level access for inserting/updating (will be used by edge functions)
CREATE POLICY "Service can manage courtlistener cases" ON public.courtlistener_cases FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service can manage case embeddings" ON public.courtlistener_case_embeddings FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service can manage case concepts" ON public.courtlistener_case_concepts FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service can manage case citations" ON public.courtlistener_case_citations FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service can manage search cache" ON public.courtlistener_search_cache FOR ALL USING (auth.uid() IS NOT NULL);

-- Add columns to existing similar_cases table to reference global dataset
ALTER TABLE public.similar_cases 
ADD COLUMN global_case_ids UUID[] DEFAULT '{}',
ADD COLUMN search_cache_id UUID REFERENCES public.courtlistener_search_cache(id);

-- Add column to existing additional_case_law table
ALTER TABLE public.additional_case_law 
ADD COLUMN courtlistener_case_id UUID REFERENCES public.courtlistener_cases(id);

-- Create trigger to update last_updated_at
CREATE OR REPLACE FUNCTION update_courtlistener_case_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_courtlistener_case_updated_at
  BEFORE UPDATE ON public.courtlistener_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_courtlistener_case_updated_at();