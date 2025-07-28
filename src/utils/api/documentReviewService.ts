import { invokeFunction } from "./baseApiService";

export interface DocumentReviewResponse {
  review: string;
  documentTitle: string;
  error?: string;
}

export const reviewUploadedDocument = async (
  documentId: string,
  documentTitle?: string
): Promise<DocumentReviewResponse> => {
  try {
    const { data, error } = await invokeFunction<{
      review: string;
      documentTitle: string;
    }>("review-uploaded-document", { 
      documentId,
      documentTitle
    });

    if (error) {
      return { review: "", documentTitle: "", error };
    }

    return { 
      review: data?.review || "",
      documentTitle: data?.documentTitle || "",
    };
  } catch (err: any) {
    console.error("Error in document review:", err);
    return { review: "", documentTitle: "", error: err.message };
  }
};