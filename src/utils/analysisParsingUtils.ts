
import { StrengthsAndWeaknesses, PredictionPercentages } from "@/types/caseAnalysis";
import { extractDTPAReferences } from "./lawReferences/consumerProtectionUtils";

// Extract strengths and weaknesses from analysis text
export const extractStrengthsWeaknesses = (analysisText: string, caseType?: string): StrengthsAndWeaknesses => {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Find positive factors in the potential issues section
  const potentialIssuesMatch = analysisText.match(/\*\*POTENTIAL LEGAL ISSUES:\*\*([\s\S]*?)(?=\*\*RECOMMENDED FOLLOW-UP|$)/);
  if (potentialIssuesMatch) {
    const issues = potentialIssuesMatch[1].split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10); // Filter out short lines
    
    // Categorize issues as strengths or weaknesses based on keywords
    issues.forEach(issue => {
      const lowerIssue = issue.toLowerCase();
      
      // Check for positive indicators
      if (
        lowerIssue.includes("favorable") || 
        lowerIssue.includes("advantage") || 
        lowerIssue.includes("support") || 
        lowerIssue.includes("benefit") ||
        lowerIssue.includes("evidence in favor") ||
        lowerIssue.includes("strong argument")
      ) {
        strengths.push(issue.replace(/^[-•*]\s*/, '')); // Remove bullet points
      } 
      // Check for negative indicators
      else if (
        lowerIssue.includes("challenge") || 
        lowerIssue.includes("difficult") || 
        lowerIssue.includes("concern") || 
        lowerIssue.includes("problem") ||
        lowerIssue.includes("weak") ||
        lowerIssue.includes("against") ||
        lowerIssue.includes("risk")
      ) {
        weaknesses.push(issue.replace(/^[-•*]\s*/, '')); // Remove bullet points
      }
      // If unclear, default logic
      else if (strengths.length <= weaknesses.length) {
        strengths.push(issue.replace(/^[-•*]\s*/, ''));
      } else {
        weaknesses.push(issue.replace(/^[-•*]\s*/, ''));
      }
    });
  }
  
  // Add consumer protection specific strengths and weaknesses for DTPA cases
  if (caseType === "consumer-protection" || analysisText.toLowerCase().includes("deceptive trade") || analysisText.toLowerCase().includes("dtpa")) {
    const dtpaReferences = extractDTPAReferences(analysisText);
    
    // If we have DTPA references, use them to create strengths
    if (dtpaReferences.length > 0 && strengths.length < 3) {
      dtpaReferences.slice(0, 2).forEach(ref => {
        if (!strengths.some(s => s.includes(ref))) {
          strengths.push(`Potential ${ref} violation supports DTPA claim`);
        }
      });
    }
    
    // Add standard DTPA strengths if needed
    if (strengths.length < 2) {
      if (!strengths.some(s => s.toLowerCase().includes("treble"))) {
        strengths.push("Potential for treble damages under DTPA for knowing violations");
      }
      if (!strengths.some(s => s.toLowerCase().includes("attorney"))) {
        strengths.push("DTPA allows recovery of attorney's fees for successful claims");
      }
    }
    
    // Add standard DTPA weaknesses if needed
    if (weaknesses.length < 2) {
      if (!weaknesses.some(w => w.toLowerCase().includes("consumer"))) {
        weaknesses.push("Must establish consumer status under DTPA to maintain claim");
      }
      if (!weaknesses.some(w => w.toLowerCase().includes("notice"))) {
        weaknesses.push("Pre-suit notice requirements must be satisfied for DTPA claims");
      }
    }
  }
  
  // If we couldn't extract enough strengths/weaknesses, add generic ones based on the analysis
  if (strengths.length < 2) {
    const prelimAnalysisMatch = analysisText.match(/\*\*PRELIMINARY ANALYSIS:\*\*([\s\S]*?)(?=\*\*POTENTIAL LEGAL ISSUES|\*\*RECOMMENDED FOLLOW-UP|$)/);
    if (prelimAnalysisMatch) {
      const prelimText = prelimAnalysisMatch[1].toLowerCase();
      
      if (prelimText.includes("witness") && !strengths.some(s => s.toLowerCase().includes("witness"))) {
        strengths.push("Witness testimony may strengthen the case");
      }
      
      if (prelimText.includes("evidence") && !strengths.some(s => s.toLowerCase().includes("evidence"))) {
        strengths.push("Available evidence supports client's position");
      }
      
      if (prelimText.includes("precedent") && !strengths.some(s => s.toLowerCase().includes("precedent"))) {
        strengths.push("Legal precedent supports elements of our case");
      }
    }
  }
  
  if (weaknesses.length < 2) {
    const prelimAnalysisMatch = analysisText.match(/\*\*PRELIMINARY ANALYSIS:\*\*([\s\S]*?)(?=\*\*POTENTIAL LEGAL ISSUES|\*\*RECOMMENDED FOLLOW-UP|$)/);
    if (prelimAnalysisMatch) {
      const prelimText = prelimAnalysisMatch[1].toLowerCase();
      
      if (prelimText.includes("burden") && !weaknesses.some(w => w.toLowerCase().includes("burden"))) {
        weaknesses.push("Burden of proof challenges");
      }
      
      if (prelimText.includes("credibility") && !weaknesses.some(w => w.toLowerCase().includes("credibility"))) {
        weaknesses.push("Potential credibility challenges");
      }
      
      if (prelimText.includes("limitation") && !weaknesses.some(w => w.toLowerCase().includes("limitation"))) {
        weaknesses.push("Procedural or statutory limitations may apply");
      }
    }
  }
  
  // Ensure we have at least some strengths and weaknesses
  if (strengths.length === 0) {
    strengths.push(
      "Client's testimony appears consistent",
      "Documentation of incident is available",
      "Applicable law has favorable precedents"
    );
  }
  
  if (weaknesses.length === 0) {
    weaknesses.push(
      "Potential gaps in evidence chain",
      "Timeline inconsistencies may need resolution",
      "Opposing counsel likely to challenge key facts"
    );
  }
  
  // Ensure a reasonable number (2-4) of strengths and weaknesses
  return {
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4)
  };
};

