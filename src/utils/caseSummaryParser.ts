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

// Parse timeline events from case summary with quality control
export const parseTimeline = (caseSummary: string): Array<{date: string; event: string}> => {
  const timeline: Array<{date: string; event: string}> = [];
  
  // 1. TRANSACTION EVENTS - Extract purchase/transaction information
  const purchaseMatch = caseSummary.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+purchases?\s+(?:a\s+)?(?:new\s+)?(\d{4}\s+[^.]+?)(?:\s+from\s+([^.]+?))?(?:\s+for\s+\$?([\d,]+))?/i);
  if (purchaseMatch) {
    const buyer = purchaseMatch[1];
    const item = purchaseMatch[2].replace(/\s+for\s+.*$/, '').trim();
    const seller = purchaseMatch[3] ? ` from ${purchaseMatch[3].trim()}` : '';
    const price = purchaseMatch[4] ? ` for $${purchaseMatch[4]}` : '';
    timeline.push({ 
      date: 'Purchase Transaction', 
      event: `${buyer} purchases ${item}${seller}${price}` 
    });
  }

  // 2. PROBLEM IDENTIFICATION - Parse multi-system problems systematically
  const problemSystems = [
    { pattern: /engine[^.]*(?:stall|fail|defect|problem)/i, name: 'Engine', description: 'Engine begins stalling completely during operation' },
    { pattern: /air\s+conditioning[^.]*(?:fail|defect|problem)/i, name: 'Air Conditioning', description: 'Air conditioning system fails to function properly' },
    { pattern: /transmission[^.]*(?:slip|fail|defect|problem)/i, name: 'Transmission', description: 'Transmission starts slipping during gear changes' }
  ];
  
  const identifiedProblems = [];
  for (const system of problemSystems) {
    if (system.pattern.test(caseSummary)) {
      identifiedProblems.push({
        system: system.name,
        description: system.description
      });
    }
  }
  
  // Add problem emergence event
  if (identifiedProblems.length > 0) {
    const problemList = identifiedProblems.map(p => p.system.toLowerCase()).join(', ');
    timeline.push({ 
      date: 'Problems Emerge', 
      event: `Multiple serious problems develop with the vehicle's ${problemList} systems`
    });
  }

  // 3. REPAIR ATTEMPTS - Extract specific repair attempt data
  const repairPatterns = [
    /(\w+)[^.]*\((\d+)\s+repair\s+attempts?(?:\s+over\s+([^)]+))?\)/gi,
    /(\d+)\s+repair\s+attempts?[^.]*?(\w+)/gi
  ];
  
  const repairData = [];
  for (const pattern of repairPatterns) {
    let match;
    while ((match = pattern.exec(caseSummary)) !== null) {
      const system = (match[1] && isNaN(Number(match[1]))) ? match[1] : (match[2] && isNaN(Number(match[2]))) ? match[2] : 'vehicle';
      const attempts = match[2] || match[1];
      const timeframe = match[3] || '';
      
      if (attempts && !isNaN(Number(attempts))) {
        repairData.push({
          system: system.toLowerCase(),
          attempts: Number(attempts),
          timeframe: timeframe.trim()
        });
      }
    }
  }
  
  // Create repair attempt events
  repairData.forEach(repair => {
    const systemName = repair.system.charAt(0).toUpperCase() + repair.system.slice(1);
    const timeContext = repair.timeframe ? ` over ${repair.timeframe}` : '';
    timeline.push({ 
      date: 'Repair Attempts', 
      event: `${systemName} requires ${repair.attempts} unsuccessful repair attempts${timeContext}`
    });
  });

  // 4. EXTENDED SERVICE TIME
  const serviceTimeMatch = caseSummary.match(/(?:for\s+)?(?:a\s+total\s+of\s+)?(\d+\s+days?)[^.]*?(?:shop|service|attempting|repair)/i);
  if (serviceTimeMatch) {
    const days = serviceTimeMatch[1];
    timeline.push({ 
      date: 'Extended Service Period', 
      event: `Vehicle spends ${days} in the dealership service department with ongoing problems`
    });
  }

  // 5. DEALER ADMISSIONS - Extract quotes and admissions
  const quoteMatches = [...caseSummary.matchAll(/"([^"]+)"/g)];
  quoteMatches.forEach(match => {
    const quote = match[1].trim();
    if (quote.length > 15) {
      const isAdmission = /\b(known|issue|problem|defect|engine)\b/i.test(quote);
      if (isAdmission) {
        timeline.push({ 
          date: 'Dealer Admission', 
          event: `Service manager admits vehicle defects: "${quote}"`
        });
      }
    }
  });

  // 6. SETTLEMENT OFFERS
  const settlementMatch = caseSummary.match(/(?:offers?|trade-in\s+value)[^.]*?\$?([\d,]+)/i);
  if (settlementMatch) {
    const amount = settlementMatch[1];
    timeline.push({ 
      date: 'Settlement Offer', 
      event: `Dealership offers reduced trade-in value of $${amount} despite ongoing defects`
    });
  }

  // 7. QUALITY CONTROL - Validate and clean timeline entries
  const validatedTimeline = timeline.filter(entry => {
    // Remove entries that are too short or meaningless
    if (!entry.event || entry.event.length < 20) return false;
    
    // Remove entries with incomplete thoughts (fragments)
    if (entry.event.match(/^(within|after|during|over)\s+[^.]*$/i)) return false;
    
    // Ensure entries are complete sentences
    if (!entry.event.match(/[.!?]$/) && entry.event.length > 0) {
      entry.event += '.';
    }
    
    return true;
  });

  // 8. LOGICAL SEQUENCING - Sort events in narrative order
  const sequenceOrder = [
    'Purchase Transaction',
    'Problems Emerge', 
    'Repair Attempts',
    'Extended Service Period',
    'Dealer Admission',
    'Settlement Offer'
  ];
  
  validatedTimeline.sort((a, b) => {
    const aIndex = sequenceOrder.findIndex(seq => a.date.includes(seq));
    const bIndex = sequenceOrder.findIndex(seq => b.date.includes(seq));
    
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // 9. FINAL VALIDATION - Ensure minimum timeline completeness
  if (validatedTimeline.length < 3) {
    // Extract any substantial sentences as fallback events
    const sentences = caseSummary.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 30 && s.length < 150)
      .slice(0, 3);
    
    sentences.forEach((sentence, index) => {
      if (!validatedTimeline.some(t => t.event.includes(sentence.substring(0, 20)))) {
        validatedTimeline.push({
          date: `Case Development ${index + 1}`,
          event: sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.'
        });
      }
    });
  }

  return validatedTimeline.slice(0, 7);
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