-- Create function to extract timeline events from existing medical analyses (simplified)
CREATE OR REPLACE FUNCTION extract_timeline_events_from_medical_analyses()
RETURNS TABLE(extracted_count integer, client_uuid uuid)
LANGUAGE plpgsql
AS $$
DECLARE
    rec RECORD;
    timeline_event JSONB;
    extracted_count INTEGER := 0;
    current_client_id UUID;
BEGIN
    -- Clear existing timeline events to avoid duplicates
    DELETE FROM pi_timeline_events WHERE client_id IN (
        SELECT DISTINCT mda.client_id 
        FROM medical_document_analyses mda
        WHERE jsonb_array_length(mda.timeline_events) > 0
    );
    
    -- Loop through all medical analyses that have timeline events
    FOR rec IN 
        SELECT mda.client_id, mda.id as analysis_id, mda.timeline_events
        FROM medical_document_analyses mda
        WHERE jsonb_array_length(mda.timeline_events) > 0
    LOOP
        current_client_id := rec.client_id;
        
        -- Extract each timeline event from the JSONB array
        FOR timeline_event IN 
            SELECT * FROM jsonb_array_elements(rec.timeline_events)
        LOOP
            -- Insert timeline event into pi_timeline_events table
            INSERT INTO pi_timeline_events (
                client_id,
                event_date,
                event_type,
                description,
                provider,
                source_document,
                reliability_score,
                created_at,
                updated_at
            ) VALUES (
                current_client_id,
                COALESCE(
                    (timeline_event->>'date')::timestamp with time zone,
                    (timeline_event->>'eventDate')::timestamp with time zone,
                    now()
                ),
                COALESCE(
                    timeline_event->>'type',
                    timeline_event->>'eventType',
                    'medical_event'
                ),
                COALESCE(
                    timeline_event->>'description',
                    timeline_event->>'event',
                    'Medical event'
                ),
                timeline_event->>'provider',
                timeline_event->>'source',
                COALESCE(
                    (timeline_event->>'reliability')::numeric,
                    (timeline_event->>'reliabilityScore')::numeric,
                    0.8
                ),
                now(),
                now()
            );
            
            extracted_count := extracted_count + 1;
        END LOOP;
    END LOOP;
    
    RETURN QUERY SELECT extracted_count, current_client_id;
END;
$$;

-- Execute the function to migrate existing data
SELECT * FROM extract_timeline_events_from_medical_analyses();

-- Create index for better performance on timeline queries
CREATE INDEX IF NOT EXISTS idx_pi_timeline_events_client_date 
ON pi_timeline_events(client_id, event_date DESC);