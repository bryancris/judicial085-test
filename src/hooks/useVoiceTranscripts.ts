
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VoiceTranscript {
  id: string;
  client_id: string;
  user_id: string;
  session_id: string;
  speaker: 'user' | 'ai';
  content: string;
  timestamp: string;
  created_at: string;
}

export const useVoiceTranscripts = (clientId: string) => {
  const [transcripts, setTranscripts] = useState<VoiceTranscript[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchTranscripts = async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('voice_transcripts')
        .select('*')
        .eq('client_id', clientId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching voice transcripts:', error);
        toast({
          title: "Error",
          description: "Failed to load voice transcripts",
          variant: "destructive",
        });
        return;
      }

      setTranscripts(data || []);
    } catch (error) {
      console.error('Error fetching voice transcripts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTranscript = async (
    sessionId: string,
    speaker: 'user' | 'ai',
    content: string
  ) => {
    try {
      const { error } = await supabase
        .from('voice_transcripts')
        .insert({
          client_id: clientId,
          session_id: sessionId,
          speaker,
          content,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        console.error('Error saving transcript:', error);
        return;
      }

      // Refresh transcripts after saving
      await fetchTranscripts();
    } catch (error) {
      console.error('Error saving transcript:', error);
    }
  };

  useEffect(() => {
    fetchTranscripts();
  }, [clientId]);

  return {
    transcripts,
    isLoading,
    saveTranscript,
    refreshTranscripts: fetchTranscripts
  };
};
