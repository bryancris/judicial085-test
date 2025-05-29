
export interface ProcessPdfRequest {
  documentId: string;
  clientId: string;
  caseId?: string;
  title: string;
  fileUrl: string;
  fileName: string;
}
