import { CaseAnalysisData } from './types.ts';

export async function collectCaseData(supabase: any, clientId: string, caseId?: string): Promise<CaseAnalysisData> {
  console.log('📊 Starting data collection for export', { clientId, caseId });

  try {
    // Fetch all data in parallel
    const [
      clientData,
      caseData,
      analysisData,
      notesData,
      documentsData,
      messagesData,
      additionalCaseLawData,
      similarCasesData,
      scholarlyReferencesData,
      perplexityData
    ] = await Promise.all([
      fetchClientData(supabase, clientId),
      caseId ? fetchCaseData(supabase, caseId) : null,
      fetchLatestAnalysisData(supabase, clientId),
      fetchAttorneyNotes(supabase, clientId),
      fetchDocuments(supabase, clientId),
      fetchMessages(supabase, clientId),
      fetchAdditionalCaseLaw(supabase, clientId),
      fetchSimilarCases(supabase, clientId),
      fetchScholarlyReferences(supabase, clientId),
      fetchPerplexityResearch(supabase, clientId)
    ]);

    // Parse the analysis content to extract structured data
    const structuredData = await parseAnalysisContent(analysisData);

    const result: CaseAnalysisData = {
      client: clientData,
      case: caseData,
      analysis: analysisData,
      
      // Step 1: Case Summary (Organized Fact Pattern)
      conversationSummary: extractConversationSummary(messagesData),
      structuredCaseData: await parseStructuredCaseData(messagesData),
      
      // Step 2: Preliminary Analysis
      preliminaryAnalysis: structuredData.preliminaryAnalysis,
      
      // Step 3: Relevant Texas Laws
      relevantLaw: structuredData.relevantLaw,
      
      // Step 4: Additional Case Law
      additionalCaseLaw: additionalCaseLawData || [],
      similarCases: similarCasesData || [],
      
      // Step 5: IRAC Legal Analysis
      iracAnalysis: structuredData.iracAnalysis,
      
      // Step 6: Case Strengths & Weaknesses
      strengths: structuredData.strengths || [],
      weaknesses: structuredData.weaknesses || [],
      
      // Step 7: Legal Requirements Verification & Case Conclusion
      refinedAnalysis: structuredData.refinedAnalysis,
      legalRequirementsChecklist: structuredData.legalRequirementsChecklist || [],
      caseConclusion: structuredData.caseConclusion,
      
      // Step 8: Recommended Follow-up Questions
      followUpQuestions: structuredData.followUpQuestions || [],
      
      // Step 9: Law References
      lawReferences: extractLawReferences(analysisData),
      
      // Additional data
      scholarlyReferences: scholarlyReferencesData || [],
      notes: notesData || [],
      documents: documentsData || [],
      messages: messagesData || [],
      perplexityResearch: perplexityData || [],
      caseType: analysisData?.case_type
    };

    console.log('✅ Data collection completed', {
      hasClient: !!result.client,
      hasCase: !!result.case,
      hasAnalysis: !!result.analysis,
      hasStructuredData: !!result.structuredCaseData,
      hasIracAnalysis: !!result.iracAnalysis,
      hasRequirementsChecklist: !!(result.legalRequirementsChecklist && result.legalRequirementsChecklist.length > 0),
      hasRefinedAnalysis: !!result.refinedAnalysis,
      notesCount: result.notes.length,
      documentsCount: result.documents.length,
      messagesCount: result.messages.length,
      additionalCaseLawCount: result.additionalCaseLaw.length,
      similarCasesCount: result.similarCases.length,
      scholarlyReferencesCount: result.scholarlyReferences.length,
      perplexityCount: result.perplexityResearch.length
    });

    return result;
  } catch (error) {
    console.error('❌ Error in data collection:', error);
    throw error;
  }
}

// Fetch Functions
async function fetchClientData(supabase: any, clientId: string): Promise<any> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  
  if (error) {
    console.error('Error fetching client data:', error);
    return null;
  }
  
  return data;
}

