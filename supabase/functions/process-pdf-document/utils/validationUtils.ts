
// Extraction validation utilities

export function validateExtraction(result: any): boolean {
  return result && result.text && result.text.length > 30 && result.quality > 0.1;
}
