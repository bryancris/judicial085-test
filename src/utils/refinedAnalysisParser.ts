export interface RefinedAnalysisData {
  executiveSummary: string;
  riskAssessment: {
    overallRisk: 'high' | 'medium' | 'low';
    riskFactors: {
      level: 'high' | 'medium' | 'low';
      description: string;
    }[];
  };
  strategicRecommendations: string[];
  likelihoodOfSuccess: {
    percentage: number;
    factors: string[];
  };
}

/**
 * Parses refined analysis content from AI-generated text
 * Extracts: Executive Summary, Risk Assessment, Strategic Recommendations, Likelihood of Success
 */
export function parseRefinedAnalysis(content: string): RefinedAnalysisData | null {
  if (!content || typeof content !== 'string' || content.trim().length < 100) {
    return null;
  }

  try {
    const result: RefinedAnalysisData = {
      executiveSummary: '',
      riskAssessment: {
        overallRisk: 'medium',
        riskFactors: []
      },
      strategicRecommendations: [],
      likelihoodOfSuccess: {
        percentage: 50,
        factors: []
      }
    };

    // Extract Executive Summary
    const execSummaryMatch = content.match(/\*\*EXECUTIVE SUMMARY[:\s]*\*\*(.*?)(?=\*\*[A-Z\s]+:|$)/is);
    if (execSummaryMatch) {
      result.executiveSummary = cleanText(execSummaryMatch[1]);
    }

    // Extract Risk Assessment
    const riskMatch = content.match(/\*\*RISK ASSESSMENT[:\s]*\*\*(.*?)(?=\*\*[A-Z\s]+:|$)/is);
    if (riskMatch) {
      const riskText = riskMatch[1];
      
      // Extract overall risk level
      const overallRiskMatch = riskText.match(/overall\s+risk[:\s]*([a-z]+)/i);
      if (overallRiskMatch) {
        const risk = overallRiskMatch[1].toLowerCase();
        if (['low', 'medium', 'high'].includes(risk)) {
          result.riskAssessment.overallRisk = risk as 'low' | 'medium' | 'high';
        }
      }

      // Extract risk factors
      const riskFactors = extractBulletPoints(riskText, ['risk factor', 'concern', 'challenge', 'weakness']);
      result.riskAssessment.riskFactors = riskFactors.map(factor => ({
        level: determineRiskLevel(factor),
        description: factor
      }));
    }

    // Extract Strategic Recommendations
    const strategicMatch = content.match(/\*\*STRATEGIC RECOMMENDATIONS[:\s]*\*\*(.*?)(?=\*\*[A-Z\s]+:|$)/is);
    if (strategicMatch) {
      result.strategicRecommendations = extractBulletPoints(strategicMatch[1], ['recommend', 'suggest', 'consider', 'strategy']);
    }

    // Extract Likelihood of Success
    const successMatch = content.match(/\*\*LIKELIHOOD OF SUCCESS[:\s]*\*\*(.*?)(?=\*\*[A-Z\s]+:|$)/is);
    if (successMatch) {
      const successText = successMatch[1];
      
      // Extract percentage
      const percentMatch = successText.match(/(\d{1,3})%/);
      if (percentMatch) {
        const percentage = parseInt(percentMatch[1]);
        if (percentage >= 0 && percentage <= 100) {
          result.likelihoodOfSuccess.percentage = percentage;
        }
      }

      // Extract factors
      result.likelihoodOfSuccess.factors = extractBulletPoints(successText, ['factor', 'strength', 'advantage', 'support']);
    }

    // Validate we have meaningful content
    if (!result.executiveSummary && result.riskAssessment.riskFactors.length === 0 && 
        result.strategicRecommendations.length === 0 && result.likelihoodOfSuccess.factors.length === 0) {
      return null;
    }

    return result;

  } catch (error) {
    console.error('Error parsing refined analysis:', error);
    return null;
  }
}

/**
 * Cleans and formats text content
 */
function cleanText(text: string): string {
  return text
    .replace(/^\s*[-•*]\s*/gm, '') // Remove bullet points at start of lines
    .replace(/\*\*/g, '') // Remove markdown bold
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .trim();
}

/**
 * Extracts bullet points from text based on keywords
 */
function extractBulletPoints(text: string, keywords: string[] = []): string[] {
  const points: string[] = [];
  
  // Split by bullet point indicators
  const bulletRegex = /^\s*[-•*]\s*(.+)$/gm;
  let match;
  
  while ((match = bulletRegex.exec(text)) !== null) {
    const point = cleanText(match[1]);
    if (point.length > 10) { // Filter out very short points
      points.push(point);
    }
  }

  // If no bullet points found, try numbered lists
  if (points.length === 0) {
    const numberedRegex = /^\s*\d+\.\s*(.+)$/gm;
    while ((match = numberedRegex.exec(text)) !== null) {
      const point = cleanText(match[1]);
      if (point.length > 10) {
        points.push(point);
      }
    }
  }

  // If still no points, extract sentences that contain keywords
  if (points.length === 0 && keywords.length > 0) {
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
      const cleanSentence = cleanText(sentence);
      if (cleanSentence.length > 20 && 
          keywords.some(keyword => cleanSentence.toLowerCase().includes(keyword.toLowerCase()))) {
        points.push(cleanSentence);
      }
    }
  }

  return points.slice(0, 5); // Limit to 5 items for UI
}

/**
 * Determines risk level based on content keywords
 */
function determineRiskLevel(text: string): 'low' | 'medium' | 'high' {
  const lowText = text.toLowerCase();
  
  const highRiskKeywords = ['significant', 'major', 'serious', 'critical', 'severe', 'substantial', 'high', 'difficult'];
  const lowRiskKeywords = ['minor', 'small', 'manageable', 'low', 'minimal', 'unlikely', 'weak'];
  
  if (highRiskKeywords.some(keyword => lowText.includes(keyword))) {
    return 'high';
  }
  
  if (lowRiskKeywords.some(keyword => lowText.includes(keyword))) {
    return 'low';
  }
  
  return 'medium';
}

/**
 * Fallback parser for cases where standard parsing fails
 */
export function parseRefinedAnalysisFallback(content: string, caseType?: string): RefinedAnalysisData | null {
  if (!content || content.length < 50) {
    return null;
  }

  // Create basic analysis from any structured content
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  if (sentences.length < 3) {
    return null;
  }

  return {
    executiveSummary: sentences.slice(0, 2).join('. ') + '.',
    riskAssessment: {
      overallRisk: 'medium',
      riskFactors: [
        { level: 'medium', description: 'Analysis requires further development based on case facts' }
      ]
    },
    strategicRecommendations: [
      'Conduct thorough fact investigation',
      'Review applicable legal standards',
      'Evaluate strength of available evidence'
    ],
    likelihoodOfSuccess: {
      percentage: 50,
      factors: ['Case-specific analysis needed']
    }
  };
}