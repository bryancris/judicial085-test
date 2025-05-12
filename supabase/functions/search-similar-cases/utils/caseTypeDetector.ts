
import { extractSection } from "../utils/textUtils.ts";

// Enhanced case type identification from the analysis
export function identifyCaseType(analysis: string, issues: string, law: string): string {
  if (!analysis && !issues && !law) return "unknown";
  
  const combinedText = (analysis + " " + issues + " " + law).toLowerCase();
  
  // Check for bailment/property cases first (like the vehicle theft case)
  if (
    (combinedText.includes("bailment") || 
     combinedText.includes("bailee") || 
     combinedText.includes("bailor")) ||
    ((combinedText.includes("property") || combinedText.includes("vehicle") || 
      combinedText.includes("car") || combinedText.includes("automobile")) && 
     (combinedText.includes("theft") || combinedText.includes("stolen") || 
      combinedText.includes("damage") || combinedText.includes("lost")))
  ) {
    return "bailment";
  }
  
  // Check for slip and fall / premises liability
  if ((combinedText.includes("slip") && combinedText.includes("fall")) || 
      combinedText.includes("premises liability")) {
    return "premises-liability";
  }
  
  // Check for motor vehicle accidents
  if ((combinedText.includes("car accident") || 
       combinedText.includes("motor vehicle") || 
       combinedText.includes("auto accident") || 
       combinedText.includes("collision")) && 
      !combinedText.includes("theft")) {
    return "motor-vehicle-accident";
  }
  
  // Check for medical malpractice
  if (combinedText.includes("medical malpractice") || 
      (combinedText.includes("medical") && 
       (combinedText.includes("negligence") || combinedText.includes("doctor")))) {
    return "medical-malpractice";
  }
  
  // Check for product liability
  if (combinedText.includes("product liability") || 
      combinedText.includes("defective product")) {
    return "product-liability";
  }
  
  // Check for contract disputes
  if (combinedText.includes("contract") || 
      combinedText.includes("agreement") || 
      combinedText.includes("breach")) {
    return "contract-dispute";
  }
  
  // Check for employment cases
  if (combinedText.includes("employment") || 
      combinedText.includes("wrongful termination") || 
      combinedText.includes("discrimination") || 
      combinedText.includes("workplace")) {
    return "employment";
  }
  
  // Default case type if no specific pattern is detected
  return "general-liability";
}
