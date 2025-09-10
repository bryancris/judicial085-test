import { LegalIssue, LegalIssuesAssessment } from "@/types/caseAnalysis";

export const parseLegalIssuesAssessment = (content: string): LegalIssuesAssessment | null => {
  if (!content) return null;

  console.log('🔍 Legal Issues Parser Input (first 500 chars):', content.substring(0, 500));
  console.log('🔍 Looking for sections in content...');

  try {
    const sections = {
      strongIssues: [] as LegalIssue[],
      moderateIssues: [] as LegalIssue[],
      weakIssues: [] as LegalIssue[],
      eliminatedIssues: [] as LegalIssue[],
      overallStrategy: '',
      priorityRecommendations: [] as string[]
    };

    // Extract issues by strength category (more tolerant to heading variants)
    const extractIssuesFromSection = (sectionName: string, strength: 'strong' | 'moderate' | 'weak' | 'eliminated'): LegalIssue[] => {
      const issues: LegalIssue[] = [];
      // Allow optional dashes/colons and recognize when the next section starts
      const regex = new RegExp(`${sectionName}[\\s:\\-]*([\\s\\S]*?)(?=(?:\\n\\s*(?:STRONG|MODERATE|WEAK|ELIMINATED|OVERALL|PRIORITY)\\b)|$)`, 'i');
      const match = content.match(regex);
      
      if (match && match[1]) {
        const sectionContent = match[1].trim();
        // Split by numbered items, bullet points, or clear separators (supports -, *, •, ▪, –, —, and 1. / 1))
        const issueBlocks = sectionContent
          .replace(/\r/g, '')
          .split(/(?:\n\s*(?:\d+[\.\)]|\-|\*|•|▪|–|—)\s+|\n{2,})/)
          .map(block => block.trim())
          .filter(block => block);
        
        issueBlocks.forEach((block, index) => {
          const trimmed = block.trim();
          if (!trimmed || trimmed.length < 5) return;

          // Extract title (first line or before a colon/dash)
          const lines = trimmed.split('\n').filter(line => line.trim());
          const firstLine = (lines[0] || '').replace(/^\d+[\.\)]\s*|^\*+\s*|^-+\s*|^•\s*|^[▪–—]\s*/, '').trim();
          const parts = firstLine.split(/\s*[:\-–—]\s*/);
          const derivedTitle = (parts[0] || firstLine).trim();
          const title = derivedTitle || `${strength.charAt(0).toUpperCase() + strength.slice(1)} Issue ${index + 1}`;
          
          // Extract description (remaining content or remainder of first line)
          const remainderFromFirst = parts.length > 1 ? parts.slice(1).join(' - ').trim() : '';
          const description = (lines.slice(1).join(' ').trim() || remainderFromFirst || trimmed).trim();

          // Extract priority from content (Priority: 1, P: 1, 1 priority)
          const prMatch = description.match(/(?:priority|p)\s*[:\-]?\s*(\d+)/i) || firstLine.match(/(?:priority|p)\s*[:\-]?\s*(\d+)/i) || description.match(/(\d+)\s*priority/i);
          const strategicPriority = prMatch ? parseInt(prMatch[1]) : index + 1;

          // Extract risk factors if mentioned
          const riskFactors: string[] = [];
          const riskMatch = description.match(/risk[s]?[:\s]*([^\.\n]+)/i);
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

    // Parse each section (support multiple heading variants)
    const mergeUnique = (arr: LegalIssue[]) => {
      const seen = new Set<string>();
      return arr.filter(i => {
        const key = `${i.strength}|${i.title.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    // Try the exact format first
    const strongA = extractIssuesFromSection('\\*\\*STRONG ISSUES\\*\\*', 'strong');
    const strongB = extractIssuesFromSection('STRONG ISSUES?', 'strong');
    const strongC = extractIssuesFromSection('STRONG', 'strong');
    sections.strongIssues = mergeUnique([ ...strongA, ...strongB, ...strongC ]);

    const moderateA = extractIssuesFromSection('\\*\\*MODERATE ISSUES\\*\\*', 'moderate');
    const moderateB = extractIssuesFromSection('MODERATE ISSUES?', 'moderate');
    const moderateC = extractIssuesFromSection('MODERATE', 'moderate');
    sections.moderateIssues = mergeUnique([ ...moderateA, ...moderateB, ...moderateC ]);

    const weakA = extractIssuesFromSection('\\*\\*WEAK ISSUES\\*\\*', 'weak');
    const weakB = extractIssuesFromSection('WEAK ISSUES?', 'weak');
    const weakC = extractIssuesFromSection('WEAK', 'weak');
    sections.weakIssues = mergeUnique([ ...weakA, ...weakB, ...weakC ]);

    const elimA = extractIssuesFromSection('\\*\\*ELIMINATED ISSUES\\*\\*', 'eliminated');
    const elimB = extractIssuesFromSection('ELIMINATED ISSUES?', 'eliminated');
    const elimC = extractIssuesFromSection('ELIMINATED', 'eliminated');
    const elimD = extractIssuesFromSection('NOT VIABLE', 'eliminated');
    sections.eliminatedIssues = mergeUnique([ ...elimA, ...elimB, ...elimC, ...elimD ]);

    // Fallback: Try parsing case strengths/weaknesses format
    let totalIssues = sections.strongIssues.length + sections.moderateIssues.length + sections.weakIssues.length + sections.eliminatedIssues.length;
    if (totalIssues === 0) {
      console.log('No structured legal issues found, trying case strengths/weaknesses format');
      
      // Look for case strengths and convert to strong legal issues
      const strengthsA = extractIssuesFromSection('\\*\\*CASE STRENGTHS\\*\\*', 'strong');
      const strengthsB = extractIssuesFromSection('CASE STRENGTHS?', 'strong');
      const strengthsC = extractIssuesFromSection('STRENGTHS?', 'strong');
      sections.strongIssues = mergeUnique([...strengthsA, ...strengthsB, ...strengthsC]);
      
      // Look for case weaknesses and convert to weak legal issues
      const weaknessesA = extractIssuesFromSection('\\*\\*CASE WEAKNESSES\\*\\*', 'weak');
      const weaknessesB = extractIssuesFromSection('CASE WEAKNESSES?', 'weak');
      const weaknessesC = extractIssuesFromSection('WEAKNESSES?', 'weak');
      sections.weakIssues = mergeUnique([...weaknessesA, ...weaknessesB, ...weaknessesC]);
      
      totalIssues = sections.strongIssues.length + sections.weakIssues.length;
      console.log(`Extracted ${sections.strongIssues.length} strengths and ${sections.weakIssues.length} weaknesses`);
    }

    // Final fallback: generic bullets with inline Strength: labels
    if (totalIssues === 0) {
      console.log('Trying final fallback with generic bullet parsing');
      const normalized = content.replace(/\r/g, '');
      const blocks = normalized.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
      const temp: LegalIssue[] = [];
      blocks.forEach((blk, idx) => {
        // Look for bullet/numbered starts to indicate issue-like blocks
        if (!/^([\-\*•▪–—]|\d+[\.\)])\s+/m.test(blk)) return;
        const lines = blk.split('\n');
        const first = lines[0].replace(/^\d+[\.\)]\s*|^\*+\s*|^-+\s*|^•\s*|^[▪–—]\s*/, '').trim();
        const strengthMatch = blk.match(/strength\s*[:\-]?\s*(strong|moderate|weak|eliminated)/i);
        const strength = (strengthMatch ? strengthMatch[1].toLowerCase() : 'moderate') as LegalIssue['strength'];
        const title = (first.split(/\s*[:\-–—]\s*/)[0] || `Issue ${idx + 1}`).trim();
        const desc = (lines.slice(1).join(' ').trim() || blk).trim();
        const prMatch = blk.match(/(?:priority|rank|p)\s*[:\-#]?\s*(\d+)/i) || first.match(/(?:priority|rank|p)\s*[:\-#]?\s*(\d+)/i);
        const strategicPriority = prMatch ? parseInt(prMatch[1]) : idx + 1;
        temp.push({
          id: `${strength}_${idx + 1}`,
          title: title.substring(0, 200),
          strength,
          description: desc.substring(0, 500),
          strategicPriority,
          viabilityAssessment: desc.substring(0, 200)
        });
      });
      if (temp.length > 0) {
        sections.strongIssues = temp.filter(t => t.strength === 'strong');
        sections.moderateIssues = temp.filter(t => t.strength === 'moderate');
        sections.weakIssues = temp.filter(t => t.strength === 'weak');
        sections.eliminatedIssues = temp.filter(t => t.strength === 'eliminated');
      }
    }

    // Extract overall strategy
    const strategyMatch = content.match(/(?:\*\*)?OVERALL[\s\S]*?STRATEGY(?:\*\*)?[:\s]*([\s\S]*?)(?=(?:\*\*)?PRIORITY|$)/i);
    if (strategyMatch && strategyMatch[1]) {
      sections.overallStrategy = strategyMatch[1].trim().substring(0, 1000);
    }

    // Extract priority recommendations
    const priorityMatch = content.match(/(?:\*\*)?PRIORITY[\s\S]*?RECOMMENDATION[s]?(?:\*\*)?[:\s]*([\s\S]*?)$/i);
    if (priorityMatch && priorityMatch[1]) {
      const priorityText = priorityMatch[1].trim();
      sections.priorityRecommendations = priorityText
        .split(/\n/)
        .map(line => line.trim())
        .filter(line => line && line.length > 10)
        .slice(0, 5); // Limit to 5 recommendations
    }

    // Only return if we found at least some issues
    totalIssues = sections.strongIssues.length + sections.moderateIssues.length + 
                  sections.weakIssues.length + sections.eliminatedIssues.length;
    
    return totalIssues > 0 ? sections : null;

  } catch (error) {
    console.error('Error parsing legal issues assessment:', error);
    return null;
  }
};