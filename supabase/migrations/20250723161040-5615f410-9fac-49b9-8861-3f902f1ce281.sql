-- Step 5: Database Integration for Case Discussion Research

-- Add foreign key to link perplexity research to specific case discussion messages
ALTER TABLE perplexity_research 
ADD COLUMN case_discussion_id uuid REFERENCES case_discussions(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_perplexity_research_case_discussion_id ON perplexity_research(case_discussion_id);
CREATE INDEX idx_perplexity_research_client_search ON perplexity_research(client_id, search_type, created_at DESC);

-- Create function to get research linked to a specific case discussion
CREATE OR REPLACE FUNCTION get_case_discussion_research(discussion_id_param uuid)
RETURNS TABLE(
  id uuid,
  search_type text,
  query text,
  content text,
  model text,
  citations text[],
  usage_data jsonb,
  metadata jsonb,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.id,
        pr.search_type,
        pr.query,
        pr.content,
        pr.model,
        pr.citations,
        pr.usage_data,
        pr.metadata,
        pr.created_at
    FROM perplexity_research pr
    WHERE pr.case_discussion_id = discussion_id_param
    ORDER BY pr.created_at DESC;
END;
$$;

-- Create function to find similar existing research to avoid duplicates
CREATE OR REPLACE FUNCTION find_similar_research(
  client_id_param uuid,
  search_type_param text,
  query_param text,
  similarity_threshold float DEFAULT 0.8
)
RETURNS TABLE(
  id uuid,
  query text,
  content text,
  similarity_score float,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.id,
        pr.query,
        pr.content,
        -- Simple text similarity using word overlap (can be enhanced with embeddings later)
        CASE 
            WHEN length(query_param) = 0 THEN 0.0
            ELSE (
                SELECT COUNT(*)::float / GREATEST(
                    array_length(string_to_array(lower(query_param), ' '), 1),
                    array_length(string_to_array(lower(pr.query), ' '), 1)
                )
                FROM (
                    SELECT unnest(string_to_array(lower(query_param), ' ')) AS word1
                    INTERSECT
                    SELECT unnest(string_to_array(lower(pr.query), ' ')) AS word2
                ) AS common_words
            )
        END AS similarity_score,
        pr.created_at
    FROM perplexity_research pr
    WHERE pr.client_id = client_id_param
      AND pr.search_type = search_type_param
      AND pr.created_at > NOW() - INTERVAL '30 days'  -- Only recent research
    HAVING (
        CASE 
            WHEN length(query_param) = 0 THEN 0.0
            ELSE (
                SELECT COUNT(*)::float / GREATEST(
                    array_length(string_to_array(lower(query_param), ' '), 1),
                    array_length(string_to_array(lower(pr.query), ' '), 1)
                )
                FROM (
                    SELECT unnest(string_to_array(lower(query_param), ' ')) AS word1
                    INTERSECT
                    SELECT unnest(string_to_array(lower(pr.query), ' ')) AS word2
                ) AS common_words
            )
        END
    ) >= similarity_threshold
    ORDER BY similarity_score DESC, pr.created_at DESC
    LIMIT 5;
END;
$$;

-- Create function to get all research for a client's legal analysis
CREATE OR REPLACE FUNCTION get_client_research_for_analysis(
  client_id_param uuid,
  legal_analysis_id_param uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  search_type text,
  query text,
  content text,
  citations text[],
  created_at timestamp with time zone,
  case_discussion_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.id,
        pr.search_type,
        pr.query,
        pr.content,
        pr.citations,
        pr.created_at,
        pr.case_discussion_id
    FROM perplexity_research pr
    WHERE pr.client_id = client_id_param
      AND (
          legal_analysis_id_param IS NULL 
          OR pr.legal_analysis_id = legal_analysis_id_param
          OR pr.legal_analysis_id IS NULL
      )
    ORDER BY pr.created_at DESC;
END;
$$;

-- Create function to link existing research to a legal analysis
CREATE OR REPLACE FUNCTION link_research_to_analysis(
  research_id_param uuid,
  legal_analysis_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE perplexity_research
    SET legal_analysis_id = legal_analysis_id_param,
        updated_at = now()
    WHERE id = research_id_param;
    
    RETURN FOUND;
END;
$$;

-- Create function to get research statistics for a client
CREATE OR REPLACE FUNCTION get_client_research_stats(client_id_param uuid)
RETURNS TABLE(
  total_research_count bigint,
  similar_cases_count bigint,
  legal_research_count bigint,
  recent_research_count bigint,
  avg_confidence float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_research_count,
        COUNT(*) FILTER (WHERE search_type = 'similar-cases') as similar_cases_count,
        COUNT(*) FILTER (WHERE search_type = 'legal-research') as legal_research_count,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_research_count,
        AVG((metadata->>'confidence')::float) as avg_confidence
    FROM perplexity_research
    WHERE client_id = client_id_param;
END;
$$;

-- Add trigger to update updated_at timestamp on perplexity_research
CREATE TRIGGER update_perplexity_research_updated_at
    BEFORE UPDATE ON perplexity_research
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();