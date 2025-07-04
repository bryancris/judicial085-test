// Analysis parsing utilities for export functionality

export interface StrengthsAndWeaknesses {
  strengths: string[];
  weaknesses: string[];
}

export interface PredictionPercentages {
  defense: number;
  prosecution: number;
}

// Extract strengths and weaknesses from analysis text
export const extractStrengthsWeaknesses = (analysisText: string, caseType?: string): StrengthsAndWeaknesses => {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Find potential issues section
  const potentialIssuesMatch = analysisText.match(/\*\*POTENTIAL LEGAL ISSUES:\*\*([\s\S]*?)(?=\*\*RECOMMENDED FOLLOW-UP|$)/);
  if (potentialIssuesMatch) {
    const issues = potentialIssuesMatch[1].split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10);
    
    // Categorize issues as strengths or weaknesses
    issues.forEach(issue => {
      const lowerIssue = issue.toLowerCase();
      
      if (
        lowerIssue.includes("favorable") || 
        lowerIssue.includes("advantage") || 
        lowerIssue.includes("support") || 
        lowerIssue.includes("evidence in favor") ||
        lowerIssue.includes("strong argument")
      ) {
        strengths.push(issue.replace(/^[-•*]\s*/, ''));
      } 
      else if (
        lowerIssue.includes("challenge") || 
        lowerIssue.includes("difficult") || 
        lowerIssue.includes("concern") || 
        lowerIssue.includes("weak") ||
        lowerIssue.includes("risk")
      ) {
        weaknesses.push(issue.replace(/^[-•*]\s*/, ''));
      }
      else if (strengths.length <= weaknesses.length) {
        strengths.push(issue.replace(/^[-•*]\s*/, ''));
      } else {
        weaknesses.push(issue.replace(/^[-•*]\s*/, ''));
      }
    });
  }
  
  // Default strengths and weaknesses if none found
  if (strengths.length === 0) {
    strengths.push(
      "Client's testimony appears consistent",
      "Documentation of incident is available"
    );
  }
  
  if (weaknesses.length === 0) {
    weaknesses.push(
      "Potential gaps in evidence chain",
      "Timeline inconsistencies may need resolution"
    );
  }
  
  return {
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4)
  };
};

// Calculate prediction percentages
export const calculatePredictionPercentages = (
  analysisText: string, 
  strengthsWeaknesses: StrengthsAndWeaknesses,
  caseType?: string
): PredictionPercentages => {
  let defensePercentage = 50;
  const lowerAnalysis = analysisText.toLowerCase();
  
  // Basic scoring based on content
  if (lowerAnalysis.includes("likely to prevail") || lowerAnalysis.includes("strong case")) {
    defensePercentage += 15;
  }
  
  if (lowerAnalysis.includes("difficult to prove") || lowerAnalysis.includes("challenging case")) {
    defensePercentage -= 15;
  }
  
  // Consider strengths vs weaknesses ratio
  const strengthsCount = strengthsWeaknesses.strengths.length;
  const weaknessesCount = strengthsWeaknesses.weaknesses.length;
  const total = strengthsCount + weaknessesCount;
  
  if (total > 0) {
    const ratioImpact = ((strengthsCount / total) - 0.5) * 20;
    defensePercentage += ratioImpact;
  }
  
  // Apply reasonable limits
  defensePercentage = Math.max(25, Math.min(defensePercentage, 85));
  
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

// Detect case type from analysis content
export const detectCaseType = (content: string): string => {
  const lowerContent = content.toLowerCase();
  
  if (
    lowerContent.includes("dtpa") || 
    lowerContent.includes("deceptive trade practice") || 
    lowerContent.includes("consumer protection")
  ) {
    return "consumer-protection";
  }
  
  if (
    lowerContent.includes("slip and fall") || 
    lowerContent.includes("premises liability")
  ) {
    return "premises-liability";
  }
  
  return "general";
};