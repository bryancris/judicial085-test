/**
 * Comprehensive Texas statute summaries for interactive citations
 */

import { generateDirectPdfUrl } from '@/utils/lawReferences/knowledgeBaseMapping';

export interface StatuteSummary {
  citation: string;
  title: string;
  summary: string;
  category: 'consumer' | 'business' | 'civil' | 'criminal' | 'government' | 'occupations';
  pdfUrl?: string;
}

/**
 * Texas Business & Commerce Code - Consumer Protection
 */
export const businessCommerceStatutes: Record<string, StatuteSummary> = {
  '17.41': {
    citation: 'Tex. Bus. & Com. Code § 17.41',
    title: 'Legislative Declaration',
    summary: 'Purpose and intent of the Deceptive Trade Practices Act',
    category: 'consumer'
  },
  '17.45': {
    citation: 'Tex. Bus. & Com. Code § 17.45',
    title: 'Definitions',
    summary: 'Key definitions including "consumer", "goods", "services", and "trade"',
    category: 'consumer'
  },
  '17.46': {
    citation: 'Tex. Bus. & Com. Code § 17.46',
    title: 'Deceptive Trade Practices Unlawful',
    summary: 'The "laundry list" of prohibited deceptive practices',
    category: 'consumer'
  },
  '17.50': {
    citation: 'Tex. Bus. & Com. Code § 17.50',
    title: 'Relief for Consumers',
    summary: 'Private right of action, damages, and attorney\'s fees for DTPA violations',
    category: 'consumer'
  },
  '17.505': {
    citation: 'Tex. Bus. & Com. Code § 17.505',
    title: 'Settlement Procedures',
    summary: 'Pre-suit notice requirements and settlement procedures',
    category: 'consumer'
  }
};

/**
 * Texas Occupations Code - Motor Vehicle Industry
 */
export const occupationsCodeStatutes: Record<string, StatuteSummary> = {
  '2301.002': {
    citation: 'Tex. Occ. Code § 2301.002',
    title: 'Purposes',
    summary: 'Legislative purposes of the Motor Vehicle Commission Code',
    category: 'occupations'
  },
  '2301.003': {
    citation: 'Tex. Occ. Code § 2301.003',
    title: 'Definitions',
    summary: 'Key definitions for motor vehicle sales and warranties',
    category: 'occupations'
  },
  '2301.204': {
    citation: 'Tex. Occ. Code § 2301.204',
    title: 'Warranty Performance Obligations',
    summary: 'Manufacturer obligations to perform warranty work in reasonable time',
    category: 'occupations'
  },
  '2301.601': {
    citation: 'Tex. Occ. Code § 2301.601',
    title: 'Warranty Defect Complaints',
    summary: 'Consumer remedies for warranty defects and lemon law procedures',
    category: 'occupations'
  }
};

/**
 * Texas Civil Practice & Remedies Code
 */
export const civilPracticeStatutes: Record<string, StatuteSummary> = {
  '16.003': {
    citation: 'Tex. Civ. Prac. & Rem. Code § 16.003',
    title: 'Two-Year Limitations Period',
    summary: 'Two-year statute of limitations for personal injury, fraud, and other claims',
    category: 'civil'
  },
  '41.001': {
    citation: 'Tex. Civ. Prac. & Rem. Code § 41.001',
    title: 'Definitions for Punitive Damages',
    summary: 'Definitions of "exemplary damages" and standards for award',
    category: 'civil'
  },
  '101.021': {
    citation: 'Tex. Civ. Prac. & Rem. Code § 101.021',
    title: 'Waiver of Governmental Immunity',
    summary: 'Conditions under which governmental immunity is waived',
    category: 'government'
  }
};

/**
 * Get statute summary by citation
 */
export const getStatuteSummary = (citation: string): StatuteSummary | null => {
  // Normalize citation to extract section number
  const sectionMatch = citation.match(/(\d{1,4}\.\d{1,4}(?:\.\d+)?)/);
  if (!sectionMatch) return null;
  
  const section = sectionMatch[1];
  
  // Check different code databases
  const allStatutes = {
    ...businessCommerceStatutes,
    ...occupationsCodeStatutes,
    ...civilPracticeStatutes
  };
  
  return allStatutes[section] || null;
};

/**
 * Determine if citation is a statute vs case law
 */
export const isStatuteCitation = (citation: string): boolean => {
  const statutePatterns = [
    /\b(?:Tex\.|Texas)\s+\w+\.?\s+Code/i,
    /\b(?:§|[Ss]ec(?:tion)?\.?)\s*\d+\.\d+/,
    /\bCode\s+(?:§|[Ss]ec(?:tion)?\.?)/i
  ];
  
  return statutePatterns.some(pattern => pattern.test(citation));
};

/**
 * Generate PDF URL for a statute based on its citation
 */
export const getStatutePdfUrl = (citation: string): string | null => {
  // Extract section number to determine which code
  const sectionMatch = citation.match(/(\d{1,4}\.\d{1,4})/);
  if (!sectionMatch) return null;
  
  const section = sectionMatch[1];
  
  // Map section ranges to actual PDF filenames in Supabase storage
  if (section.startsWith('17.')) {
    return generateDirectPdfUrl('BUSINESSANDCOMMERCECODE.pdf');
  } else if (section.startsWith('2301.')) {
    // Motor vehicle laws are in Business & Commerce Code
    return generateDirectPdfUrl('BUSINESSANDCOMMERCECODE.pdf');
  } else if (section.startsWith('16.') || section.startsWith('41.') || section.startsWith('101.')) {
    return generateDirectPdfUrl('CIVILPRACTICEANDREMEDIESCODE.pdf');
  } else if (section.startsWith('311.')) {
    return generateDirectPdfUrl('GOVERNMENTCODE.pdf');
  }
  
  return null;
};