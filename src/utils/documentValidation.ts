
// Document validation utilities
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const parseDocumentId = (documentId: string): number | null => {
  const parsed = parseInt(documentId, 10);
  return isNaN(parsed) ? null : parsed;
};
