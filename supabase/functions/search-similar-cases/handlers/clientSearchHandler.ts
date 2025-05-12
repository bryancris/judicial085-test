
import { corsHeaders } from "../utils/corsUtils.ts";
import { supabase } from "../index.ts";
import { processCourtListenerResults } from "./courtListenerHandler.ts";
import { processInternalAnalyses } from "./internalAnalysisHandler.ts";
import { generateFallbackCases, getFallbackCasesByType } from "../utils/fallbackCases.ts";

export async function handleClientSearch(clientId: string, courtListenerApiKey: string) {
  // Get the client's name for reference
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('first_name, last_name')
    .eq('id', clientId)
    .single();

  if (clientError) {
    console.error('Error fetching client data:', clientError);
    throw new Error('Could not find client data');
  }

  // Fetch the current client's legal analysis
  const { data: currentAnalysis, error: analysisError } = await supabase
    .from('legal_analyses')
    .select('content')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (analysisError) {
    console.error('Error fetching current analysis:', analysisError);
    throw new Error('Error retrieving legal analysis');
  }

  if (!currentAnalysis) {
    console.error('No legal analysis found for client:', clientId);
    
    // Return some generic fallback cases since we have no legal analysis to compare with
    return new Response(
      JSON.stringify({
        similarCases: generateFallbackCases(clientData.first_name, clientData.last_name),
        currentClient: `${clientData.first_name} ${clientData.last_name}`,
        analysisFound: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // First try to find similar cases from our own database
  const { data: otherAnalyses, error: otherAnalysesError } = await supabase
    .from('legal_analyses')
    .select('content, client_id, created_at')
    .neq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (otherAnalysesError) {
    console.error('Error fetching other analyses:', otherAnalysesError);
    throw new Error('Failed to search for similar cases in database');
  }

  // Extract key information from the current analysis for search comparison
  const currentRelevantLaw = extractSection(currentAnalysis.content, 'RELEVANT TEXAS LAW');
  const currentPreliminaryAnalysis = extractSection(currentAnalysis.content, 'PRELIMINARY ANALYSIS');
  const currentIssues = extractSection(currentAnalysis.content, 'POTENTIAL LEGAL ISSUES');

  // Combine the sections to create a search document
  const currentSearchDocument = [
    currentRelevantLaw,
    currentPreliminaryAnalysis, 
    currentIssues
  ].join(' ');

  // Log the content to help with debugging
  console.log("Current client analysis content:", {
    law: currentRelevantLaw.substring(0, 100) + "...",
    analysis: currentPreliminaryAnalysis.substring(0, 100) + "...",
    issues: currentIssues.substring(0, 100) + "..."
  });

  // Detect the case type
  const caseType = identifyCaseType(currentPreliminaryAnalysis, currentIssues, currentRelevantLaw);
  console.log("Detected case type:", caseType);

  // Generate search terms based on analysis content and case type
  const searchTerms = generateSearchTerms(currentRelevantLaw, currentIssues, currentPreliminaryAnalysis, caseType);
  console.log("Generated search terms:", searchTerms);

  // Process internal analyses  
  const internalSimilarityResults = await processInternalAnalyses(
    otherAnalyses, 
    currentSearchDocument
  );
  
  // Process CourtListener results
  const courtListenerResults = await processCourtListenerResults(
    searchTerms, 
    currentSearchDocument, 
    courtListenerApiKey,
    caseType
  );

  // Combine and sort both internal and CourtListener results
  const combinedResults = [...internalSimilarityResults, ...courtListenerResults]
    .filter(result => result.similarity > 0.2 || result.source === "courtlistener") // Include all CourtListener results
    .sort((a, b) => {
      // Prioritize CourtListener results slightly
      if (a.source === "courtlistener" && b.source !== "courtlistener") return -1;
      if (a.source !== "courtlistener" && b.source === "courtlistener") return 1;
      // Then sort by similarity
      return b.similarity - a.similarity;
    })
    .slice(0, 10); // Top 10 most similar

  console.log(`Found ${combinedResults.length} total similar cases`);

  return new Response(
    JSON.stringify({ 
      similarCases: combinedResults,
      currentClient: `${clientData.first_name} ${clientData.last_name}`,
      analysisFound: true
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper function to extract a section from the analysis content
export function extractSection(content: string, sectionName: string): string {
  if (!content) return '';
  
  const regex = new RegExp(`\\*\\*${sectionName}:\\*\\*([\\s\\S]*?)(?=\\*\\*|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

// Enhanced case type identification from the analysis
export function identifyCaseType(analysis: string, issues: string, law: string): string {
  if (!analysis && !issues && !law) return "unknown";
  
  const combinedText = (analysis + " " + issues + " " + law).toLowerCase();
  
  // Check for bailment/property cases first (like the vehicle theft case)
  if (
    (combinedText.includes("bailment") || 
     combinedText.includes("bailee") || 
     combinedText.includes("bailor")) ||
    ((combinedText.includes("property") || combinedText.includes("vehicle") || 
      combinedText.includes("car") || combinedText.includes("automobile")) && 
     (combinedText.includes("theft") || combinedText.includes("stolen") || 
      combinedText.includes("damage") || combinedText.includes("lost")))
  ) {
    return "bailment";
  }
  
  // Check for slip and fall / premises liability
  if ((combinedText.includes("slip") && combinedText.includes("fall")) || 
      combinedText.includes("premises liability")) {
    return "premises-liability";
  }
  
  // Check for motor vehicle accidents
  if ((combinedText.includes("car accident") || 
       combinedText.includes("motor vehicle") || 
       combinedText.includes("auto accident") || 
       combinedText.includes("collision")) && 
      !combinedText.includes("theft")) {
    return "motor-vehicle-accident";
  }
  
  // Check for medical malpractice
  if (combinedText.includes("medical malpractice") || 
      (combinedText.includes("medical") && 
       (combinedText.includes("negligence") || combinedText.includes("doctor")))) {
    return "medical-malpractice";
  }
  
  // Check for product liability
  if (combinedText.includes("product liability") || 
      combinedText.includes("defective product")) {
    return "product-liability";
  }
  
  // Check for contract disputes
  if (combinedText.includes("contract") || 
      combinedText.includes("agreement") || 
      combinedText.includes("breach")) {
    return "contract-dispute";
  }
  
  // Check for employment cases
  if (combinedText.includes("employment") || 
      combinedText.includes("wrongful termination") || 
      combinedText.includes("discrimination") || 
      combinedText.includes("workplace")) {
    return "employment";
  }
  
  // Default case type if no specific pattern is detected
  return "general-liability";
}

// Generate search terms for CourtListener API based on legal analysis and case type
export function generateSearchTerms(
  relevantLaw: string, 
  legalIssues: string, 
  preliminaryAnalysis: string,
  caseType: string
): string {
  // Default search terms if sections are empty
  if (!relevantLaw && !legalIssues && !preliminaryAnalysis) {
    return "liability negligence damages";
  }
  
  // Extract potential statutes
  const statuteMatches = relevantLaw.match(/([A-Z][\w\s]+Code\s+§+\s*\d+[\w\.\-]*)/g) || [];
  
  // Extract key legal terms
  const legalTerms = new Set<string>();
  
  // Add case type specific terms
  if (caseType === "bailment") {
    legalTerms.add("bailment");
    legalTerms.add("bailee");
    legalTerms.add("property");
    legalTerms.add("vehicle theft");
    legalTerms.add("duty of care");
  } else if (caseType === "premises-liability") {
    legalTerms.add("slip and fall");
    legalTerms.add("premises liability");
    legalTerms.add("dangerous condition");
  } else if (caseType === "motor-vehicle-accident") {
    legalTerms.add("motor vehicle accident");
    legalTerms.add("collision");
    legalTerms.add("automobile negligence");
  } else if (caseType === "medical-malpractice") {
    legalTerms.add("medical malpractice");
    legalTerms.add("doctor negligence");
    legalTerms.add("standard of care");
  } else if (caseType === "product-liability") {
    legalTerms.add("product liability");
    legalTerms.add("defective product");
    legalTerms.add("manufacturer liability");
  } else if (caseType === "contract-dispute") {
    legalTerms.add("breach of contract");
    legalTerms.add("contract dispute");
    legalTerms.add("contract terms");
  } else if (caseType === "employment") {
    legalTerms.add("employment dispute");
    legalTerms.add("wrongful termination");
    legalTerms.add("workplace discrimination");
  }
  
  // Always add negligence as it's common across many case types
  legalTerms.add("negligence");
  legalTerms.add("damages");
  
  // Process relevant law for legal terms
  const lawWords = relevantLaw.split(/\W+/);
  for (let i = 0; i < lawWords.length - 1; i++) {
    if (lawWords[i].length > 3 && lawWords[i][0].toUpperCase() === lawWords[i][0]) {
      const term = lawWords[i] + ' ' + lawWords[i+1];
      if (term.length > 7) legalTerms.add(term);
    }
  }
  
  // Process legal issues for additional terms
  const issueWords = legalIssues.split(/\W+/);
  for (let i = 0; i < issueWords.length - 1; i++) {
    if (issueWords[i].length > 4) {
      const term = issueWords[i] + ' ' + issueWords[i+1];
      if (term.length > 7) legalTerms.add(term);
    }
  }
  
  // Extract named entities that might be relevant
  extractNamedEntities(preliminaryAnalysis).forEach(entity => {
    legalTerms.add(entity);
  });
  
  // Combine statutes and best legal terms
  const statutes = statuteMatches.slice(0, 2).join(' ');
  const bestTerms = Array.from(legalTerms).slice(0, 5).join(' ');
  
  const combinedTerms = `${statutes} ${bestTerms}`.trim();
  return combinedTerms.length > 0 ? combinedTerms : "liability negligence damages";
}

// Simple function to extract potential named entities
export function extractNamedEntities(text: string): string[] {
  if (!text) return [];
  
  const entities: string[] = [];
  const matches = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g) || [];
  
  // Filter out common irrelevant entities and duplicates
  return [...new Set(matches.filter(entity => 
    entity.length > 5 && 
    !entity.includes("Texas") && 
    !entity.includes("Attorney") &&
    !entity.includes("Court")
  ))];
}

// Add explicit legal terms to improve search results based on case type
export function addExplicitLegalTerms(searchTerms: string, caseText: string, caseType: string): string {
  let enhancedTerms = searchTerms;
  
  // Add case-type specific terms
  if (caseType === "bailment") {
    enhancedTerms = `${enhancedTerms} "bailment" "bailee" "property" "duty of care" vehicle valuable theft stolen`;
  } 
  else if (caseType === "premises-liability") {
    enhancedTerms = `${enhancedTerms} "slip and fall" "premises liability" negligence duty dangerous condition owner occupier hazard unsafe`;
  }
  else if (caseType === "motor-vehicle-accident") {
    enhancedTerms = `${enhancedTerms} "motor vehicle" "car accident" collision automobile traffic negligence driver`;
  }
  else if (caseType === "medical-malpractice") {
    enhancedTerms = `${enhancedTerms} "medical malpractice" "standard of care" doctor hospital treatment negligence patient`;
  }
  else if (caseType === "product-liability") {
    enhancedTerms = `${enhancedTerms} "product liability" defective manufacturer warranty unsafe consumer`;
  }
  else if (caseType === "contract-dispute") {
    enhancedTerms = `${enhancedTerms} "breach of contract" agreement terms violation damages performance`;
  }
  else if (caseType === "employment") {
    enhancedTerms = `${enhancedTerms} "wrongful termination" discrimination harassment workplace employer employee`;
  }
  else {
    // Generic terms for other case types
    enhancedTerms = `${enhancedTerms} liability negligence damages duty breach`;
  }
  
  return enhancedTerms;
}
