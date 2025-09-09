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
  
  // Enhanced transaction-based party detection
  const transactionPatterns = [
    // "Name purchases... from Company" pattern
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+purchases?[^.]*?from\s+([A-Z][a-zA-Z\s&]+?)(?:\s+for|\s+at|\.|\s*$)/i,
    // "Name bought... from Company" pattern  
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:bought|acquired)[^.]*?from\s+([A-Z][a-zA-Z\s&]+?)(?:\s+for|\s+at|\.|\s*$)/i,
    // "Company sold... to Name" pattern
    /([A-Z][a-zA-Z\s&]+?)\s+sold[^.]*?to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?:\s+for|\.|\s*$)/i
  ];

  // Traditional legal party patterns
  const traditionalPatterns = [
    /(?:plaintiff|client|complainant)(?:\s+is)?\s*:?\s*([A-Za-z\s]+?)(?:\s+(?:vs?\.?|against|and)|$)/i,
    /([A-Za-z\s]+?)\s+(?:vs?\.?|v\.?)\s+([A-Za-z\s]+)/i,
    /client\s+([A-Za-z\s]+)/i
  ];
  
  // Try transaction patterns first (more specific)
  for (const pattern of transactionPatterns) {
    const match = caseSummary.match(pattern);
    if (match) {
      const name1 = match[1]?.trim().replace(/[,.]/g, '');
      const name2 = match[2]?.trim().replace(/[,.]/g, '');
      
      if (name1 && name2 && name1.length > 2 && name2.length > 2) {
        // For purchase patterns, first match is usually the consumer/client
        if (pattern.source.includes('purchases?') || pattern.source.includes('bought')) {
          parties.push({ name: name1, role: 'Client/Consumer' });
          parties.push({ name: name2, role: 'Business/Defendant' });
        } else {
          // For "sold to" patterns, reverse the roles
          parties.push({ name: name2, role: 'Client/Consumer' });
          parties.push({ name: name1, role: 'Business/Defendant' });
        }
        return parties;
      }
    }
  }
  
  // Fall back to traditional patterns
  for (const pattern of traditionalPatterns) {
    const match = caseSummary.match(pattern);
    if (match) {
      if (pattern.source.includes('vs?') && match[1] && match[2]) {
        // "A vs B" pattern
        const plaintiff = match[1].trim().replace(/[,.]/g, '');
        const defendant = match[2].trim().replace(/[,.]/g, '');
        if (plaintiff.length > 2 && defendant.length > 2) {
          parties.push({ name: plaintiff, role: 'Plaintiff/Client' });
          parties.push({ name: defendant, role: 'Defendant' });
          return parties;
        }
      } else if (match[1]?.trim()) {
        const name = match[1].trim().replace(/[,.]/g, '');
        if (name.length > 2 && name.length < 50) {
          parties.push({ name, role: 'Client' });
        }
      }
    }
  }
  
  // Last resort: extract proper nouns that might be names
  if (parties.length === 0) {
    const properNouns = caseSummary.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const uniqueNames = [...new Set(properNouns)]
      .filter(name => name.length > 2 && name.length < 50)
      .slice(0, 2);
    
    uniqueNames.forEach((name, index) => {
      parties.push({ 
        name, 
        role: index === 0 ? 'Client' : 'Other Party' 
      });
    });
  }
  
  return parties;
};

