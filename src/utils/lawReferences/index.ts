
/**
 * Index file for law reference utilities
 * Re-exports all the utilities for easy importing
 */

export { CITATION_PATTERNS } from './citationPatterns';
export { extractCitations, getDirectUrlForCitation } from './citationUtils';
export { createLawLink, createLawReferenceLinkProps } from './linkUtils';
export { searchLawDocuments } from './searchUtils';
export { processLawReferences, processLawReferencesSync } from './processor';
export { formatCitationWithContext, enhanceConsumerProtectionAnalysis } from './consumerProtectionUtils';
