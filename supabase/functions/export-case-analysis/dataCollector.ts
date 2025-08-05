
import type { CaseAnalysisData } from './types.ts';
import { 
  extractAnalysisSections, 
  extractStrengthsWeaknesses, 
  calculatePredictionPercentages,
  detectCaseType 
} from './analysisParsingUtils.ts';

export async function collectCaseData(supabase: any, clientId: string, caseId?: string): Promise<CaseAnalysisData> {
  console.log('Collecting case data for:', { clientId, caseId })

  // Get client information
  const client = await fetchClientData(supabase, clientId)
  
  // Get case information if provided
  const caseData = caseId ? await fetchCaseData(supabase, caseId) : null

  // Get legal analysis
  const analysisData = await fetchAnalysisData(supabase, clientId, caseId)

  // Parse analysis content if available
  let parsedAnalysis = null
  if (analysisData?.content) {
    const caseType = detectCaseType(analysisData.content)
    const analysisSections = extractAnalysisSections(analysisData.content)
    const strengthsWeaknesses = extractStrengthsWeaknesses(analysisData.content, caseType)
    const outcomePercentages = calculatePredictionPercentages(analysisData.content, strengthsWeaknesses, caseType)
    
    parsedAnalysis = {
      relevantLaw: analysisSections.relevantLaw,
      preliminaryAnalysis: analysisSections.preliminaryAnalysis,
      potentialIssues: analysisSections.potentialIssues,
      followUpQuestions: analysisSections.followUpQuestions,
      strengths: strengthsWeaknesses.strengths,
      weaknesses: strengthsWeaknesses.weaknesses,
      outcomeDefense: outcomePercentages.defense,
      outcomeProsecution: outcomePercentages.prosecution,
      caseType: caseType
    }
  }

  // Get similar cases if analysis exists
  const similarCases = analysisData ? await fetchSimilarCases(supabase, analysisData.id) : []

  // Get scholarly references if analysis exists
  const scholarlyReferences = analysisData ? await fetchScholarlyReferences(supabase, analysisData.id) : []

  // Get attorney notes
  const notes = await fetchAttorneyNotes(supabase, clientId)

  // Get client documents
  const documents = await fetchClientDocuments(supabase, clientId, caseId)

  // Get conversation messages
  const messages = await fetchConversationMessages(supabase, clientId, caseId)

  // Get perplexity research data (additional case law)
  const perplexityResearch = analysisData ? await fetchPerplexityResearch(supabase, clientId, analysisData.id) : []

  // Get additional case law from the new table
  const additionalCaseLaw = await fetchAdditionalCaseLaw(supabase, clientId)

  console.log('Data collection complete:', {
    hasClient: !!client,
    hasCase: !!caseData,
    hasAnalysis: !!analysisData,
    similarCasesCount: similarCases.length,
    scholarlyReferencesCount: scholarlyReferences.length,
    notesCount: notes.length,
    documentsCount: documents.length,
    messagesCount: messages.length,
    perplexityResearchCount: perplexityResearch.length,
    additionalCaseLawCount: additionalCaseLaw.length
  })

  return {
    client,
    case: caseData,
    analysis: analysisData,
    parsedAnalysis,
    similarCases,
    scholarlyReferences,
    notes,
    documents,
    messages,
    perplexityResearch,
    additionalCaseLaw
  }
}

async function fetchClientData(supabase: any, clientId: string) {
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()
  return client
}

async function fetchCaseData(supabase: any, caseId: string) {
  const { data: caseResult } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single()
  return caseResult
}

async function fetchAnalysisData(supabase: any, clientId: string, caseId?: string) {
  console.log('Fetching analysis data for client:', clientId, 'case:', caseId)
  
  let analysisQuery = supabase
    .from('legal_analyses')
    .select('*')
    .eq('client_id', clientId)

  if (caseId) {
    analysisQuery = analysisQuery.eq('case_id', caseId)
  }
  // When no caseId is provided, get the most recent analysis regardless of case_id
  // This fixes the issue where we were filtering for case_id IS NULL

  const { data: analysis } = await analysisQuery
    .order('created_at', { ascending: false })
    .limit(1)

  const result = analysis && analysis.length > 0 ? analysis[0] : null
  console.log('Found analysis:', result ? `ID: ${result.id}, case_id: ${result.case_id}` : 'None')
  return result
}

