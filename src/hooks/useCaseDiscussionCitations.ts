import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PerplexityResearch {
  id: string;
  search_type: string;
  query: string;
  content: string;
  model: string;
  citations: string[];
  usage_data: any;
  metadata: any;
  created_at: string;
}

export const useCaseDiscussionCitations = (clientId: string, messageContent: string) => {
  const [citations, setCitations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCitations = async () => {
      if (!clientId || !messageContent) return;

      // Only fetch if the message contains research indicators
      const hasResearch = messageContent.includes("🔍 Legal Research Analysis") || 
                         messageContent.includes("## 📚 Legal Research Results");
      
      if (!hasResearch) return;

      setIsLoading(true);
      setError(null);

      try {
        // Extract research query from message content to match against database
        const queryMatch = messageContent.match(/Query:\s*(.+?)(?:\n|$)/i);
        const extractedQuery = queryMatch ? queryMatch[1].trim() : '';

        if (!extractedQuery) {
          // If we can't extract a query, look for recent research for this client
          const { data, error: dbError } = await supabase
            .from('perplexity_research')
            .select('citations, search_type, created_at')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (dbError) throw dbError;
          
          if (data && data.length > 0 && data[0].citations) {
            setCitations(data[0].citations);
          }
        } else {
          // Try to find research that matches the extracted query
          const { data, error: dbError } = await supabase
            .from('perplexity_research')
            .select('citations, search_type, created_at')
            .eq('client_id', clientId)
            .ilike('query', `%${extractedQuery}%`)
            .order('created_at', { ascending: false })
            .limit(1);

          if (dbError) throw dbError;
          
          if (data && data.length > 0 && data[0].citations) {
            setCitations(data[0].citations);
          }
        }
      } catch (err) {
        console.error('Error fetching citations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch citations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCitations();
  }, [clientId, messageContent]);

  return { citations, isLoading, error };
};