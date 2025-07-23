/**
 * Enhanced response formatting utilities for case discussion responses
 */

import { PerplexityResearchResult, Citation } from "./perplexityService.ts";

/**
 * Format research results with enhanced presentation
 */
export const formatEnhancedResearchResponse = (
  aiResponse: string,
  researchResult: PerplexityResearchResult
): string => {
  // Get citation type icons
  const getCitationIcon = (type: Citation['type']): string => {
    switch (type) {
      case 'case': return '⚖️';
      case 'statute': return '📜';
      case 'regulation': return '📋';
      case 'url': return '🔗';
      default: return '📄';
    }
  };

  // Format confidence indicator
  const getConfidenceIndicator = (confidence: number): string => {
    if (confidence >= 0.8) return '🟢 High Confidence';
    if (confidence >= 0.6) return '🟡 Medium Confidence';
    return '🟠 Low Confidence';
  };

  // Group citations by type
  const groupedCitations = researchResult.citations.reduce((groups, citation) => {
    const type = citation.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(citation);
    return groups;
  }, {} as Record<string, Citation[]>);

  // Format citation groups
  const formatCitationGroup = (type: string, citations: Citation[]): string => {
    if (citations.length === 0) return '';
    
    const icon = getCitationIcon(type as Citation['type']);
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + 's';
    
    let section = `**${icon} ${typeLabel}:**\n`;
    citations.forEach(citation => {
      let formattedCitation = `• ${citation.text}`;
      if (citation.jurisdiction) formattedCitation += ` (${citation.jurisdiction})`;
      if (citation.year) formattedCitation += ` - ${citation.year}`;
      section += formattedCitation + '\n';
    });
    return section + '\n';
  };

  // Build structured response
  let enhancedResponse = aiResponse + '\n\n---\n\n';
  
  // Research header with metadata
  enhancedResponse += `## 🔍 Legal Research Analysis\n\n`;
  enhancedResponse += `**Research Quality:** ${getConfidenceIndicator(researchResult.confidence)}\n`;
  enhancedResponse += `**Primary Authorities Found:** ${researchResult.researchMetadata.primaryAuthorities}\n`;
  enhancedResponse += `**Secondary Sources:** ${researchResult.researchMetadata.secondaryAuthorities}\n`;
  enhancedResponse += `**Search Time:** ${researchResult.researchMetadata.searchTime}ms\n\n`;

  // Main research content
  enhancedResponse += `### 📚 Research Findings\n\n`;
  enhancedResponse += researchResult.content + '\n\n';

  // Structured citations section
  if (researchResult.citations.length > 0) {
    enhancedResponse += `### 📖 Legal Authorities\n\n`;
    
    // Primary authorities first
    const primaryTypes = ['case', 'statute', 'regulation'];
    primaryTypes.forEach(type => {
      if (groupedCitations[type]) {
        enhancedResponse += formatCitationGroup(type, groupedCitations[type]);
      }
    });
    
    // Secondary authorities
    const secondaryTypes = ['url', 'other'];
    secondaryTypes.forEach(type => {
      if (groupedCitations[type]) {
        enhancedResponse += formatCitationGroup(type, groupedCitations[type]);
      }
    });
  }

  // Research metadata footer
  enhancedResponse += `---\n\n`;
  enhancedResponse += `*Research completed using ${researchResult.model}*\n`;
  enhancedResponse += `*Query: "${researchResult.query}"*\n`;
  
  return enhancedResponse;
};

/**
 * Create a collapsible research section for complex responses
 */
export const createCollapsibleResearchSection = (
  researchResult: PerplexityResearchResult
): string => {
  const primaryCount = researchResult.researchMetadata.primaryAuthorities;
  const totalCitations = researchResult.citations.length;
  
  let section = `<details>\n`;
  section += `<summary>📚 **Legal Research** (${primaryCount} primary authorities, ${totalCitations} total sources)</summary>\n\n`;
  section += researchResult.content + '\n\n';
  
  if (researchResult.citations.length > 0) {
    section += `**Key Citations:**\n`;
    researchResult.citations.slice(0, 5).forEach(citation => {
      const icon = citation.type === 'case' ? '⚖️' : citation.type === 'statute' ? '📜' : '📄';
      section += `• ${icon} ${citation.text}\n`;
    });
  }
  
  section += `\n</details>\n\n`;
  return section;
};