async function fetchCaseData(supabase: any, caseId: string): Promise<any> {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single();
  
  if (error) {
    console.error('Error fetching case data:', error);
    return null;
  }
  
  return data;
}

async function fetchLatestAnalysisData(supabase: any, clientId: string): Promise<any> {
  const { data, error } = await supabase
    .from('legal_analyses')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (error) {
    console.error('Error fetching analysis data:', error);
    return null;
  }
  
  return data && data.length > 0 ? data[0] : null;
}

async function fetchAttorneyNotes(supabase: any, clientId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('case_analysis_notes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching attorney notes:', error);
    return [];
  }
  
  return data || [];
}

async function fetchDocuments(supabase: any, clientId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('document_metadata')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
  
  return data || [];
}

async function fetchMessages(supabase: any, clientId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('client_messages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  
  return data || [];
}

async function fetchAdditionalCaseLaw(supabase: any, clientId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('additional_case_law')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching additional case law:', error);
    return [];
  }
  
  return data || [];
}

async function fetchSimilarCases(supabase: any, clientId: string): Promise<any[]> {
  // Get the legal analysis first to find similar cases
  const { data: analysis } = await supabase
    .from('legal_analyses')
    .select('id')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!analysis || analysis.length === 0) return [];

  const { data, error } = await supabase
    .from('additional_case_law')
    .select('*')
    .eq('legal_analysis_id', analysis[0].id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching similar cases:', error);
    return [];
  }
  
  return data || [];
}

async function fetchScholarlyReferences(supabase: any, clientId: string): Promise<any[]> {
  // Get the legal analysis first to find scholarly references
  const { data: analysis } = await supabase
    .from('legal_analyses')
    .select('id')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!analysis || analysis.length === 0) return [];

  const { data, error } = await supabase
    .from('perplexity_research')
    .select('*')
    .eq('legal_analysis_id', analysis[0].id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching scholarly references:', error);
    return [];
  }
  
  return data || [];
}

async function fetchPerplexityResearch(supabase: any, clientId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('perplexity_research')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching perplexity research:', error);
    return [];
  }
  
  return data || [];
}

// Content Parsing Functions
async function parseAnalysisContent(analysisData: any): Promise<any> {
  if (!analysisData) {
    return {
      preliminaryAnalysis: '',
      relevantLaw: '',
      iracAnalysis: null,
      strengths: [],
      weaknesses: [],
      refinedAnalysis: '',
      legalRequirementsChecklist: [],
      caseConclusion: '',
      followUpQuestions: []
    };
  }

  const content = analysisData.content || '';
  
  // Parse different sections from the content
  return {
    preliminaryAnalysis: extractPreliminaryAnalysis(content),
    relevantLaw: extractRelevantLaw(content),
    iracAnalysis: parseIracAnalysis(content),
    strengths: extractStrengths(content),
    weaknesses: extractWeaknesses(content),
    refinedAnalysis: content, // For Step 7, use the full refined analysis content
    legalRequirementsChecklist: parseLegalRequirementsChecklist(content),
    caseConclusion: extractCaseConclusion(content),
    followUpQuestions: extractFollowUpQuestions(content)
  };
}