// Calculate prediction percentages based on analysis text - completely revamped
export const calculatePredictionPercentages = (
  analysisText: string, 
  strengthsWeaknesses: StrengthsAndWeaknesses,
  caseType?: string
): PredictionPercentages => {
  // Start with a baseline
  let defensePercentage = 50;
  
  // Analyze the full text content for evidence quality
  const lowerAnalysis = analysisText.toLowerCase();
  
  // Consumer protection case specific scoring
  if (caseType === "consumer-protection" || lowerAnalysis.includes("dtpa") || lowerAnalysis.includes("deceptive trade")) {
    // DTPA specific evidence factors
    const dtpaFactors: {factor: string, weight: number}[] = [
      // Strong positive factors
      {factor: "written misrepresentation", weight: 15},
      {factor: "bait and switch", weight: 12},
      {factor: "knowing violation", weight: 15},
      {factor: "failure to disclose", weight: 10},
      {factor: "false advertising", weight: 10},
      {factor: "laundry list", weight: 8},
      {factor: "17.46(b)", weight: 12},
      {factor: "documentary evidence", weight: 10},
      {factor: "consumer status", weight: 8},
      {factor: "treble damages", weight: 5},
      {factor: "home solicitation", weight: 10},
      {factor: "right to cancel", weight: 8},
      {factor: "deceptive practice", weight: 7},
      
      // Negative factors
      {factor: "no writing", weight: -10},
      {factor: "statute of limitations", weight: -12},
      {factor: "no consumer", weight: -15},
      {factor: "exemption", weight: -12},
      {factor: "no goods or services", weight: -10},
      {factor: "professional services", weight: -8},
      {factor: "mere puffery", weight: -8},
      {factor: "opinion", weight: -7},
      {factor: "sophisticated party", weight: -6},
    ];
    
    // Apply DTPA factors
    for (const {factor, weight} of dtpaFactors) {
      if (lowerAnalysis.includes(factor)) {
        defensePercentage += weight;
      }
    }
    
    // Count DTPA provisions cited
    const dtpaReferences = extractDTPAReferences(analysisText);
    defensePercentage += Math.min(dtpaReferences.length * 3, 15); // Max 15 points for DTPA citations
    
    // Check for cooling-off period violations
    if (lowerAnalysis.includes("3-day") || lowerAnalysis.includes("three day") || lowerAnalysis.includes("cooling off")) {
      defensePercentage += 12;
    }
  } else {
    // General case evidence factors
    const evidenceFactors: {factor: string, weight: number}[] = [
      // Strong positive factors
      {factor: "video evidence", weight: 15},
      {factor: "surveillance footage", weight: 15},
      {factor: "employee saw the spill", weight: 12},
      {factor: "employee walk", weight: 10},
      {factor: "witnessed by", weight: 8},
      {factor: "medical record", weight: 8},
      {factor: "witnessed the incident", weight: 8},
      {factor: "no warning sign", weight: 10},
      {factor: "no barrier", weight: 8},
      {factor: "documented injuries", weight: 6},
      {factor: "ambulance", weight: 5},
      {factor: "witness testimony", weight: 8},
      {factor: "constructive knowledge", weight: 10},
      {factor: "clearly show", weight: 8},
      
      // Negative factors
      {factor: "no witness", weight: -6},
      {factor: "no evidence", weight: -10},
      {factor: "contributory negligence", weight: -8},
      {factor: "comparative fault", weight: -8},
      {factor: "pre-existing condition", weight: -7},
      {factor: "failure to observe", weight: -6},
      {factor: "no documentation", weight: -8},
      {factor: "conflicting testimony", weight: -7},
      {factor: "warning sign", weight: -10},
      {factor: "open and obvious", weight: -12},
    ];
    
    // Apply evidence factors
    for (const {factor, weight} of evidenceFactors) {
      if (lowerAnalysis.includes(factor)) {
        defensePercentage += weight;
      }
    }
    
    // Case type adjustments - premises liability cases
    if (
      lowerAnalysis.includes("slip and fall") || 
      lowerAnalysis.includes("premises liability")
    ) {
      // Check for slip and fall specific evidence
      if (lowerAnalysis.includes("video") && lowerAnalysis.includes("employee")) {
        defensePercentage += 10; // Video evidence of employee negligence is very strong
      }
      
      if (lowerAnalysis.includes("warned") && lowerAnalysis.includes("failed")) {
        defensePercentage += 8;
      }
    }
  }
  
  // Consider the ratio of strengths to weaknesses, but with less impact than evidence
  const strengthsCount = strengthsWeaknesses.strengths.length;
  const weaknessesCount = strengthsWeaknesses.weaknesses.length;
  const total = strengthsCount + weaknessesCount;
  
  if (total > 0) {
    // Apply a modest adjustment based on strength/weakness ratio (max ±12%)
    const ratioImpact = ((strengthsCount / total) - 0.5) * 24;
    defensePercentage += ratioImpact;
  }
  
  // Legal language analysis
  if (lowerAnalysis.includes("likely to prevail") || lowerAnalysis.includes("strong case")) {
    defensePercentage += 8;
  }
  
  if (lowerAnalysis.includes("difficult to prove") || lowerAnalysis.includes("challenging case")) {
    defensePercentage -= 8;
  }
  
  // Apply reasonable limits - wider range (18% to 95%)
  defensePercentage = Math.max(18, Math.min(defensePercentage, 95));
  
  return {
    defense: Math.round(defensePercentage),
    prosecution: 100 - Math.round(defensePercentage)
  };
};

