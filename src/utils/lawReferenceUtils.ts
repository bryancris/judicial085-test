
/**
 * Utility functions for detecting and linking law references to the knowledge database
 * This file is maintained for backward compatibility and re-exports from the new module structure
 */

export {
  CITATION_PATTERNS,
  extractCitations,
  getDirectUrlForCitation,
  createLawLink,
  createLawReferenceLinkProps,
  searchLawDocuments,
  processLawReferences,
  processLawReferencesSync
} from './lawReferences';