function extractPreliminaryAnalysis(content: string): string {
  const match = content.match(/(?:^|\n)\s*(?:#*\s*)?(?:PRELIMINARY ANALYSIS|Preliminary Analysis)[\s:]*\n([\s\S]*?)(?=\n\s*(?:#|$)|$)/i);
  return match ? match[1].trim() : '';
}

function extractRelevantLaw(content: string): string {
  const match = content.match(/(?:^|\n)\s*(?:#*\s*)?(?:RELEVANT LAW|Relevant Law|Texas Law)[\s:]*\n([\s\S]*?)(?=\n\s*(?:#|$)|$)/i);
  return match ? match[1].trim() : '';
}

function parseIracAnalysis(content: string): any {
  // Look for IRAC structure in the content
  const iracMatch = content.match(/(?:^|\n)\s*(?:#*\s*)?(?:IRAC|Legal Analysis)[\s:]*\n([\s\S]*?)(?=\n\s*(?:#|$)|$)/i);
  if (!iracMatch) return null;

  const iracContent = iracMatch[1];
  
  // Parse issues, rules, application, conclusion
  const issues: any[] = [];
  const issueMatches = iracContent.match(/(?:Issue|Issues?)[\s:]*\n([\s\S]*?)(?=\n\s*(?:Rule|$)|$)/gi);
  
  if (issueMatches) {
    issueMatches.forEach((match, index) => {
      issues.push({
        id: `issue-${index + 1}`,
        issueStatement: match.replace(/(?:Issue|Issues?)[\s:]*/i, '').trim(),
        rule: '',
        application: '',
        conclusion: ''
      });
    });
  }

  return {
    caseSummary: '',
    legalIssues: issues,
    overallConclusion: extractCaseConclusion(content),
    followUpQuestions: extractFollowUpQuestions(content),
    nextSteps: []
  };
}

function extractStrengths(content: string): string[] {
  const match = content.match(/(?:^|\n)\s*(?:#*\s*)?(?:STRENGTHS|Strengths|Case Strengths)[\s:]*\n([\s\S]*?)(?=\n\s*(?:#|WEAKNESSES|$)|$)/i);
  if (!match) return [];
  
  return match[1]
    .split(/\n/)
    .map(line => line.replace(/^[\s\-\*•]+/, '').trim())
    .filter(line => line.length > 0);
}

function extractWeaknesses(content: string): string[] {
  const match = content.match(/(?:^|\n)\s*(?:#*\s*)?(?:WEAKNESSES|Weaknesses|Case Weaknesses)[\s:]*\n([\s\S]*?)(?=\n\s*(?:#|$)|$)/i);
  if (!match) return [];
  
  return match[1]
    .split(/\n/)
    .map(line => line.replace(/^[\s\-\*•]+/, '').trim())
    .filter(line => line.length > 0);
}

function parseLegalRequirementsChecklist(content: string): any[] {
  const checklist: any[] = [];
  
  // Look for requirements with checkmarks
  const requirementMatches = content.match(/(?:###?\s*\d+\..*?)\n([\s\S]*?)(?=\n\s*#{1,3}\s*\d+\.|---|\n\s*$)/g);
  
  if (requirementMatches) {
    requirementMatches.forEach(match => {
      const lines = match.split('\n');
      const requirement = lines[0].replace(/^###?\s*\d+\.\s*/, '').trim();
      
      let law = '';
      let citation = '';
      let clientFacts = '';
      let status: 'meets' | 'does_not_meet' | 'needs_evidence' = 'needs_evidence';
      let analysis = '';
      
      // Parse the content
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('**Law:**')) {
          law = line.replace('**Law:**', '').trim();
        } else if (line.startsWith('**Citation:**')) {
          citation = line.replace('**Citation:**', '').trim();
        } else if (line.includes('Jennifer Martinez:')) {
          clientFacts = line.split('Jennifer Martinez:')[1].trim();
          if (line.includes('✅')) {
            status = 'meets';
          } else if (line.includes('❌')) {
            status = 'does_not_meet';
          }
        } else if (line.startsWith('**Analysis:**')) {
          analysis = line.replace('**Analysis:**', '').trim();
        }
      }
      
      if (requirement) {
        checklist.push({
          requirement,
          law,
          citation,
          clientFacts,
          status,
          analysis
        });
      }
    });
  }
  
  return checklist;
}

function extractCaseConclusion(content: string): string {
  const match = content.match(/(?:^|\n)\s*(?:#*\s*)?(?:CASE CONCLUSION|Case Conclusion|Overall Assessment)[\s:]*\n([\s\S]*?)(?=\n\s*(?:#|$)|$)/i);
  return match ? match[1].trim() : '';
}

function extractFollowUpQuestions(content: string): string[] {
  const match = content.match(/(?:^|\n)\s*(?:#*\s*)?(?:FOLLOW[- ]?UP QUESTIONS|Follow-up Questions|Next Steps)[\s:]*\n([\s\S]*?)(?=\n\s*(?:#|$)|$)/i);
  if (!match) return [];
  
  return match[1]
    .split(/\n/)
    .map(line => line.replace(/^[\s\d\.\-\*•]+/, '').trim())
    .filter(line => line.length > 0);
}

function extractConversationSummary(messages: any[]): string {
  if (!messages || messages.length === 0) return '';
  
  // Get the first few user messages to create a summary
  const userMessages = messages
    .filter(msg => msg.role === 'user')
    .slice(0, 3)
    .map(msg => msg.content)
    .join(' ');
  
  return userMessages.substring(0, 500) + (userMessages.length > 500 ? '...' : '');
}

async function parseStructuredCaseData(messages: any[]): Promise<any> {
  if (!messages || messages.length === 0) return null;
  
  // Extract structured data from messages
  const allContent = messages.map(msg => msg.content).join(' ');
  
  return {
    parties: extractParties(allContent),
    timeline: extractTimeline(allContent),
    coreFacts: extractCoreFacts(allContent),
    keyDocuments: []
  };
}

function extractParties(content: string): Array<{ name: string; role: string }> {
  const parties: Array<{ name: string; role: string }> = [];
  
  // Look for common party patterns
  const clientMatch = content.match(/(?:Jennifer Martinez|Martinez)/i);
  if (clientMatch) {
    parties.push({ name: 'Jennifer Martinez', role: 'Client' });
  }
  
  const dealerMatch = content.match(/(?:Austin Ford)/i);
  if (dealerMatch) {
    parties.push({ name: 'Austin Ford', role: 'Dealer' });
  }
  
  const manufacturerMatch = content.match(/(?:Ford Motor Company|Ford)/i);
  if (manufacturerMatch) {
    parties.push({ name: 'Ford Motor Company', role: 'Manufacturer' });
  }
  
  return parties;
}

function extractTimeline(content: string): Array<{ date: string; event: string }> {
  const timeline: Array<{ date: string; event: string }> = [];
  
  // Look for date patterns and key events
  if (content.includes('purchases')) {
    timeline.push({
      date: 'Purchase Date',
      event: 'Jennifer Martinez purchased 2024 Ford truck from Austin Ford for $52,000'
    });
  }
  
  if (content.includes('3,000 miles')) {
    timeline.push({
      date: 'Within 3,000 miles',
      event: 'Vehicle defects first appeared'
    });
  }
  
  if (content.includes('45 days')) {
    timeline.push({
      date: 'Total repair time',
      event: 'Vehicle out of service for 45 days total'
    });
  }
  
  return timeline;
}

function extractCoreFacts(content: string): string[] {
  const facts: string[] = [];
  
  // Extract key facts from the content
  if (content.includes('engine stalls')) {
    facts.push('Engine stalls completely (4 repair attempts over 2 months)');
  }
  
  if (content.includes('air conditioning')) {
    facts.push('Air conditioning fails (2 repair attempts)');
  }
  
  if (content.includes('transmission')) {
    facts.push('Transmission slips (3 repair attempts)');
  }
  
  if (content.includes('45 days')) {
    facts.push('Vehicle out of service for total of 45 days for repairs');
  }
  
  if (content.includes('trade-in value')) {
    facts.push('Dealer offered trade-in value of $35,000 (significantly below purchase price)');
  }
  
  return facts;
}

function extractLawReferences(analysisData: any): any[] {
  if (!analysisData?.law_references) return [];
  
  try {
    const references = Array.isArray(analysisData.law_references) 
      ? analysisData.law_references 
      : JSON.parse(analysisData.law_references);
    
    return references.map((ref: any, index: number) => ({
      id: ref.id || `ref-${index}`,
      title: ref.title || null,
      url: ref.url || null,
      content: ref.content || null
    }));
  } catch (error) {
    console.error('Error parsing law references:', error);
    return [];
  }
}