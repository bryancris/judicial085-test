
import { AgentAnalysis } from './legalCaseAgent.ts';

export interface CourtListenerSearchResult {
  id: string;
  caseName: string;
  court: string;
  citation: string;
  dateFiled: string;
  snippet: string;
  absoluteUrl: string;
  relevantFacts?: string;
  outcome?: string;
}

export class IntelligentCourtListenerSearch {
  private courtListenerApiKey: string;

  constructor(courtListenerApiKey: string) {
    this.courtListenerApiKey = courtListenerApiKey;
  }

  async searchWithAgentQueries(analysis: AgentAnalysis): Promise<CourtListenerSearchResult[]> {
    console.log('=== INTELLIGENT COURTLISTENER SEARCH START ===');
    console.log(`Agent provided ${analysis.searchQueries.length} search queries`);
    
    const allResults: CourtListenerSearchResult[] = [];
    
    // Try each search query from the agent
    for (let i = 0; i < analysis.searchQueries.length && i < 3; i++) {
      const query = analysis.searchQueries[i];
      console.log(`Executing search query ${i + 1}: ${query}`);
      
      try {
        const results = await this.executeSearch(query);
        console.log(`Query ${i + 1} returned ${results.length} results`);
        allResults.push(...results);
      } catch (error) {
        console.error(`Error in search query ${i + 1}:`, error);
      }
    }

    // Deduplicate results by case name and citation
    const uniqueResults = this.deduplicateResults(allResults);
    console.log(`After deduplication: ${uniqueResults.length} unique results`);
    
    return uniqueResults.slice(0, 15); // Limit to 15 results for agent scoring
  }

  private async executeSearch(query: string): Promise<CourtListenerSearchResult[]> {
    const queryParams = new URLSearchParams({
      q: query,
      order_by: 'score desc',
      type: 'o', // opinions
      format: 'json'
    });
    
    const url = `https://www.courtlistener.com/api/rest/v4/search/?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${this.courtListenerApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CourtListener API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Process and enhance results
    const results: CourtListenerSearchResult[] = [];
    
    for (const result of data.results.slice(0, 10)) {
      try {
        // Get more detailed information if available
        let relevantFacts = result.snippet || '';
        let outcome = '';
        
        // Try to get the full opinion text for better analysis
        const opinionId = result.id || result.resource_uri?.split('/').filter(Boolean).pop();
        if (opinionId) {
          try {
            const opinionUrl = `https://www.courtlistener.com/api/rest/v4/opinions/${opinionId}/`;
            const opinionResponse = await fetch(opinionUrl, {
              headers: {
                'Authorization': `Token ${this.courtListenerApiKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (opinionResponse.ok) {
              const opinionData = await opinionResponse.json();
              if (opinionData.plain_text) {
                relevantFacts = this.extractRelevantFacts(opinionData.plain_text, query);
                outcome = this.extractOutcome(opinionData.plain_text);
              }
            }
          } catch (opinionError) {
            console.log(`Could not fetch opinion details for ${opinionId}:`, opinionError);
          }
        }

        results.push({
          id: result.id || `case_${Date.now()}_${Math.random()}`,
          caseName: result.caseName || result.case_name || 'Unknown Case',
          court: result.court_name || result.court || 'Court of Record',
          citation: result.citation || 'No citation available',
          dateFiled: result.dateFiled || result.date_filed || 'Unknown date',
          snippet: result.snippet || '',
          absoluteUrl: result.absolute_url || result.absolute_uri || '',
          relevantFacts,
          outcome
        });
      } catch (resultError) {
        console.error('Error processing individual result:', resultError);
      }
    }
    
    return results;
  }

  private extractRelevantFacts(opinionText: string, searchQuery: string): string {
    if (!opinionText) return '';
    
    // Split into paragraphs and find most relevant ones
    const paragraphs = opinionText.split(/\n\n+/);
    const queryTerms = searchQuery.toLowerCase().split(/\W+/).filter(term => term.length > 3);
    
    const scoredParagraphs = paragraphs.map(paragraph => {
      const paraLower = paragraph.toLowerCase();
      let score = 0;
      
      queryTerms.forEach(term => {
        const matches = (paraLower.match(new RegExp(term, 'g')) || []).length;
        score += matches;
      });
      
      return { paragraph, score };
    });
    
    scoredParagraphs.sort((a, b) => b.score - a.score);
    
    // Get the best paragraph
    if (scoredParagraphs.length > 0 && scoredParagraphs[0].score > 0) {
      const bestParagraph = scoredParagraphs[0].paragraph;
      return bestParagraph.length > 400 ? bestParagraph.substring(0, 397) + '...' : bestParagraph;
    }
    
    return opinionText.length > 300 ? opinionText.substring(0, 297) + '...' : opinionText;
  }

  private extractOutcome(opinionText: string): string {
    if (!opinionText) return 'Outcome details not available';
    
    const conclusionKeywords = [
      'therefore', 'accordingly', 'thus', 'we conclude', 'we hold',
      'we affirm', 'we reverse', 'judgment is', 'we find', 'we rule'
    ];
    
    const paragraphs = opinionText.split(/\n\n+/);
    
    // Look in the last few paragraphs for conclusion
    for (let i = Math.max(0, paragraphs.length - 5); i < paragraphs.length; i++) {
      const para = paragraphs[i].toLowerCase();
      
      for (const keyword of conclusionKeywords) {
        if (para.includes(keyword)) {
          const sentences = paragraphs[i].split(/\.\s+/);
          for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(keyword)) {
              return sentence.trim() + '.';
            }
          }
        }
      }
    }
    
    return 'Case outcome details not available in excerpt';
  }

  private deduplicateResults(results: CourtListenerSearchResult[]): CourtListenerSearchResult[] {
    const seen = new Set<string>();
    const unique: CourtListenerSearchResult[] = [];
    
    for (const result of results) {
      const key = `${result.caseName}_${result.citation}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }
    
    return unique;
  }
}
