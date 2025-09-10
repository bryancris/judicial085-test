
// Helper function to generate minimal fallback strengths and weaknesses only when AI completely fails
export function generateStrengthsWeaknesses(analysis: string, caseType: string, documents: any[]): string {
  console.log('⚠️ Using fallback strengths/weaknesses generator - AI generation failed');
  
  // Only provide very basic fallback when AI completely fails to generate any content
  const fallbackStrengths = [
    "Analysis of case facts reveals potential legal claims",
    "Available evidence requires further evaluation"
  ];
  
  const fallbackWeaknesses = [
    "Additional fact development needed",
    "Further legal research required"
  ];
  
  const strengthsList = fallbackStrengths.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const weaknessesList = fallbackWeaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n');
  
  return `**CASE STRENGTHS:**\n${strengthsList}\n\n**CASE WEAKNESSES:**\n${weaknessesList}`;
}
