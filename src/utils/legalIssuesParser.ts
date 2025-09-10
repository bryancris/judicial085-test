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

    const strongA = extractIssuesFromSection('STRONG ISSUES?', 'strong');
    const strongB = extractIssuesFromSection('STRONG', 'strong');
    sections.strongIssues = mergeUnique([ ...strongA, ...strongB ]);

    const moderateA = extractIssuesFromSection('MODERATE ISSUES?', 'moderate');
    const moderateB = extractIssuesFromSection('MODERATE', 'moderate');
    sections.moderateIssues = mergeUnique([ ...moderateA, ...moderateB ]);

    const weakA = extractIssuesFromSection('WEAK ISSUES?', 'weak');
    const weakB = extractIssuesFromSection('WEAK', 'weak');
    sections.weakIssues = mergeUnique([ ...weakA, ...weakB ]);

    const elimA = extractIssuesFromSection('ELIMINATED ISSUES?', 'eliminated');
    const elimB = extractIssuesFromSection('ELIMINATED', 'eliminated');
    const elimC = extractIssuesFromSection('NOT VIABLE', 'eliminated');
    sections.eliminatedIssues = mergeUnique([ ...elimA, ...elimB, ...elimC ]);

    // Fallback: If nothing parsed, try generic bullets with inline Strength: labels
    let totalIssues = sections.strongIssues.length + sections.moderateIssues.length + sections.weakIssues.length + sections.eliminatedIssues.length;
    if (totalIssues === 0) {
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