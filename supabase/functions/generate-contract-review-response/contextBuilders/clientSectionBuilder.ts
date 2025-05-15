
// Build client information section
export function buildClientSection(clientData: any) {
  if (!clientData) return "";
  
  let sectionText = "\n\n## CLIENT INFORMATION\n";
  sectionText += `Client Name: ${clientData.first_name} ${clientData.last_name}\n`;
  
  if (clientData.email) {
    sectionText += `Email: ${clientData.email}\n`;
  }
  
  if (clientData.phone) {
    sectionText += `Phone: ${clientData.phone}\n`;
  }
  
  // Add address if available
  let addressComponents = [];
  if (clientData.address) addressComponents.push(clientData.address);
  if (clientData.city) addressComponents.push(clientData.city);
  if (clientData.state) addressComponents.push(clientData.state);
  if (clientData.zip_code) addressComponents.push(clientData.zip_code);
  
  if (addressComponents.length > 0) {
    sectionText += `Address: ${addressComponents.join(", ")}\n`;
  }
  
  // Include any case types information
  if (clientData.case_types && clientData.case_types.length > 0) {
    sectionText += `Case Types: ${clientData.case_types.join(", ")}\n`;
  }
  
  if (clientData.case_description) {
    sectionText += `Case Description: ${clientData.case_description}\n`;
  }
  
  return sectionText;
}
