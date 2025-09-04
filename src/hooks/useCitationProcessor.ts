/**
 * Hook for processing and enhancing citations in text content
 */

import { useState, useCallback, useMemo } from 'react';
import { enhanceTextWithCitations, EnhancedCitation, CitationMatch } from '@/utils/citationEnhancer';

export interface CitationProcessorState {
  enhancedCitations: EnhancedCitation[];
  citationMatches: CitationMatch[];
  isLoading: boolean;
  error: string | null;
}

export const useCitationProcessor = () => {
  const [state, setState] = useState<CitationProcessorState>({
    enhancedCitations: [],
    citationMatches: [],
    isLoading: false,
    error: null,
  });

  const processText = useCallback(async (text: string) => {
    if (!text.trim()) {
      setState({
        enhancedCitations: [],
        citationMatches: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await enhanceTextWithCitations(text);
      setState({
        enhancedCitations: result.enhancedCitations,
        citationMatches: result.citationMatches,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error processing citations:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to process citations',
      }));
    }
  }, []);

  const getCitationUrl = useCallback((citation: string): string | null => {
    const enhanced = state.enhancedCitations.find(
      c => c.citation === citation || c.citation.includes(citation) || citation.includes(c.citation)
    );
    return enhanced?.url || null;
  }, [state.enhancedCitations]);

  const reset = useCallback(() => {
    setState({
      enhancedCitations: [],
      citationMatches: [],
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    processText,
    getCitationUrl,
    reset,
  };
};