async function fetchSimilarCases(supabase: any, analysisId: string) {
  // First try to get similar cases for the specific analysis
  let { data: similarCasesData } = await supabase
    .from('similar_cases')
    .select('*')
    .eq('legal_analysis_id', analysisId)
    .order('created_at', { ascending: false })
    .limit(1)

  // If no data found for this analysis, try to get any similar cases for this client
  if (!similarCasesData || similarCasesData.length === 0) {
    const { data: clientAnalysis } = await supabase
      .from('legal_analyses')
      .select('client_id')
      .eq('id', analysisId)
      .single()
    
    if (clientAnalysis?.client_id) {
      const { data: fallbackData } = await supabase
        .from('similar_cases')
        .select('*')
        .eq('client_id', clientAnalysis.client_id)
        .order('created_at', { ascending: false })
        .limit(1)
      
      similarCasesData = fallbackData
    }
  }

  console.log('Similar cases data:', similarCasesData)
  return (similarCasesData && similarCasesData.length > 0) ? 
    (similarCasesData[0].case_data || []) : []
}

async function fetchScholarlyReferences(supabase: any, analysisId: string) {
  // First try to get scholarly references for the specific analysis
  let { data: scholarlyData } = await supabase
    .from('scholarly_references')
    .select('*')
    .eq('legal_analysis_id', analysisId)
    .order('created_at', { ascending: false })
    .limit(1)

  // If no data found for this analysis, try to get any scholarly references for this client
  if (!scholarlyData || scholarlyData.length === 0) {
    const { data: clientAnalysis } = await supabase
      .from('legal_analyses')
      .select('client_id')
      .eq('id', analysisId)
      .single()
    
    if (clientAnalysis?.client_id) {
      const { data: fallbackData } = await supabase
        .from('scholarly_references')
        .select('*')
        .eq('client_id', clientAnalysis.client_id)
        .order('created_at', { ascending: false })
        .limit(1)
      
      scholarlyData = fallbackData
    }
  }

  console.log('Scholarly references data:', scholarlyData)
  return (scholarlyData && scholarlyData.length > 0) ? 
    (scholarlyData[0].reference_data || []) : []
}

async function fetchAttorneyNotes(supabase: any, clientId: string) {
  const { data: notes } = await supabase
    .from('case_analysis_notes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  return notes || []
}

async function fetchClientDocuments(supabase: any, clientId: string, caseId?: string) {
  let documentsQuery = supabase
    .from('document_metadata')
    .select('*')
    .eq('client_id', clientId)

  if (caseId) {
    documentsQuery = documentsQuery.eq('case_id', caseId)
  }

  const { data: documents } = await documentsQuery
    .order('created_at', { ascending: false })

  return documents || []
}

async function fetchConversationMessages(supabase: any, clientId: string, caseId?: string) {
  let messagesQuery = supabase
    .from('client_messages')
    .select('*')
    .eq('client_id', clientId)

  if (caseId) {
    messagesQuery = messagesQuery.eq('case_id', caseId)
  }

  const { data: messages } = await messagesQuery
    .order('created_at', { ascending: true })

  return messages || []
}

async function fetchPerplexityResearch(supabase: any, clientId: string, analysisId: string) {
  const { data: researchData } = await supabase
    .from('perplexity_research')
    .select('*')
    .eq('client_id', clientId)
    .eq('legal_analysis_id', analysisId)
    .order('created_at', { ascending: false })

  return researchData || []
}

async function fetchAdditionalCaseLaw(supabase: any, clientId: string) {
  const { data: caseLawData } = await supabase
    .from('additional_case_law')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  return caseLawData || []
}
