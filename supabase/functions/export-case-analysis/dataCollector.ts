import type { CaseAnalysisData } from './types.ts';
import { 
  extractAnalysisSections, 
  extractStrengthsWeaknesses, 
  calculatePredictionPercentages,
  detectCaseType 
} from './analysisParsingUtils.ts';

export async function collectCaseData(supabase: any, clientId: string, caseId?: string): Promise<CaseAnalysisData> {
  console.log('📊 Starting data collection for export', { clientId, caseId })

  try {
    // Fetch all data in parallel
    const [
      client,
      caseData,
      analysisData,
      notes,
      documents,
      messages,
      additionalCaseLaw
    ] = await Promise.all([
      fetchClientData(supabase, clientId),
      caseId ? fetchCaseData(supabase, caseId) : null,
      fetchAnalysisData(supabase, clientId, caseId),
      fetchAttorneyNotes(supabase, clientId),
      fetchClientDocuments(supabase, clientId, caseId),
      fetchConversationMessages(supabase, clientId, caseId),
      fetchAdditionalCaseLaw(supabase, clientId)
    ])

    // Fetch related analysis data if available
    let similarCases: any[] = []
    let scholarlyReferences: any[] = []
    let perplexityResearch: any[] = []
    
    if (analysisData) {
      const [similar, scholarly, perplexity] = await Promise.all([
        fetchSimilarCases(supabase, analysisData.id),
        fetchScholarlyReferences(supabase, analysisData.id),
        fetchPerplexityResearch(supabase, clientId, analysisData.id)
      ])
      similarCases = similar
      scholarlyReferences = scholarly
      perplexityResearch = perplexity
    }

    // Parse structured data from various sources
    let parsedAnalysis = null
    let iracAnalysis = null
    let legalRequirementsChecklist = null
    let structuredCaseData = null
    
    if (analysisData?.content) {
      try {
        const caseType = detectCaseType(analysisData.content)
        const analysisSections = extractAnalysisSections(analysisData.content)
        const strengthsWeaknesses = extractStrengthsWeaknesses(analysisData.content, caseType)
        
        parsedAnalysis = {
          relevantLaw: analysisSections.relevantLaw,
          preliminaryAnalysis: analysisSections.preliminaryAnalysis,
          potentialIssues: analysisSections.potentialIssues,
          followUpQuestions: analysisSections.followUpQuestions,
          strengths: strengthsWeaknesses.strengths,
          weaknesses: strengthsWeaknesses.weaknesses,
          caseType: caseType
        }
        
        // Parse modern structured analysis formats
        iracAnalysis = parseIracAnalysis(analysisData.content)
        legalRequirementsChecklist = parseLegalRequirementsChecklist(analysisData.content)
      } catch (error) {
        console.warn('Failed to parse analysis content:', error)
      }
    }

    // Parse structured case data from conversation
    if (messages.length > 0) {
      try {
        structuredCaseData = parseStructuredCaseData(messages)
      } catch (error) {
        console.warn('Failed to parse structured case data:', error)
      }
    }

    // Fetch refined analysis and follow-up questions from separate tables
    const refinedAnalysis = await fetchRefinedAnalysis(supabase, clientId, analysisData?.id)
    const followUpQuestionsData = await fetchFollowUpQuestions(supabase, clientId, analysisData?.id)

    const result: CaseAnalysisData = {
      client,
      case: caseData,
      analysis: analysisData,
      
      // Step-by-step data structure
      conversationSummary: extractConversationSummary(messages),
      structuredCaseData,
      preliminaryAnalysis: parsedAnalysis?.preliminaryAnalysis,
      relevantLaw: parsedAnalysis?.relevantLaw,
      additionalCaseLaw,
      similarCases,
      iracAnalysis,
      strengths: parsedAnalysis?.strengths || [],
      weaknesses: parsedAnalysis?.weaknesses || [],
      refinedAnalysis: refinedAnalysis?.content,
      legalRequirementsChecklist,
      caseConclusion: extractCaseConclusion(refinedAnalysis?.content),
      followUpQuestions: followUpQuestionsData?.questions || parsedAnalysis?.followUpQuestions || [],
      lawReferences: extractLawReferences(analysisData),
      
      // Legacy data
      parsedAnalysis,
      scholarlyReferences,
      notes,
      documents,
      messages,
      perplexityResearch,
      caseType: analysisData?.case_type
    }

    console.log('✅ Data collection completed', {
      hasClient: !!client,
      hasCase: !!caseData,
      hasAnalysis: !!analysisData,
      hasStructuredData: !!structuredCaseData,
      hasIracAnalysis: !!iracAnalysis,
      hasRequirementsChecklist: !!legalRequirementsChecklist,
      hasRefinedAnalysis: !!refinedAnalysis,
      notesCount: notes.length,
      documentsCount: documents.length,
      messagesCount: messages.length,
      additionalCaseLawCount: additionalCaseLaw.length,
      similarCasesCount: similarCases.length,
      scholarlyReferencesCount: scholarlyReferences.length,
      perplexityCount: perplexityResearch.length
    })

    return result

  } catch (error) {
    console.error('❌ Data collection failed:', error)
    throw error
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
  let query = supabase
    .from('legal_analyses')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (caseId) {
    query = query.eq('case_id', caseId)
  }

  const { data: analyses } = await query.limit(1)
  return analyses && analyses.length > 0 ? analyses[0] : null
}

async function fetchSimilarCases(supabase: any, analysisId: string) {
  // First try to get similar cases specifically for this analysis
  let { data: similarCases } = await supabase
    .from('similar_cases')
    .select('*')
    .eq('legal_analysis_id', analysisId)

  if (!similarCases || similarCases.length === 0) {
    // Fallback: get recent similar cases for the client
    const { data: analysis } = await supabase
      .from('legal_analyses')
      .select('client_id')
      .eq('id', analysisId)
      .single()

    if (analysis) {
      const { data: fallbackCases } = await supabase
        .from('similar_cases')
        .select('*')
        .eq('client_id', analysis.client_id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      similarCases = fallbackCases || []
    }
  }

  return similarCases || []
}

async function fetchScholarlyReferences(supabase: any, analysisId: string) {
  // First try to get scholarly references specifically for this analysis
  let { data: scholarlyRefs } = await supabase
    .from('scholarly_references')
    .select('*')
    .eq('legal_analysis_id', analysisId)

  if (!scholarlyRefs || scholarlyRefs.length === 0) {
    // Fallback: get recent scholarly references for the client
    const { data: analysis } = await supabase
      .from('legal_analyses')
      .select('client_id')
      .eq('id', analysisId)
      .single()

    if (analysis) {
      const { data: fallbackRefs } = await supabase
        .from('scholarly_references')
        .select('*')
        .eq('client_id', analysis.client_id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      scholarlyRefs = fallbackRefs || []
    }
  }

  return scholarlyRefs || []
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
  let query = supabase
    .from('document_metadata')
    .select('*')
    .eq('client_id', clientId)

  if (caseId) {
    query = query.or(`case_id.eq.${caseId},case_id.is.null`)
  }

  const { data: documents } = await query.order('created_at', { ascending: false })
  return documents || []
}

async function fetchConversationMessages(supabase: any, clientId: string, caseId?: string) {
  let query = supabase
    .from('client_messages')
    .select('*')
    .eq('client_id', clientId)

  if (caseId) {
    query = query.or(`case_id.eq.${caseId},case_id.is.null`)
  }

  const { data: messages } = await query.order('created_at', { ascending: true })
  return messages || []
}

async function fetchPerplexityResearch(supabase: any, clientId: string, analysisId: string) {
  const { data: research } = await supabase
    .from('perplexity_research')
    .select('*')
    .eq('client_id', clientId)
    .eq('legal_analysis_id', analysisId)
    .order('created_at', { ascending: false })
  
  return research || []
}

async function fetchAdditionalCaseLaw(supabase: any, clientId: string) {
  const { data: caseLaw } = await supabase
    .from('additional_case_law')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  
  return caseLaw || []
}

async function fetchRefinedAnalysis(supabase: any, clientId: string, analysisId?: string) {
  if (!analysisId) return null
  
  const { data: refined } = await supabase
    .from('legal_analyses')
    .select('refined_content')
    .eq('id', analysisId)
    .single()
    
  return refined?.refined_content ? { content: refined.refined_content } : null
}

async function fetchFollowUpQuestions(supabase: any, clientId: string, analysisId?: string) {
  if (!analysisId) return null
  
  const { data: questions } = await supabase
    .from('legal_analyses')
    .select('follow_up_questions_raw')
    .eq('id', analysisId)
    .single()
    
  return questions?.follow_up_questions_raw ? { questions: questions.follow_up_questions_raw.split('\n') } : null
}

// Parse IRAC Analysis from content
function parseIracAnalysis(content: string): any {
  const iracMatch = content.match(/\*\*IRAC ANALYSIS:\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:\*\*|$)/i)
  if (!iracMatch) return null

  const iracContent = iracMatch[1].trim()
  const issues = []
  
  // Extract individual issues
  const issueMatches = iracContent.match(/Issue \d+:([\s\S]*?)(?=Issue \d+:|$)/gi)
  if (issueMatches) {
    issueMatches.forEach((issueBlock, index) => {
      const issue = {
        id: `issue-${index + 1}`,
        issueStatement: '',
        rule: '',
        application: '',
        conclusion: '',
        category: '',
        strength: 'moderate' as const
      }
      
      const issueMatch = issueBlock.match(/Issue:([\s\S]*?)(?=Rule:|$)/i)
      if (issueMatch) issue.issueStatement = issueMatch[1].trim()
      
      const ruleMatch = issueBlock.match(/Rule:([\s\S]*?)(?=Application:|$)/i)
      if (ruleMatch) issue.rule = ruleMatch[1].trim()
      
      const appMatch = issueBlock.match(/Application:([\s\S]*?)(?=Conclusion:|$)/i)
      if (appMatch) issue.application = appMatch[1].trim()
      
      const concMatch = issueBlock.match(/Conclusion:([\s\S]*?)$/i)
      if (concMatch) issue.conclusion = concMatch[1].trim()
      
      issues.push(issue)
    })
  }
  
  return {
    caseSummary: '',
    legalIssues: issues,
    overallConclusion: '',
    followUpQuestions: [],
    nextSteps: []
  }
}

// Parse Legal Requirements Checklist from refined analysis
function parseLegalRequirementsChecklist(content: string): any[] {
  const checklistMatch = content.match(/Requirements vs\.([\s\S]*?)(?=CONCLUSION:|$)/i)
  if (!checklistMatch) return []

  const checklistContent = checklistMatch[1].trim()
  const requirements = []
  
  // Extract individual requirements
  const reqMatches = checklistContent.match(/\d+\.\s*(.*?)Law:(.*?)Citation:(.*?)(?=\d+\.|$)/gs)
  if (reqMatches) {
    reqMatches.forEach(reqBlock => {
      const requirement = {
        requirement: '',
        law: '',
        citation: '',
        clientFacts: '',
        status: 'meets' as const,
        analysis: ''
      }
      
      const lines = reqBlock.split('\n').map(l => l.trim()).filter(Boolean)
      lines.forEach(line => {
        if (line.startsWith('Law:')) requirement.law = line.replace('Law:', '').trim()
        if (line.startsWith('Citation:')) requirement.citation = line.replace('Citation:', '').trim()
        if (line.includes('→ ✅')) requirement.status = 'meets'
        if (line.includes('→ ❌')) requirement.status = 'does_not_meet'
        if (line.includes('→ ⚠️')) requirement.status = 'needs_evidence'
      })
      
      requirements.push(requirement)
    })
  }
  
  return requirements
}

// Parse structured case data from messages
function parseStructuredCaseData(messages: any[]): any {
  // Extract structured data from conversation
  return {
    parties: [],
    timeline: [],
    coreFacts: [],
    keyDocuments: []
  }
}

// Extract conversation summary
function extractConversationSummary(messages: any[]): string {
  return messages.slice(0, 3).map(m => `${m.role}: ${m.content}`).join('\n\n')
}

// Extract case conclusion from refined analysis
function extractCaseConclusion(refinedContent: string): string {
  if (!refinedContent) return ''
  const conclusionMatch = refinedContent.match(/CONCLUSION:([\s\S]*?)$/i)
  return conclusionMatch ? conclusionMatch[1].trim() : ''
}

// Extract law references
function extractLawReferences(analysisData: any): any[] {
  return analysisData?.law_references || []
}