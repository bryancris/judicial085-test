
export interface DiscoveryRequest {
  id: string;
  client_id: string;
  title: string;
  content: string;
  requesting_party: string | null;
  date_received: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface DiscoveryResponse {
  id: string;
  request_id: string;
  content: string;
  status: 'draft' | 'review' | 'final';
  created_at: string;
  updated_at: string;
}

export interface DiscoveryTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryDocument {
  id: string;
  response_id: string;
  document_id: number | null;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryAnalysisResult {
  requestType: string;
  requestCount: number;
  complexityScore: number;
  potentialIssues: string[];
  suggestedApproach: string;
}
