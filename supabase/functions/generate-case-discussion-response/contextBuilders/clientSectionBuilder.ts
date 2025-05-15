
// Build the context for the AI based on client data
export const buildClientSection = (clientData: any) => {
  if (!clientData) return { clientSection: "", caseTypesSection: "", caseDetailsSection: "" };
  
  let clientSection = `\n\n## CLIENT INFORMATION\nName: ${clientData.first_name} ${clientData.last_name}`;
  
  // Add case types as a primary context element if available
  let caseTypesSection = "";
  if (clientData.case_types && clientData.case_types.length > 0) {
    caseTypesSection = `\n\n## CASE TYPE\n${clientData.case_types.join(", ")}`;
  }
  
  // Build comprehensive case details section
  let caseDetailsSection = "\n\n## CASE DETAILS";
  
  // Add case number if available
  if (clientData.case_number) {
    caseDetailsSection += `\nCase Number: ${clientData.case_number}`;
  }
  
  // Add case description if available
  if (clientData.case_description) {
    caseDetailsSection += `\n\nCase Description: ${clientData.case_description}`;
  }
  
  // Add case notes if available - critical for context
  if (clientData.case_notes) {
    caseDetailsSection += `\n\nCase Notes: ${clientData.case_notes}`;
  }
  
  // Add address information if available
  let addressInfo = "";
  if (clientData.address) {
    addressInfo += clientData.address;
    if (clientData.city) addressInfo += `, ${clientData.city}`;
    if (clientData.state) addressInfo += `, ${clientData.state}`;
    if (clientData.zip_code) addressInfo += ` ${clientData.zip_code}`;
    
    if (addressInfo) {
      caseDetailsSection += `\n\nClient Address: ${addressInfo}`;
    }
  }
  
  // Add contact information
  caseDetailsSection += `\nContact: ${clientData.email || 'N/A'} | ${clientData.phone || 'N/A'}`;
  
  return { clientSection, caseTypesSection, caseDetailsSection };
};
