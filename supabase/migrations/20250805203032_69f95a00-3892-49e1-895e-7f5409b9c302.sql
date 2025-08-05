-- Create a function for semantic search of CourtListener cases
CREATE OR REPLACE FUNCTION search_similar_courtlistener_cases(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  courtlistener_id text,
  case_name text,
  court text,
  court_name text,
  citation text,
  date_filed timestamp with time zone,
  date_decided timestamp with time zone,
  snippet text,
  absolute_url text,
  jurisdiction text,
  case_type text,
  precedential_status text,
  api_fetch_count integer,
  similarity double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.courtlistener_id,
    c.case_name,
    c.court,
    c.court_name,
    c.citation,
    c.date_filed,
    c.date_decided,
    c.snippet,
    c.absolute_url,
    c.jurisdiction,
    c.case_type,
    c.precedential_status,
    c.api_fetch_count,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM courtlistener_cases c
  INNER JOIN courtlistener_case_embeddings e ON c.id = e.case_id
  WHERE 
    e.embedding IS NOT NULL
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create a function for hybrid search (semantic + text)
CREATE OR REPLACE FUNCTION hybrid_search_courtlistener_cases(
  query_text text,
  query_embedding vector DEFAULT NULL,
  match_threshold double precision DEFAULT 0.6,
  match_count integer DEFAULT 10,
  semantic_weight double precision DEFAULT 0.7
)
RETURNS TABLE(
  id uuid,
  courtlistener_id text,
  case_name text,
  court text,
  court_name text,
  citation text,
  date_filed timestamp with time zone,
  date_decided timestamp with time zone,
  snippet text,
  absolute_url text,
  jurisdiction text,
  case_type text,
  precedential_status text,
  api_fetch_count integer,
  similarity double precision,
  text_rank double precision,
  combined_score double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH semantic_results AS (
    SELECT 
      c.id,
      c.courtlistener_id,
      c.case_name,
      c.court,
      c.court_name,
      c.citation,
      c.date_filed,
      c.date_decided,
      c.snippet,
      c.absolute_url,
      c.jurisdiction,
      c.case_type,
      c.precedential_status,
      c.api_fetch_count,
      CASE 
        WHEN query_embedding IS NOT NULL AND e.embedding IS NOT NULL
        THEN 1 - (e.embedding <=> query_embedding)
        ELSE 0
      END AS semantic_similarity
    FROM courtlistener_cases c
    LEFT JOIN courtlistener_case_embeddings e ON c.id = e.case_id
    WHERE 
      query_embedding IS NULL 
      OR (e.embedding IS NOT NULL AND 1 - (e.embedding <=> query_embedding) > match_threshold)
  ),
  text_results AS (
    SELECT 
      c.id,
      ts_rank_cd(
        to_tsvector('english', coalesce(c.case_name, '') || ' ' || coalesce(c.snippet, '')),
        plainto_tsquery('english', query_text)
      ) AS text_rank
    FROM courtlistener_cases c
    WHERE 
      to_tsvector('english', coalesce(c.case_name, '') || ' ' || coalesce(c.snippet, ''))
      @@ plainto_tsquery('english', query_text)
  )
  SELECT 
    sr.id,
    sr.courtlistener_id,
    sr.case_name,
    sr.court,
    sr.court_name,
    sr.citation,
    sr.date_filed,
    sr.date_decided,
    sr.snippet,
    sr.absolute_url,
    sr.jurisdiction,
    sr.case_type,
    sr.precedential_status,
    sr.api_fetch_count,
    sr.semantic_similarity AS similarity,
    COALESCE(tr.text_rank, 0) AS text_rank,
    (semantic_weight * sr.semantic_similarity + (1 - semantic_weight) * COALESCE(tr.text_rank, 0)) AS combined_score
  FROM semantic_results sr
  LEFT JOIN text_results tr ON sr.id = tr.id
  WHERE 
    sr.semantic_similarity > 0 OR tr.text_rank > 0
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Create an index for better text search performance
CREATE INDEX IF NOT EXISTS idx_courtlistener_cases_text_search 
ON courtlistener_cases 
USING gin(to_tsvector('english', coalesce(case_name, '') || ' ' || coalesce(snippet, '')));