// Parse timeline events from case summary
export const parseTimeline = (caseSummary: string): Array<{date: string; event: string}> => {
  const timeline: Array<{date: string; event: string}> = [];
  
  // Extract purchase/transaction information for natural timeline start
  const purchasePatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+purchases?\s+([^.]+?)(?:\s+for\s+\$?([\d,]+)|\.|\s*$)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:bought|acquired)\s+([^.]+?)(?:\s+for\s+\$?([\d,]+)|\.|\s*$)/i
  ];
  
  for (const pattern of purchasePatterns) {
    const match = caseSummary.match(pattern);
    if (match) {
      const buyer = match[1];
      const item = match[2].replace(/\s+for\s+\$?[\d,]+.*$/, '');
      const price = match[3] ? ` for $${match[3]}` : '';
      timeline.push({ 
        date: 'The Purchase', 
        event: `${buyer} purchases ${item}${price}` 
      });
      break;
    }
  }

  // Extract exact dates (always try these)
  const datePatterns = [
    /(?:on|in)\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\s*[,:]?\s*([^.!?]+)/gi,
    /([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\s*[:\-]\s*([^.!?]+)/gi,
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

  // Enhanced relative timeline patterns (always extract these too)
  const relativePatterns = [
    // "within first X miles/days/months" 
    /within\s+(?:the\s+)?first\s+([^,]+?),?\s*(?:the\s+)?([^.!?]+)/gi,
    // Problem with repair attempts pattern: "Engine stalls (4 repair attempts over 2 months)"
    /([A-Za-z\s]+?)\s+(?:stalls?|fails?|slips?)[^(]*\((\d+)\s+repair\s+attempts?(?:\s+over\s+([^)]+))?\)/gi,
    // Total time pattern: "for a total of X days"
    /(?:for\s+)?(?:a\s+total\s+of\s+)?(\d+\s+days?)[^.]*?attempting\s+repairs?/gi,
    // "over X months/days" with context
    /over\s+(\d+\s+(?:days?|weeks?|months?))[^.]*?[,:]?\s*([^.!?]+)/gi,
    // Manager statements with attempt context
    /on\s+the\s+(\w+)\s+(?:engine\s+)?repair\s+attempt[^.]*?[,:]?\s*([^.!?]+)/gi,
    // Service manager quotes
    /"([^"]+)"/g
  ];
  
  for (const pattern of relativePatterns) {
    let match;
    while ((match = pattern.exec(caseSummary)) !== null) {
      if (pattern.source.includes('stalls?|fails?|slips?')) {
        // Create natural problem progression narrative
        const system = match[1]?.trim();
        const attempts = match[2];
        const timeframe = match[3]?.trim();
        
        if (system && attempts) {
          const problemDescription = system.toLowerCase().includes('engine') ? 'Engine begins stalling completely' :
                                   system.toLowerCase().includes('air conditioning') ? 'Air conditioning system fails' :
                                   system.toLowerCase().includes('transmission') ? 'Transmission starts slipping' :
                                   `${system} experiences serious problems`;
          
          const timeContext = timeframe ? ` over ${timeframe}` : '';
          const repairDescription = `Multiple repair attempts fail to fix ${system.toLowerCase()} (${attempts} attempts${timeContext})`;
          
          timeline.push({ 
            date: 'Problems Emerge', 
            event: problemDescription
          });
          timeline.push({ 
            date: 'Repair Efforts', 
            event: repairDescription
          });
        }
      } else if (pattern.source.includes('total.*days')) {
        // Create natural description of extended repair period
        const days = match[1]?.trim();
        if (days) {
          timeline.push({ 
            date: 'Extended Service', 
            event: `Despite ${days} in the dealership shop, problems persist`
          });
        }
      } else if (pattern.source.includes('repair\\s+attempt')) {
        // Handle specific repair attempt mentions naturally
        const attemptNumber = match[1]?.trim();
        const event = match[2]?.trim();
        if (attemptNumber && event && event.length > 10) {
          timeline.push({ 
            date: `During Repairs`, 
            event: `On the ${attemptNumber} repair attempt: ${event}`
          });
        }
      } else if (pattern.source.includes('"([^"]+)"')) {
        // Handle dealer admissions and statements
        const quote = match[1]?.trim();
        if (quote && quote.length > 15) {
          const isAdmission = quote.toLowerCase().includes('known') || 
                             quote.toLowerCase().includes('issue') ||
                             quote.toLowerCase().includes('problem');
          const eventType = isAdmission ? 'Dealer Admission' : 'Service Discussion';
          timeline.push({ 
            date: eventType, 
            event: `Service manager admits: "${quote}"`
          });
        }
      } else if (pattern.source.includes('first')) {
        // Handle early problem emergence
        const timeframe = match[1]?.trim();
        const event = match[2]?.trim();
        
        if (timeframe && event && event.length > 10) {
          timeline.push({ 
            date: 'Early Warning Signs', 
            event: `Within the first ${timeframe}, ${event.toLowerCase()}`
          });
        }
      } else {
        // Handle other patterns with natural flow
        const timeframe = match[1]?.trim();
        const event = match[2]?.trim();
        
        if (timeframe && event && event.length > 5) {
          timeline.push({ 
            date: 'Ongoing Issues', 
            event: `After ${timeframe}: ${event}`
          });
        }
      }
    }
  }

  // Extract settlement offers with natural language
  const offerPatterns = [
    /offers?\s+(?:her\s+)?(?:a\s+)?trade-in\s+value\s+of\s+\$?([\d,]+)/i,
    /trade-in\s+(?:value\s+)?(?:of\s+)?\$?([\d,]+)/i
  ];
  
  for (const pattern of offerPatterns) {
    const match = caseSummary.match(pattern);
    if (match) {
      const amount = match[1];
      timeline.push({ 
        date: 'Settlement Offered', 
        event: `Dealership offers significantly reduced trade-in value of $${amount}`
      });
      break;
    }
  }

  // Remove duplicates while preserving order
  const uniqueTimeline = timeline.filter((item, index, self) => 
    index === self.findIndex(t => 
      t.date === item.date && t.event === item.event
    )
  );
  
  // Sort timeline with natural flow logic
  const sortOrder = [
    'The Purchase',
    'Early Warning Signs',
    'Problems Emerge', 
    'Repair Efforts',
    'During Repairs',
    'Extended Service',
    'Dealer Admission',
    'Service Discussion',
    'Ongoing Issues',
    'Settlement Offered'
  ];
  
  uniqueTimeline.sort((a, b) => {
    const aIndex = sortOrder.findIndex(order => a.date.toLowerCase().includes(order.toLowerCase()));
    const bIndex = sortOrder.findIndex(order => b.date.toLowerCase().includes(order.toLowerCase()));
    
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  
  return uniqueTimeline.slice(0, 8);
};

// Parse core facts from case summary
export const parseCoreFacts = (caseSummary: string): string[] => {
  const facts: string[] = [];
  
  // Split into sentences and identify factual statements
  const sentences = caseSummary.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Enhanced fact categories with priority scoring
  const factCategories = [
    // Transaction details (high priority)
    { keywords: ['purchased', 'bought', 'acquired', 'paid', 'cost', '$'], priority: 5 },
    // Product/service details
    { keywords: ['model', 'year', 'brand', 'type', 'vehicle', 'truck', 'car'], priority: 4 },
    // Problems/defects (high priority)
    { keywords: ['problem', 'defect', 'fail', 'stall', 'issue', 'malfunction', 'broken'], priority: 5 },
    // Repair attempts (high priority for consumer cases)
    { keywords: ['repair', 'fix', 'attempt', 'service', 'mechanic', 'dealership'], priority: 5 },
    // Business acknowledgments (very high priority)
    { keywords: ['known to have', 'aware of', 'admits', 'acknowledges', 'tells'], priority: 6 },
    // Settlement/offers
    { keywords: ['offer', 'trade-in', 'settlement', 'refund', 'replace'], priority: 4 },
    // Legal elements
    { keywords: ['warranty', 'contract', 'agreement', 'guarantee', 'promise'], priority: 4 },
    // Damages/impact
    { keywords: ['damage', 'loss', 'injured', 'harm', 'impact'], priority: 3 },
    // Documentation
    { keywords: ['records', 'documented', 'evidence', 'proof'], priority: 3 }
  ];
  
  // Score and categorize sentences
  const scoredFacts = sentences.map(sentence => {
    const trimmed = sentence.trim();
    let score = 0;
    let categories = [];
    
    for (const category of factCategories) {
      const matches = category.keywords.filter(keyword => 
        trimmed.toLowerCase().includes(keyword.toLowerCase())
      );
      if (matches.length > 0) {
        score += category.priority * matches.length;
        categories.push(...matches);
      }
    }
    
    return { text: trimmed, score, categories };
  }).filter(fact => fact.score > 0);
  
  // Sort by score and extract top facts
  scoredFacts.sort((a, b) => b.score - a.score);
  
  // Ensure we capture different types of facts
  const selectedFacts = [];
  const usedCategories = new Set();
  
  for (const fact of scoredFacts) {
    if (selectedFacts.length >= 8) break;
    
    // Prioritize facts from different categories
    const newCategories = fact.categories.filter(cat => !usedCategories.has(cat));
    if (newCategories.length > 0 || selectedFacts.length < 3) {
      selectedFacts.push(fact.text);
      fact.categories.forEach(cat => usedCategories.add(cat));
    }
  }
  
  // If we still have fewer than 4 facts, add more regardless of category overlap
  if (selectedFacts.length < 4) {
    for (const fact of scoredFacts) {
      if (selectedFacts.length >= 8) break;
      if (!selectedFacts.includes(fact.text)) {
        selectedFacts.push(fact.text);
      }
    }
  }
  
  return selectedFacts.slice(0, 8);
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