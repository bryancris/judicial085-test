
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
      'CRITICAL': 'text-red-600 font-bold',
      'HIGH': 'text-orange-500 font-bold',
      'MEDIUM': 'text-yellow-600 font-bold',
      'LOW': 'text-green-600 font-bold'
    }[severity] || '';
    
    return `<span class="${colorClass}">${match}</span>`;
  });
  
  return processedText;
};

// Process markdown in text
export const processMarkdown = (text: string): string => {
  if (!text) return '';
  
  // Use marked to process markdown
  return marked(text) as string;
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
  const criticalMatches = text.match(/CRITICAL(\s+SEVERITY|\s+ISSUE|\:)/g);
  if (criticalMatches) severityCounts.CRITICAL = criticalMatches.length;
  
  // Count HIGH issues
  const highMatches = text.match(/HIGH(\s+SEVERITY|\s+ISSUE|\:)/g);
  if (highMatches) severityCounts.HIGH = highMatches.length;
  
  // Count MEDIUM issues
  const mediumMatches = text.match(/MEDIUM(\s+SEVERITY|\s+ISSUE|\:)/g);
  if (mediumMatches) severityCounts.MEDIUM = mediumMatches.length;
  
  // Count LOW issues
  const lowMatches = text.match(/LOW(\s+SEVERITY|\s+ISSUE|\:)/g);
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
