
// Build attorney notes section
export const buildAttorneyNotesSection = (notesData: any) => {
  if (!notesData || notesData.length === 0) return "";
  
  let notesSection = "\n\n## ATTORNEY NOTES";
  notesData.forEach((note: any, index: number) => {
    notesSection += `\n${index + 1}. ${note.content}`;
  });
  
  return notesSection;
};
