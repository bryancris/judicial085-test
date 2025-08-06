export class CourtListenerService {
  private apiKey: string;
  private baseUrl = 'https://www.courtlistener.com/api/rest/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchCases(query: string, caseType?: string): Promise<any[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseUrl}/search/?q=${encodedQuery}&type=o&order_by=score%20desc&stat_Published=on`;
      
      console.log(`🔍 CourtListener API call: ${url.substring(0, 100)}...`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`CourtListener API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ CourtListener returned ${data.results?.length || 0} results`);
      
      return data.results || [];
    } catch (error) {
      console.error('Error in CourtListener search:', error);
      throw error;
    }
  }
}