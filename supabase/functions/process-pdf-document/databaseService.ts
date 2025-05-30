
import { generateAndStoreEmbeddings } from './services/embeddingService.ts';
import { updateDocumentStatus, cleanupFailedDocument } from './services/documentStatusService.ts';

// Re-export the main functions for backward compatibility
export { generateAndStoreEmbeddings, updateDocumentStatus, cleanupFailedDocument };
