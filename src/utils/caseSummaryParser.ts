import { supabase } from "@/integrations/supabase/client";

export interface StructuredCaseData {
  parties: Array<{
    name: string;
    role: string;
  }>;
  timeline: Array<{
    date: string;
    event: string;
  }>;
  coreFacts: string[];
  keyDocuments: Array<{
    title: string;
    status: string;
    id?: string;
  }>;
}

// Parse parties from case summary text
export const parseParties = (caseSummary: string): Array<{name: string; role: string}> => {
  const parties: Array<{name: string; role: string}> = [];
  
  // Look for common party patterns
  const plaintiffPatterns = [
    /(?:plaintiff|client|complainant)(?:\s+is)?\s*:?\s*([A-Za-z\s]+?)(?:\s+(?:vs?\.?|against|and)|$)/i,
    /([A-Za-z\s]+?)\s+(?:vs?\.?|v\.?)\s+/i,
    /client\s+([A-Za-z\s]+)/i
  ];
  
  const defendantPatterns = [
    /(?:defendant|respondent)(?:\s+is)?\s*:?\s*([A-Za-z\s]+?)(?:\s+|$)/i,
    /(?:vs?\.?|v\.?|against)\s+([A-Za-z\s]+)/i
  ];
  
  // Extract plaintiff
  for (const pattern of plaintiffPatterns) {
    const match = caseSummary.match(pattern);
    if (match && match[1]?.trim()) {
      const name = match[1].trim().replace(/[,.]/g, '');
      if (name.length > 2 && name.length < 50) {
        parties.push({ name, role: 'Plaintiff/Client' });
        break;
      }
    }
  }
  
  // Extract defendant
  for (const pattern of defendantPatterns) {
    const match = caseSummary.match(pattern);
    if (match && match[1]?.trim()) {
      const name = match[1].trim().replace(/[,.]/g, '');
      if (name.length > 2 && name.length < 50) {
        parties.push({ name, role: 'Defendant' });
        break;
      }
    }
  }
  
  return parties;
};

// Parse timeline events from case summary
export const parseTimeline = (caseSummary: string): Array<{date: string; event: string}> => {
  const timeline: Array<{date: string; event: string}> = [];
  
  // Look for date patterns
  const datePatterns = [
    // Match "On [date]", "In [month year]", etc.
    /(?:on|in)\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\s*[,:]?\s*([^.!?]+)/gi,
    // Match "[date]:" or "[date] -"
    /([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\s*[:\-]\s*([^.!?]+)/gi,
    // Match dates at start of sentences
    /(?:^|\n)\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s*[,.]?\s*([^.!?]+)/gm
  ];
  
  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(caseSummary)) !== null) {
      const date = match[1]?.trim();
      const event = match[2]?.trim();
      
      if (date && event && event.length > 10 && event.length < 200) {
        timeline.push({ date, event });
      }
    }
  }
  
  // Remove duplicates and sort by apparent chronology
  const uniqueTimeline = timeline.filter((item, index, self) => 
    index === self.findIndex(t => t.date === item.date && t.event === item.event)
  );
  
  return uniqueTimeline.slice(0, 5); // Limit to 5 most relevant events
};

// Parse core facts from case summary
export const parseCoreFacts = (caseSummary: string): string[] => {
  const facts: string[] = [];
  
  // Split into sentences and identify factual statements
  const sentences = caseSummary.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    
    // Look for factual indicators
    if (
      trimmed.includes('purchased') || 
      trimmed.includes('defect') || 
      trimmed.includes('repair') || 
      trimmed.includes('damage') || 
      trimmed.includes('incident') || 
      trimmed.includes('occurred') ||
      trimmed.includes('injured') ||
      trimmed.includes('contract') ||
      trimmed.includes('agreement') ||
      trimmed.includes('warranty')
    ) {
      facts.push(trimmed);
    }
  }
  
  return facts.slice(0, 6); // Limit to 6 key facts
};

// Fetch key documents from database
export const fetchKeyDocuments = async (clientId: string): Promise<Array<{title: string; status: string; id?: string}>> => {
  try {
    const { data, error } = await supabase
      .from('document_metadata')
      .select('id, title, processing_status, schema')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
    
    return (data || []).map(doc => ({
      id: doc.id,
      title: doc.title || doc.schema || 'Untitled Document',
      status: doc.processing_status || 'pending'
    }));
  } catch (error) {
    console.error('Error fetching key documents:', error);
    return [];
  }
};

// Main function to parse structured case data
export const parseStructuredCaseData = async (caseSummary: string, clientId: string): Promise<StructuredCaseData> => {
  const parties = parseParties(caseSummary);
  const timeline = parseTimeline(caseSummary);
  const coreFacts = parseCoreFacts(caseSummary);
  const keyDocuments = await fetchKeyDocuments(clientId);
  
  return {
    parties,
    timeline,
    coreFacts,
    keyDocuments
  };
};