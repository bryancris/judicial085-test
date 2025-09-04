import { IracAnalysis, IracIssue } from "@/types/caseAnalysis";

/**
 * Parse AI-generated analysis content into IRAC structure
 */
export const parseIracAnalysis = (content: string): IracAnalysis | null => {
  try {
    // Split content into sections
    const sections = content.split(/\*\*(.*?):\*\*/g).filter(Boolean);
    const sectionMap: Record<string, string> = {};
    
    // Build section map
    for (let i = 0; i < sections.length - 1; i += 2) {
      const sectionName = sections[i].trim();
      const sectionContent = sections[i + 1]?.trim() || '';
      sectionMap[sectionName] = sectionContent;
    }

    // Extract case summary
    const caseSummary = sectionMap['CASE SUMMARY'] || '';

    // Parse IRAC issues from the content
    const legalIssues = parseIracIssues(content);

    // Extract other sections
    const overallConclusion = sectionMap['OVERALL CONCLUSION'] || '';
    const followUpQuestions = parseFollowUpQuestions(sectionMap['RECOMMENDED FOLLOW-UP QUESTIONS'] || '');
    const nextSteps = parseNextSteps(sectionMap['NEXT STEPS'] || '');

    return {
      caseSummary,
      legalIssues,
      overallConclusion,
      followUpQuestions,
      nextSteps
    };
  } catch (error) {
    console.error('Error parsing IRAC analysis:', error);
    return null;
  }
};

/**
 * Parse individual IRAC issues from content
 */
const parseIracIssues = (content: string): IracIssue[] => {
  const issues: IracIssue[] = [];
  
  // Look for ISSUE patterns followed by RULE, APPLICATION, CONCLUSION
  const issuePattern = /\*\*ISSUE\s*(?:\[(\d+)\])?\s*:\*\*\s*(.*?)(?=\*\*(?:RULE|ISSUE|\w+)\s*:|\*\*$|$)/gs;
  const matches = Array.from(content.matchAll(issuePattern));

  for (const match of matches) {
    const issueNumber = match[1] || '1';
    const issueContent = match[2].trim();
    
    // Extract category if present (e.g., "Contract Law", "Tort Law")
    const categoryMatch = issueContent.match(/^\[(.*?)\]\s*(.*)/s);
    const category = categoryMatch ? categoryMatch[1] : undefined;
    const issueStatement = categoryMatch ? categoryMatch[2] : issueContent;

    // Find corresponding RULE, APPLICATION, CONCLUSION sections
    const rule = extractIracSection(content, issueNumber, 'RULE');
    const application = extractIracSection(content, issueNumber, 'APPLICATION');
    const conclusion = extractIracSection(content, issueNumber, 'CONCLUSION');

    if (issueStatement && rule && application && conclusion) {
      issues.push({
        id: `issue-${issueNumber}`,
        issueStatement: cleanIracText(issueStatement),
        rule: cleanIracText(rule),
        application: cleanIracText(application),
        conclusion: cleanIracText(conclusion),
        category
      });
    }
  }

  // Fallback: if no numbered issues found, try to parse single IRAC structure
  if (issues.length === 0) {
    const simpleIssue = parseSimpleIracStructure(content);
    if (simpleIssue) {
      issues.push(simpleIssue);
    }
  }

  return issues;
};

/**
 * Extract specific IRAC section for a given issue number
 */
const extractIracSection = (content: string, issueNumber: string, sectionType: string): string => {
  // Try numbered sections first (e.g., "**RULE [1]:**")
  let pattern = new RegExp(`\\*\\*${sectionType}\\s*(?:\\[${issueNumber}\\])?\\s*:\\*\\*\\s*(.*?)(?=\\*\\*(?:APPLICATION|CONCLUSION|ISSUE|\\w+)\\s*:|$)`, 'is');
  let match = content.match(pattern);
  
  if (match) {
    return match[1].trim();
  }

  // Try unnumbered sections if numbered not found
  pattern = new RegExp(`\\*\\*${sectionType}\\s*:\\*\\*\\s*(.*?)(?=\\*\\*(?:APPLICATION|CONCLUSION|ISSUE|\\w+)\\s*:|$)`, 'is');
  match = content.match(pattern);
  
  return match ? match[1].trim() : '';
};

/**
 * Parse simple IRAC structure (single issue)
 */
const parseSimpleIracStructure = (content: string): IracIssue | null => {
  const issueMatch = content.match(/\*\*ISSUE\s*:\*\*\s*(.*?)(?=\*\*RULE|$)/is);
  const ruleMatch = content.match(/\*\*RULE\s*:\*\*\s*(.*?)(?=\*\*APPLICATION|$)/is);
  const applicationMatch = content.match(/\*\*APPLICATION\s*:\*\*\s*(.*?)(?=\*\*CONCLUSION|$)/is);
  const conclusionMatch = content.match(/\*\*CONCLUSION\s*:\*\*\s*(.*?)(?=\*\*\w+|$)/is);

  if (issueMatch && ruleMatch && applicationMatch && conclusionMatch) {
    return {
      id: 'issue-1',
      issueStatement: cleanIracText(issueMatch[1]),
      rule: cleanIracText(ruleMatch[1]),
      application: cleanIracText(applicationMatch[1]),
      conclusion: cleanIracText(conclusionMatch[1])
    };
  }

  return null;
};

/**
 * Parse follow-up questions from text
 */
const parseFollowUpQuestions = (text: string): string[] => {
  if (!text) return [];
  
  const questions = text.split(/\n\d+\.\s/).filter(Boolean);
  return questions.map(q => q.trim()).filter(q => q.length > 0);
};

/**
 * Parse next steps from text
 */
const parseNextSteps = (text: string): string[] => {
  if (!text) return [];
  
  const steps = text.split(/\n[-•]\s/).filter(Boolean);
  return steps.map(s => s.trim()).filter(s => s.length > 0);
};

/**
 * Clean and format IRAC text content
 */
const cleanIracText = (text: string): string => {
  return text
    .trim()
    .replace(/^\*\*.*?\*\*\s*/, '') // Remove any remaining markdown headers
    .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph spacing
    .trim();
};

/**
 * Detect if content follows IRAC methodology
 */
export const isIracStructured = (content: string): boolean => {
  const hasIssue = /\*\*ISSUE\s*(?:\[\d+\])?\s*:\*\*/i.test(content);
  const hasRule = /\*\*RULE\s*(?:\[\d+\])?\s*:\*\*/i.test(content);
  const hasApplication = /\*\*APPLICATION\s*(?:\[\d+\])?\s*:\*\*/i.test(content);
  const hasConclusion = /\*\*CONCLUSION\s*(?:\[\d+\])?\s*:\*\*/i.test(content);
  
  return hasIssue && hasRule && hasApplication && hasConclusion;
};