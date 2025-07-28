
export interface ProcessPdfRequest {
  documentId: string;
  clientId: string | null;
  caseId?: string;
  title: string;
  fileUrl: string;
  fileName: string;
  userId?: string;
  firmId?: string;
}
