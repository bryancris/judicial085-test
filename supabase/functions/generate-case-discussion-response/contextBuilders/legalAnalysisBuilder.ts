
// Build legal analysis section with enhanced formatting and extraction
export const buildLegalAnalysisSection = (analysisData: any) => {
  let legalAnalysisText = "\n\n## LEGAL ANALYSIS";
  
  if (analysisData && analysisData.length > 0) {
    console.log("Processing legal analysis with length: " + analysisData[0].content.length);
    const analysisContent = analysisData[0].content;
    
    // Try to parse and highlight key sections from analysis with more detailed extraction
    try {
      // Log the first part of analysis content to help with debugging
      console.log("Analysis content preview: " + analysisContent.substring(0, 200) + "...");
      
      // Extract more structured data from the legal analysis
      let structuredAnalysis = "";
      
      // First look for case type information
      const caseTypeMatch = analysisContent.match(/Case Type[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
      if (caseTypeMatch && caseTypeMatch[1]) {
        structuredAnalysis += `\n\nCASE TYPE: ${caseTypeMatch[1].trim()}`;
        console.log("Found case type in analysis: " + caseTypeMatch[1].trim());
      }
      
      // Extract relevant laws section - expanded pattern matching
      if (analysisContent.includes("Relevant Law") || analysisContent.includes("Applicable Law")) {
        const relevantLawMatch = analysisContent.match(/(Relevant|Applicable) Law[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
        if (relevantLawMatch && relevantLawMatch[2]) {
          structuredAnalysis += `\n\nRELEVANT LAW: ${relevantLawMatch[2].trim()}`;
          console.log("Found relevant law section with length: " + relevantLawMatch[2].trim().length);
        }
      }
      
      // Extract case facts if available
      const factsMatch = analysisContent.match(/(?:Case Facts|Facts of the Case)[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
      if (factsMatch && factsMatch[1]) {
        structuredAnalysis += `\n\nCASE FACTS: ${factsMatch[1].trim()}`;
        console.log("Found case facts section");
      }
      
      // Extract strengths and weaknesses with improved pattern matching
      const strengthsMatch = analysisContent.match(/(?:Strengths|Case Strengths|Pros)[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
      const weaknessesMatch = analysisContent.match(/(?:Weaknesses|Case Weaknesses|Cons)[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
      
      if (strengthsMatch && strengthsMatch[1]) {
        structuredAnalysis += `\n\nCASE STRENGTHS: ${strengthsMatch[1].trim()}`;
        console.log("Found case strengths section");
      }
      
      if (weaknessesMatch && weaknessesMatch[1]) {
        structuredAnalysis += `\n\nCASE WEAKNESSES: ${weaknessesMatch[1].trim()}`;
        console.log("Found case weaknesses section");
      }
      
      // Extract legal strategy if available
      const strategyMatch = analysisContent.match(/(?:Legal Strategy|Strategy|Approach)[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
      if (strategyMatch && strategyMatch[1]) {
        structuredAnalysis += `\n\nLEGAL STRATEGY: ${strategyMatch[1].trim()}`;
        console.log("Found legal strategy section");
      }
      
      // Extract potential outcomes if available
      const outcomesMatch = analysisContent.match(/(?:Potential Outcomes|Outcomes|Possible Results)[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
      if (outcomesMatch && outcomesMatch[1]) {
        structuredAnalysis += `\n\nPOTENTIAL OUTCOMES: ${outcomesMatch[1].trim()}`;
        console.log("Found potential outcomes section");
      }
      
      // If we extracted structured data, use it; otherwise fall back to the full analysis
      if (structuredAnalysis) {
        legalAnalysisText += structuredAnalysis;
        console.log("Using structured analysis format with sections extracted");
      } else {
        // If no structured data was extracted, use the full content but still try to format it
        console.log("No structured sections found, using full analysis content");
        
        // Try to find any section headers and format them properly
        const formattedContent = analysisContent
          .replace(/^([A-Z][A-Za-z\s]+):$/gm, '\n\n$1:') // Format section headers
          .replace(/(\n\n\n+)/g, '\n\n'); // Remove excessive newlines
          
        legalAnalysisText += `\n${formattedContent}`;
      }
    } catch (parseError) {
      // If parsing fails, use the raw analysis but log the error
      console.error("Error parsing legal analysis:", parseError);
      legalAnalysisText += `\n${analysisContent}`;
    }
  } else {
    legalAnalysisText += `\nNo legal analysis has been generated for this case yet.`;
    console.log("No legal analysis found for this client");
  }
  
  return legalAnalysisText;
};
