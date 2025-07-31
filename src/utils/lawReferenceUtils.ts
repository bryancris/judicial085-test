
import { marked } from 'marked';

// Process Texas law references in a text, adding links and highlights
export const processLawReferencesSync = (text: string): string => {
  if (!text) return '';

  // Texas statutes pattern (e.g., Texas Family Code § 154.001)
  const texasStatutePattern = /(Texas\s+[A-Za-z]+(?:\s+[&]?\s*[A-Za-z]+)*\s+Code\s+§\s+\d+\.\d+(?:\(\w+\))?)/g;
  
  // Texas case law pattern (e.g., Smith v. Jones, 123 S.W.3d 456 (Tex. 2005))
  const texasCasePattern = /([A-Za-z]+\s+v\.\s+[A-Za-z]+,\s+\d+\s+S\.W\.\d+\s+\d+\s+\(Tex\.\s+\d{4}\))/g;
  
  // DTPA references
  const dtpaPattern = /(Texas\s+Deceptive\s+Trade\s+Practices\s+Act|DTPA)/g;
  
  // UCC references
  const uccPattern = /(UCC\s+Article\s+\d+|UCC\s+§\s+\d+-\d+)/g;
  
  // Business organizations code
  const businessCodePattern = /(Texas\s+Business\s+Organizations\s+Code\s+§\s+\d+\.\d+)/g;
  
  // Severity level pattern 
  const severityPattern = /(CRITICAL|HIGH|MEDIUM|LOW)(\s+SEVERITY|\s+ISSUE|\:)/g;

  // Replace statutes with links
  let processedText = text.replace(texasStatutePattern, 
    '<span class="law-reference statute">$1</span>');
  
  // Replace case law with links
  processedText = processedText.replace(texasCasePattern, 
    '<span class="law-reference case">$1</span>');
    
  // Replace DTPA references
  processedText = processedText.replace(dtpaPattern, 
    '<span class="law-reference statute">$1</span>');
    
  // Replace UCC references
  processedText = processedText.replace(uccPattern,
    '<span class="law-reference statute">$1</span>');
    
  // Replace business code references
  processedText = processedText.replace(businessCodePattern,
    '<span class="law-reference statute">$1</span>');
    
  // Replace severity markers with highlighted spans
  processedText = processedText.replace(severityPattern, (match, severity) => {
    const colorClass = {
      'CRITICAL': 'severity-critical',
      'HIGH': 'severity-high',
      'MEDIUM': 'severity-medium',
      'LOW': 'severity-low'
    }[severity] || '';
    
    return `<span class="${colorClass}">${match}</span>`;
  });
  
  // Enhance formatting for issue sections
  processedText = enhanceIssueSections(processedText);
  
  return processedText;
};

// Process markdown in text with enhanced options (deprecated - use markdownProcessor.ts)
export const processMarkdownLegacy = (text: string): string => {
  console.warn('processMarkdownLegacy is deprecated. Use processMarkdown from markdownProcessor.ts instead.');
  
  if (!text) return '';
  
  // Preprocess text to preserve paragraph structure
  const preprocessedText = text
    .replace(/\n\s*\n/g, '\n\n')  // Normalize multiple line breaks
    .replace(/### /g, '\n\n### ')  // Ensure headers have proper spacing
    .replace(/## /g, '\n\n## ')    // Also ensure proper spacing for h2 headers
    .replace(/# /g, '\n\n# ');     // Also ensure proper spacing for h1 headers

  try {
    // Use the newer marked API
    const html = marked.parse(preprocessedText, {
      breaks: true,
      gfm: true,
    });
    return html as string;
  } catch (error) {
    console.error('Error processing markdown:', error);
    return text;
  }
};

// Enhance formatting for issue sections
const enhanceIssueSections = (text: string): string => {
  // No enhancement needed for short texts
  if (text.length < 100) return text;
  
  // Add special classes to structure issue sections better
  let enhanced = text;
  
  // Process critical issues section
  if (text.includes('CRITICAL')) {
    enhanced = enhanced.replace(
      /\*\*Issue:\*\*(.*?)(?=\*\*Issue:\*\*|\*\*Section:|$)/gs,
      '<div class="issue-section critical-issue"><div class="issue-header">**Issue:**$1</div>'
    );
  }
  
  // Process high severity issues section
  if (text.includes('HIGH')) {
    enhanced = enhanced.replace(
      /\*\*Issue:\*\*(.*?)(?=\*\*Issue:\*\*|\*\*Section:|$)/gs,
      '<div class="issue-section high-issue"><div class="issue-header">**Issue:**$1</div>'
    );
  }
  
  // Close issue section divs
  enhanced = enhanced.replace(/(\*\*Recommendation:\*\*.*?)(?=<div class="issue-|$)/gs, '$1</div>');
  
  // Format recommended actions list
  enhanced = enhanced.replace(
    /(\d+\.\s+.*?)(?=\d+\.\s+|$)/g,
    '<div class="recommendation-item"><div class="recommendation-number">$1</div></div>'
  );
  
  return enhanced;
};

/**
 * Extract severity levels from contract review text
 * @param text The contract review text
 * @returns Object with counts by severity
 */
export const extractSeverityLevels = (text: string): Record<string, number> => {
  const severityCounts = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };
  
  if (!text) return severityCounts;
  
  // Count CRITICAL issues
  const criticalMatches = text.match(/CRITICAL(\s+SEVERITY|\s+ISSUE|\:|\s*$)/g);
  if (criticalMatches) severityCounts.CRITICAL = criticalMatches.length;
  
  // Count HIGH issues
  const highMatches = text.match(/HIGH(\s+SEVERITY|\s+ISSUE|\:|\s*$)/g);
  if (highMatches) severityCounts.HIGH = highMatches.length;
  
  // Count MEDIUM issues
  const mediumMatches = text.match(/MEDIUM(\s+SEVERITY|\s+ISSUE|\:|\s*$)/g);
  if (mediumMatches) severityCounts.MEDIUM = mediumMatches.length;
  
  // Count LOW issues
  const lowMatches = text.match(/LOW(\s+SEVERITY|\s+ISSUE|\:|\s*$)/g);
  if (lowMatches) severityCounts.LOW = lowMatches.length;
  
  return severityCounts;
};

/**
 * Extract law references from text
 * @param text The text to process
 * @returns Array of law references
 */
export const extractLawReferences = (text: string): string[] => {
  if (!text) return [];
  
  const references: string[] = [];
  
  // Texas statutes pattern (e.g., Texas Family Code § 154.001)
  const texasStatutePattern = /(Texas\s+[A-Za-z]+(?:\s+[&]?\s*[A-Za-z]+)*\s+Code\s+§\s+\d+\.\d+(?:\(\w+\))?)/g;
  
  // Texas case law pattern (e.g., Smith v. Jones, 123 S.W.3d 456 (Tex. 2005))
  const texasCasePattern = /([A-Za-z]+\s+v\.\s+[A-Za-z]+,\s+\d+\s+S\.W\.\d+\s+\d+\s+\(Tex\.\s+\d{4}\))/g;
  
  // Extract statute references
  let match;
  while ((match = texasStatutePattern.exec(text)) !== null) {
    references.push(match[1]);
  }
  
  // Extract case law references
  while ((match = texasCasePattern.exec(text)) !== null) {
    references.push(match[1]);
  }
  
  // Remove duplicates
  return [...new Set(references)];
};
