
import { StrengthsAndWeaknesses, PredictionPercentages } from "@/types/caseAnalysis";

// Extract strengths and weaknesses from analysis text
export const extractStrengthsWeaknesses = (analysisText: string): StrengthsAndWeaknesses => {
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
  strengthsWeaknesses: StrengthsAndWeaknesses
): PredictionPercentages => {
  // Start with a baseline of 50/50
  let defensePercentage = 50;
  
  // Analyze the full text content for evidence quality
  const lowerAnalysis = analysisText.toLowerCase();
  
  // Evidence strength factors - score each piece of evidence
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
  
  // More granular keyword analysis
  const specificKeywords = [
    // Positive outcomes
    {term: "clear liability", score: 10},
    {term: "duty of care violated", score: 8},
    {term: "breach of duty", score: 7},
    {term: "negligence is apparent", score: 9},
    {term: "statute of limitations", score: -5},
    {term: "difficulty proving", score: -7},
    {term: "lack of evidence", score: -8},
  ];
  
  specificKeywords.forEach(({term, score}) => {
    if (lowerAnalysis.includes(term)) {
      defensePercentage += score;
    }
  });
  
  // Apply reasonable limits - wider range (18% to 95%)
  defensePercentage = Math.max(18, Math.min(defensePercentage, 95));
  
  return {
    defense: Math.round(defensePercentage),
    prosecution: 100 - Math.round(defensePercentage)
  };
};

// Extract sections from analysis content
export const extractAnalysisSections = (content: string) => {
  const relevantLawMatch = content.match(/\*\*RELEVANT TEXAS LAW:\*\*([\s\S]*?)(?=\*\*PRELIMINARY ANALYSIS|\*\*POTENTIAL LEGAL ISSUES|\*\*RECOMMENDED FOLLOW-UP|$)/);
  const preliminaryAnalysisMatch = content.match(/\*\*PRELIMINARY ANALYSIS:\*\*([\s\S]*?)(?=\*\*POTENTIAL LEGAL ISSUES|\*\*RECOMMENDED FOLLOW-UP|$)/);
  const potentialIssuesMatch = content.match(/\*\*POTENTIAL LEGAL ISSUES:\*\*([\s\S]*?)(?=\*\*RECOMMENDED FOLLOW-UP|$)/);
  const followUpQuestionsMatch = content.match(/\*\*RECOMMENDED FOLLOW-UP QUESTIONS:\*\*([\s\S]*?)$/);
  
  // Extract follow-up questions
  const followUpQuestions = followUpQuestionsMatch 
    ? followUpQuestionsMatch[1].split('\n')
      .map(line => line.trim())
      .filter(line => line.match(/^\d+\.\s/))
      .map(line => line.replace(/^\d+\.\s/, ''))
    : [];
  
  return {
    relevantLaw: relevantLawMatch ? relevantLawMatch[1].trim() : "No relevant law analysis available.",
    preliminaryAnalysis: preliminaryAnalysisMatch ? preliminaryAnalysisMatch[1].trim() : "No preliminary analysis available.",
    potentialIssues: potentialIssuesMatch ? potentialIssuesMatch[1].trim() : "No potential issues identified.",
    followUpQuestions
  };
};
