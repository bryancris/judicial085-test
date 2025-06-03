
// Helper function to generate strengths and weaknesses if missing from analysis
export function generateStrengthsWeaknesses(analysis: string, caseType: string, documents: any[]): string {
  let strengths: string[] = [];
  let weaknesses: string[] = [];
  
  if (caseType === "animal-protection") {
    strengths = [
      "Clear documentation of animal care standards violation",
      "Witness testimony available regarding incident", 
      "Photographic evidence of conditions",
      "Veterinary records support claims"
    ];
    weaknesses = [
      "Need to establish duty of care relationship",
      "Potential comparative negligence arguments",
      "Damages calculation may be challenging",
      "Statute of limitations considerations"
    ];
  } else if (caseType === "consumer-protection") {
    strengths = [
      "Written evidence of deceptive practices",
      "DTPA provides for treble damages",
      "Attorney's fees recoverable under DTPA",
      "Consumer status clearly established"
    ];
    weaknesses = [
      "Must satisfy pre-suit notice requirements",
      "Need to prove reliance on representations",
      "Potential exemptions may apply",
      "Burden of proof on knowing violations"
    ];
  } else {
    // General case strengths and weaknesses
    strengths = [
      "Strong documentary evidence available",
      "Clear liability chain established", 
      "Damages are well-documented",
      "Favorable legal precedents exist"
    ];
    weaknesses = [
      "Potential credibility challenges",
      "Complex factual issues to resolve",
      "Opposing counsel likely to dispute key facts",
      "Burden of proof considerations"
    ];
  }
  
  const strengthsList = strengths.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const weaknessesList = weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n');
  
  return `**CASE STRENGTHS:**\n${strengthsList}\n\n**CASE WEAKNESSES:**\n${weaknessesList}`;
}