// Extract sections from analysis content
export const extractAnalysisSections = (content: string) => {
  console.log("Extracting sections from content:", content.substring(0, 500) + "...");
  
  // More flexible patterns to handle variations in section headers
  const relevantLawPatterns = [
    /\*\*RELEVANT TEXAS LAW[S]?:\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i,
    /\*\*APPLICABLE TEXAS LAW[S]?:\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i,
    /\*\*LEGAL FRAMEWORK:\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i,
    /\*\*LAW[S]? APPLICABLE:\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i,
    // Plaintext uppercase headings (no bold)
    /(?:^|\n)\s*RELEVANT TEXAS LAW[S]?:\s*([\s\S]*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/i,
    /(?:^|\n)\s*APPLICABLE TEXAS LAW[S]?:\s*([\s\S]*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/i,
    /(?:^|\n)\s*LEGAL FRAMEWORK:\s*([\s\S]*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/i,
    /(?:^|\n)\s*LAW[S]? APPLICABLE:\s*([\s\S]*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/i,
  ];

  const caseSummaryPatterns = [
    /\*\*CASE SUMMARY:\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i,
    /\*\*SUMMARY:\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i,
    /\*\*CASE OVERVIEW:\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i,
    // Plaintext uppercase headings
    /(?:^|\n)\s*CASE SUMMARY:\s*([\s\S]*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/i,
    /(?:^|\n)\s*SUMMARY:\s*([\s\S]*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/i,
    /(?:^|\n)\s*CASE OVERVIEW:\s*([\s\S]*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/i,
  ];
  
  const preliminaryAnalysisPatterns = [
    /\*\*PRELIMINARY ANALYSIS:\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i,
    /\*\*INITIAL ANALYSIS:\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i,
    /\*\*ANALYSIS:\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i,
    // Plaintext uppercase headings
    /(?:^|\n)\s*PRELIMINARY ANALYSIS:\s*([\s\S]*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/i,
    /(?:^|\n)\s*INITIAL ANALYSIS:\s*([\s\S]*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/i,
    /(?:^|\n)\s*ANALYSIS:\s*([\s\S]*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/i,
  ];
  
  const potentialIssuesPatterns = [
    /\*\*POTENTIAL LEGAL ISSUES:\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i,
    /\*\*LEGAL ISSUES:\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i,
    /\*\*ISSUES IDENTIFIED:\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i,
    // Plaintext uppercase headings
    /(?:^|\n)\s*POTENTIAL LEGAL ISSUES:\s*([\s\S]*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/i,
    /(?:^|\n)\s*LEGAL ISSUES:\s*([\s\S]*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/i,
    /(?:^|\n)\s*ISSUES IDENTIFIED:\s*([\s\S]*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/i,
  ];
  
  const followUpPatternsQuestions = [
    /\*\*RECOMMENDED FOLLOW[-\s]?UP QUESTIONS:\*\*([\s\S]*?)$/i,
    /\*\*FOLLOW[-\s]?UP QUESTIONS:\*\*([\s\S]*?)$/i,
    /\*\*QUESTIONS FOR CLIENT:\*\*([\s\S]*?)$/i,
    // Plaintext uppercase headings
    /(?:^|\n)\s*RECOMMENDED FOLLOW[-\s]?UP QUESTIONS:\s*([\s\S]*?)$/i,
    /(?:^|\n)\s*FOLLOW[-\s]?UP QUESTIONS:\s*([\s\S]*?)$/i,
    /(?:^|\n)\s*QUESTIONS FOR CLIENT:\s*([\s\S]*?)$/i,
  ];
  
  // Try each pattern until we find a match
  let relevantLawMatch = null;
  for (const pattern of relevantLawPatterns) {
    relevantLawMatch = content.match(pattern);
    if (relevantLawMatch) {
      console.log("Found relevant law match with pattern:", pattern);
      break;
    }
  }
  // Fallback: HTML heading patterns like <strong>RELEVANT TEXAS LAW:</strong>
  if (!relevantLawMatch) {
    const relevantLawHtmlPatterns = [
      /<strong>\s*RELEVANT TEXAS LAW[S]?:\s*<\/strong>[\s\S]*?<\/p>\s*([\s\S]*?)(?=<p><strong>[A-Z][^<]*:<\/strong>|$)/i,
      /<strong>\s*APPLICABLE TEXAS LAW[S]?:\s*<\/strong>[\s\S]*?<\/p>\s*([\s\S]*?)(?=<p><strong>[A-Z][^<]*:<\/strong>|$)/i,
      /<strong>\s*LEGAL FRAMEWORK:\s*<\/strong>[\s\S]*?<\/p>\s*([\s\S]*?)(?=<p><strong>[A-Z][^<]*:<\/strong>|$)/i,
    ];
    for (const pattern of relevantLawHtmlPatterns) {
      const htmlMatch = content.match(pattern);
      if (htmlMatch) {
        relevantLawMatch = htmlMatch;
        console.log("Found relevant law HTML match with pattern:", pattern);
        break;
      }
    }
  }

  let caseSummaryMatch = null;
  for (const pattern of caseSummaryPatterns) {
    caseSummaryMatch = content.match(pattern);
    if (caseSummaryMatch) {
      console.log("Found case summary match with pattern:", pattern);
      break;
    }
  }
  // Fallback: HTML heading patterns like <strong>CASE SUMMARY:</strong>
  if (!caseSummaryMatch) {
    const caseSummaryHtmlPatterns = [
      /<strong>\s*CASE SUMMARY:\s*<\/strong>[\s\S]*?<\/p>\s*([\s\S]*?)(?=<p><strong>[A-Z][^<]*:<\/strong>|$)/i,
      /<strong>\s*CASE OVERVIEW:\s*<\/strong>[\s\S]*?<\/p>\s*([\s\S]*?)(?=<p><strong>[A-Z][^<]*:<\/strong>|$)/i,
      /<strong>\s*SUMMARY:\s*<\/strong>[\s\S]*?<\/p>\s*([\s\S]*?)(?=<p><strong>[A-Z][^<]*:<\/strong>|$)/i,
    ];
    for (const pattern of caseSummaryHtmlPatterns) {
      const htmlMatch = content.match(pattern);
      if (htmlMatch) {
        caseSummaryMatch = htmlMatch;
        console.log("Found case summary HTML match with pattern:", pattern);
        break;
      }
    }
  }
  
  let preliminaryAnalysisMatch = null;
  for (const pattern of preliminaryAnalysisPatterns) {
    preliminaryAnalysisMatch = content.match(pattern);
    if (preliminaryAnalysisMatch) break;
  }
  
  let potentialIssuesMatch = null;
  for (const pattern of potentialIssuesPatterns) {
    potentialIssuesMatch = content.match(pattern);
    if (potentialIssuesMatch) break;
  }
  
  let followUpQuestionsMatch = null;
  for (const pattern of followUpPatternsQuestions) {
    followUpQuestionsMatch = content.match(pattern);
    if (followUpQuestionsMatch) break;
  }
  
  // Extract follow-up questions
  const followUpQuestions = followUpQuestionsMatch 
    ? followUpQuestionsMatch[1].split('\n')
      .map(line => line.trim())
      .filter(line => line.match(/^\d+\.\s/))
      .map(line => line.replace(/^\d+\.\s/, ''))
    : [];
  
  // Extract remedies section for consumer protection cases
  let remedies = null;
  if (content.toLowerCase().includes('dtpa') || content.toLowerCase().includes('deceptive trade')) {
    // Look for remedies discussions
    const remedyPatterns = [
      /\b(remedies|damages|recovery|relief)[\s\S]{10,300}?(?=\n\n|\n\*\*|$)/i,
      /treble damages[\s\S]{10,200}?(?=\n\n|\n\*\*|$)/i,
      /17\.50[\s\S]{10,200}?(?=\n\n|\n\*\*|$)/i
    ];
    
    for (const pattern of remedyPatterns) {
      const match = content.match(pattern);
      if (match && match[0]) {
        remedies = match[0];
        break;
      }
    }
  }
  
  // Normalize HTML content to readable text if needed
  const toPlainText = (fragment: string) => {
    if (!fragment) return "";
    let t = fragment;
    t = t.replace(/<li[^>]*>/gi, '- ');
    t = t.replace(/<\/li>/gi, '\n');
    t = t.replace(/<br\s*\/?>(\s*)/gi, '\n');
    t = t.replace(/<\/p>\s*<p>/gi, '\n\n');
    t = t.replace(/<[^>]+>/g, '');
    t = t.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
    return t.trim();
  };

  const rawRelevantLaw = relevantLawMatch ? relevantLawMatch[1].trim() : "";
  const extractedLaw = rawRelevantLaw.includes('<') ? toPlainText(rawRelevantLaw) : rawRelevantLaw;
  console.log("Extracted relevant law:", extractedLaw ? extractedLaw.substring(0, 200) + "..." : "NONE FOUND");

  const rawCaseSummary = caseSummaryMatch ? caseSummaryMatch[1].trim() : "";
  const extractedCaseSummary = rawCaseSummary.includes('<') ? toPlainText(rawCaseSummary) : rawCaseSummary;
  console.log("Extracted case summary:", extractedCaseSummary ? extractedCaseSummary.substring(0, 200) + "..." : "NONE FOUND");
  
  return {
    relevantLaw: extractedLaw || "No relevant law analysis available.",
    caseSummary: extractedCaseSummary || "No case summary available.",
    preliminaryAnalysis: preliminaryAnalysisMatch ? preliminaryAnalysisMatch[1].trim() : "No preliminary analysis available.",
    potentialIssues: potentialIssuesMatch ? potentialIssuesMatch[1].trim() : "No potential issues identified.",
    followUpQuestions,
    remedies
  };
};

// Detect case type from analysis content
export const detectCaseType = (content: string): string => {
  const lowerContent = content.toLowerCase();
  
  // Check for consumer protection/DTPA cases
  if (
    lowerContent.includes("dtpa") || 
    lowerContent.includes("deceptive trade practice") || 
    lowerContent.includes("consumer protection") ||
    lowerContent.includes("17.46") ||
    lowerContent.includes("home solicitation") ||
    (lowerContent.includes("consumer") && lowerContent.includes("texas business"))
  ) {
    return "consumer-protection";
  }
  
  // Check for personal injury cases
  if (
    lowerContent.includes("slip and fall") || 
    lowerContent.includes("premises liability") ||
    (lowerContent.includes("injury") && lowerContent.includes("negligence"))
  ) {
    return "premises-liability";
  }
  
  // Check for motor vehicle accident cases
  if (
    lowerContent.includes("car accident") || 
    lowerContent.includes("automobile") || 
    lowerContent.includes("motor vehicle")
  ) {
    return "motor-vehicle-accident";
  }
  
  // Check for contract disputes
  if (
    lowerContent.includes("breach of contract") || 
    lowerContent.includes("agreement") ||
    lowerContent.includes("contractual")
  ) {
    return "contract-dispute";
  }
  
  // Default case type
  return "general";
};
