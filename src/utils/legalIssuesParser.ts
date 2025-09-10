import { LegalIssue, LegalIssuesAssessment } from "@/types/caseAnalysis";

export const parseLegalIssuesAssessment = (content: string): LegalIssuesAssessment | null => {
  if (!content) return null;

  try {
    const sections = {
      strongIssues: [] as LegalIssue[],
      moderateIssues: [] as LegalIssue[],
      weakIssues: [] as LegalIssue[],
      eliminatedIssues: [] as LegalIssue[],
      overallStrategy: '',
      priorityRecommendations: [] as string[]
    };

    // Extract issues by strength category
    const extractIssuesFromSection = (sectionName: string, strength: 'strong' | 'moderate' | 'weak' | 'eliminated'): LegalIssue[] => {
      const issues: LegalIssue[] = [];
      const regex = new RegExp(`${sectionName}[:\\s]*([\\s\\S]*?)(?=(?:STRONG|MODERATE|WEAK|ELIMINATED|OVERALL|$))`, 'i');
      const match = content.match(regex);
      
      if (match && match[1]) {
        const sectionContent = match[1].trim();
        // Split by numbered items, bullet points, or clear separators
        const issueBlocks = sectionContent.split(/(?:\n\s*(?:\d+\.|\-|\*|•)|\n\s*\n)/).filter(block => block.trim());
        
        issueBlocks.forEach((block, index) => {
          const trimmed = block.trim();
          if (!trimmed || trimmed.length < 20) return;

          // Extract title (first line or first sentence)
          const lines = trimmed.split('\n').filter(line => line.trim());
          const title = lines[0]?.replace(/^\d+\.\s*|\*\s*|-\s*|•\s*/, '').trim() || `${strength.charAt(0).toUpperCase() + strength.slice(1)} Issue ${index + 1}`;
          
          // Extract description (remaining content)
          const description = lines.slice(1).join(' ').trim() || trimmed;

          // Extract priority from content
          const priorityMatch = description.match(/priority\s*:?\s*(\d+)|(\d+)\s*priority/i);
          const strategicPriority = priorityMatch ? parseInt(priorityMatch[1] || priorityMatch[2]) : index + 1;

          // Extract risk factors if mentioned
          const riskFactors: string[] = [];
          const riskMatch = description.match(/risk[s]?[:\s]*([^.]+)/i);
          if (riskMatch) {
            riskFactors.push(riskMatch[1].trim());
          }

          issues.push({
            id: `${strength}_${index + 1}`,
            title: title.substring(0, 200), // Limit title length
            strength,
            description: description.substring(0, 500), // Limit description length
            strategicPriority,
            riskFactors: riskFactors.length > 0 ? riskFactors : undefined,
            viabilityAssessment: description.substring(0, 200)
          });
        });
      }
      
      return issues;
    };

    // Parse each section
    sections.strongIssues = extractIssuesFromSection('STRONG ISSUES?', 'strong');
    sections.moderateIssues = extractIssuesFromSection('MODERATE ISSUES?', 'moderate');
    sections.weakIssues = extractIssuesFromSection('WEAK ISSUES?', 'weak');
    sections.eliminatedIssues = extractIssuesFromSection('ELIMINATED ISSUES?', 'eliminated');

    // Extract overall strategy
    const strategyMatch = content.match(/OVERALL[\\s\\S]*?STRATEGY[:\\s]*([\\s\\S]*?)(?=PRIORITY|$)/i);
    if (strategyMatch && strategyMatch[1]) {
      sections.overallStrategy = strategyMatch[1].trim().substring(0, 1000);
    }

    // Extract priority recommendations
    const priorityMatch = content.match(/PRIORITY[\\s\\S]*?RECOMMENDATION[s]?[:\\s]*([\\s\\S]*?)$/i);
    if (priorityMatch && priorityMatch[1]) {
      const priorityText = priorityMatch[1].trim();
      sections.priorityRecommendations = priorityText
        .split(/\n/)
        .map(line => line.trim())
        .filter(line => line && line.length > 10)
        .slice(0, 5); // Limit to 5 recommendations
    }

    // Only return if we found at least some issues
    const totalIssues = sections.strongIssues.length + sections.moderateIssues.length + 
                       sections.weakIssues.length + sections.eliminatedIssues.length;
    
    return totalIssues > 0 ? sections : null;

  } catch (error) {
    console.error('Error parsing legal issues assessment:', error);
    return null;
  }
};