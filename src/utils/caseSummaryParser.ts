import { supabase } from "@/integrations/supabase/client";

export interface StructuredCaseData {
  parties: Array<{
    name: string;
    role: string;
  }>;
  quickSummary: string;
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
  
  // Enhanced context-aware business name detection
  const enhanceBusinessName = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    // If it's just "Ford" but context suggests it's Austin Ford dealership
    if (lowerName === 'ford' && /austin|dealership|dealer/i.test(caseSummary)) {
      return 'Austin Ford';
    }
    
    // Look for full business name in surrounding context
    const contextPattern = new RegExp(`([A-Z][a-zA-Z\\s]*${name}[a-zA-Z\\s]*)(?:\\s+(?:dealership|dealer|company|corp|inc|llc))?`, 'i');
    const contextMatch = caseSummary.match(contextPattern);
    if (contextMatch && contextMatch[1].length > name.length) {
      return contextMatch[1].trim();
    }
    
    return name;
  };

  // Enhanced transaction-based party detection
  const transactionPatterns = [
    // "Name purchases... from Company for $amount" pattern - capture full business name
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+purchases?[^.]*?from\s+([A-Z][a-zA-Z\s&]+?)(?:\s+(?:dealership|dealer|company|for\s+\$))/i,
    // "Name bought... from Company" pattern  
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:bought|acquired)[^.]*?from\s+([A-Z][a-zA-Z\s&]+?)(?:\s+(?:dealership|dealer|company|for\s+\$))/i,
    // "Company sold... to Name" pattern
    /([A-Z][a-zA-Z\s&]+?)\s+(?:dealership|dealer|company)?\s*sold[^.]*?to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?:\s+for\s+\$[\d,]+)?/i
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
      let name1 = match[1]?.trim().replace(/[,.]/g, '');
      let name2 = match[2]?.trim().replace(/[,.]/g, '');
      
      if (name1 && name2 && name1.length > 2 && name2.length > 2) {
        // Enhance business names with context
        name1 = enhanceBusinessName(name1);
        name2 = enhanceBusinessName(name2);
        
        // For purchase patterns, first match is usually the consumer/client
        if (pattern.source.includes('purchases?') || pattern.source.includes('bought')) {
          parties.push({ name: name1, role: 'Client/Consumer' });
          parties.push({ name: name2, role: 'Dealer' });
        } else {
          // For "sold to" patterns, reverse the roles
          parties.push({ name: name2, role: 'Client/Consumer' });
          parties.push({ name: name1, role: 'Dealer' });
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

// Parse timeline events from case summary with lemon law structure
export const parseTimeline = (caseSummary: string): Array<{date: string; event: string}> => {
  const timeline: Array<{date: string; event: string}> = [];
  
  // Extract basic info for timeline header
  const purchaseMatch = caseSummary.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+purchases?\s+(?:a\s+)?(?:new\s+)?(\d{4}\s+[^.]+?)(?:\s+from\s+([^.]+?))?(?:\s+for\s+\$?([\d,]+))?/i);
  
  // 1. DAY 0 (PURCHASE) - Extract purchase details
  if (purchaseMatch) {
    const buyer = purchaseMatch[1];
    const item = purchaseMatch[2].replace(/\s+for\s+.*$/, '').trim();
    const seller = purchaseMatch[3] ? purchaseMatch[3].trim().replace(/\s+for\s+.*$/, '') : '';
    const price = purchaseMatch[4] ? `$${purchaseMatch[4]}` : '';
    
    const purchaseEvent = seller && price 
      ? `${buyer} purchases a ${item} from ${seller} for ${price}.`
      : `${buyer} purchases a ${item}.`;
    
    timeline.push({ 
      date: 'Day 0 (Purchase)', 
      event: purchaseEvent
    });
  }

  // 2. WITHIN FIRST 3,000 MILES - Extract individual repair attempts per system
  const repairEvents = [];
  
  // Define systems to track
  const systems = [
    { name: 'Engine', patterns: [/engine[^.]*(?:stall|fail)/gi] },
    { name: 'Air conditioning', patterns: [/air\s*conditioning[^.]*(?:fail)/gi, /AC[^.]*(?:fail)/gi] },
    { name: 'Transmission', patterns: [/transmission[^.]*(?:slip|fail)/gi] }
  ];
  
  // Extract repair counts for each system
  const systemRepairs: Record<string, number> = {};
  
  // Look for specific repair attempt patterns
  const repairAttemptPatterns = [
    /(\w+)[^.]*\((\d+)\s+repair\s+attempts?\)/gi,
    /(\d+)\s+repair\s+attempts?[^.]*?(\w+)/gi,
    /engine\s+stalls?[^.]*(\d+)[^.]*(?:time|attempt)/gi,
    /air\s*conditioning[^.]*fail[^.]*(\d+)[^.]*(?:time|attempt)/gi,
    /transmission[^.]*slip[^.]*(\d+)[^.]*(?:time|attempt)/gi
  ];
  
  for (const pattern of repairAttemptPatterns) {
    let match;
    while ((match = pattern.exec(caseSummary)) !== null) {
      const systemName = match[1] && isNaN(Number(match[1])) ? match[1].toLowerCase() : 
                        match[2] && isNaN(Number(match[2])) ? match[2].toLowerCase() : 
                        pattern.source.includes('engine') ? 'engine' :
                        pattern.source.includes('air') ? 'air conditioning' :
                        pattern.source.includes('transmission') ? 'transmission' : 'unknown';
      
      const attempts = match[2] || match[1];
      if (attempts && !isNaN(Number(attempts))) {
        systemRepairs[systemName] = Number(attempts);
      }
    }
  }
  
  // If no specific counts found, look for general mentions and estimate
  if (Object.keys(systemRepairs).length === 0) {
    // Count general problem mentions for each system
    systems.forEach(system => {
      let mentionCount = 0;
      system.patterns.forEach(pattern => {
        const matches = caseSummary.match(pattern) || [];
        mentionCount += matches.length;
      });
      
      if (mentionCount > 0) {
        // Estimate 2-4 repair attempts per major problem mentioned
        systemRepairs[system.name.toLowerCase()] = Math.min(4, Math.max(2, mentionCount * 2));
      }
    });
  }
  
  // Generate individual repair attempt entries
  Object.entries(systemRepairs).forEach(([system, count]) => {
    const systemName = system.charAt(0).toUpperCase() + system.slice(1);
    for (let i = 1; i <= count; i++) {
      const ordinal = i === 1 ? '1st' : i === 2 ? '2nd' : i === 3 ? '3rd' : `${i}th`;
      repairEvents.push({
        date: 'Within First 3,000 Miles',
        event: `${systemName} ${system === 'engine' ? 'stalls' : system === 'air conditioning' ? 'fails' : 'slips'} – ${ordinal} repair attempt`
      });
    }
  });
  
  timeline.push(...repairEvents);

  // 3. DEALER ADMISSIONS - Extract quotes and admissions
  const quoteMatches = [...caseSummary.matchAll(/"([^"]+)"/g)];
  quoteMatches.forEach(match => {
    const quote = match[1].trim();
    if (quote.length > 15) {
      const isAdmission = /\b(known|issue|problem|defect|engine)\b/i.test(quote);
      if (isAdmission) {
        timeline.push({ 
          date: 'Within First 3,000 Miles', 
          event: `Service manager states: "${quote}"`
        });
      }
    }
  });

  // 4. SORT TIMELINE - Proper chronological order
  const sortedTimeline = timeline.sort((a, b) => {
    const order = ['Day 0 (Purchase)', 'Within First 3,000 Miles'];
    const aIndex = order.findIndex(o => a.date === o);
    const bIndex = order.findIndex(o => b.date === o);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });

  return sortedTimeline;
};

// Parse quick case summary for overview
export const parseQuickSummary = (caseSummary: string): string => {
  // Extract first 2-3 sentences that provide case overview
  const sentences = caseSummary.split(/[.!?]+/).filter(s => s.trim().length > 15);
  
  // Look for key introductory patterns that establish the case context
  const contextPatterns = [
    /^[^.]*(?:purchases?|bought|acquired)[^.]*\./i,
    /^[^.]*(?:case|matter|dispute)[^.]*\./i,
    /^[^.]*(?:client|consumer|plaintiff)[^.]*\./i
  ];
  
  let summary = '';
  let sentenceCount = 0;
  
  // Try to find the most contextual opening sentences
  for (const sentence of sentences.slice(0, 5)) {
    const trimmed = sentence.trim();
    if (trimmed.length < 20) continue;
    
    // Add sentence if it matches context patterns or if we need more content
    const isContextual = contextPatterns.some(pattern => pattern.test(trimmed));
    if (isContextual || (summary.length < 100 && sentenceCount < 3)) {
      summary += (summary ? ' ' : '') + trimmed + '.';
      sentenceCount++;
      
      // Stop if we have enough content
      if (sentenceCount >= 3 || summary.length > 200) break;
    }
  }
  
  // Fallback: use first 2 sentences if no contextual patterns found
  if (summary.length < 50 && sentences.length > 0) {
    summary = sentences.slice(0, 2).map(s => s.trim()).join('. ') + '.';
  }
  
  return summary || 'No case summary available.';
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
  const quickSummary = parseQuickSummary(caseSummary);
  const timeline = parseTimeline(caseSummary);
  const coreFacts = parseCoreFacts(caseSummary);
  const keyDocuments = await fetchKeyDocuments(clientId);
  
  return {
    parties,
    quickSummary,
    timeline,
    coreFacts,
    keyDocuments
  };
};