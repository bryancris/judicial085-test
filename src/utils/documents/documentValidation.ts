export const validateDocumentTitle = (title: string): { isValid: boolean; message: string } => {
  if (!title.trim()) {
    return { isValid: true, message: "" }; // Empty title is allowed
  }
  
  // Check for minimum length
  if (title.trim().length < 2) {
    return { isValid: false, message: "Title must be at least 2 characters long" };
  }
  
  // Check for maximum length
  if (title.length > 255) {
    return { isValid: false, message: "Title must be less than 255 characters" };
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(title)) {
    return { isValid: false, message: "Title contains invalid characters" };
  }
  
  return { isValid: true, message: "" };
};