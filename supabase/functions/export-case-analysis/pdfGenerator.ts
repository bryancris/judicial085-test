import { PDFDocument, StandardFonts } from 'npm:pdf-lib';
import type { CaseAnalysisData } from './types.ts';
import {
  initPdf,
  drawTitle,
  drawSectionTitle,
  drawParagraph,
  drawKeyValue,
  drawBulletList,
} from './pdfLayout.ts';

// Modern 9-Step Case Analysis PDF Generator
export async function generatePDF(data: CaseAnalysisData): Promise<Uint8Array> {
  const { doc, ctx } = await initPdf();

  // Header
  drawTitle(ctx, 'Case Analysis Report');
  const generatedOn = new Date().toLocaleString();
  drawParagraph(ctx, `Generated on: ${generatedOn}`);

  // Client Information
  if (data.client) {
    drawSectionTitle(ctx, 'Client Information');
    drawKeyValue(ctx, 'Name', `${data.client.first_name ?? ''} ${data.client.last_name ?? ''}`.trim());
    const contact = [data.client.email, data.client.phone].filter(Boolean).join(' | ');
    drawKeyValue(ctx, 'Contact', contact || 'N/A');
    const addressParts = [data.client.address, data.client.city, data.client.state, data.client.zip_code]
      .filter(Boolean)
      .join(', ');
    if (addressParts) drawKeyValue(ctx, 'Address', addressParts);
  }

  // Case Information
  if (data.case) {
    drawSectionTitle(ctx, 'Case Details');
    drawKeyValue(ctx, 'Case Title', data.case.case_title || data.case.title || 'N/A');
    drawKeyValue(ctx, 'Case Number', data.case.case_number || 'N/A');
    if (data.case.case_description) drawParagraph(ctx, `Description: ${data.case.case_description}`);
    if (data.case.case_notes) drawParagraph(ctx, `Notes: ${data.case.case_notes}`);
  }

  // 9-Step Analysis Structure
  drawTitle(ctx, 'Legal Analysis (9-Step Method)');

  // Step 1: Case Summary (Organized Fact Pattern)
  drawStepHeader(ctx, 1, 'Case Summary (Organized Fact Pattern)');
  if (data.structuredCaseData) {
    if (data.structuredCaseData.parties?.length) {
      drawSubsectionTitle(ctx, 'Parties');
      const partyLines = data.structuredCaseData.parties.map(p => `${p.role}: ${p.name}`);
      drawBulletList(ctx, partyLines);
    }
    if (data.structuredCaseData.timeline?.length) {
      drawSubsectionTitle(ctx, 'Timeline');
      const timelineLines = data.structuredCaseData.timeline.map(t => `${t.date}: ${t.event}`);
      drawBulletList(ctx, timelineLines);
    }
    if (data.structuredCaseData.coreFacts?.length) {
      drawSubsectionTitle(ctx, 'Core Facts');
      drawBulletList(ctx, data.structuredCaseData.coreFacts);
    }
  } else if (data.conversationSummary) {
    drawParagraph(ctx, data.conversationSummary);
  }

  // Step 2: Preliminary Analysis
  drawStepHeader(ctx, 2, 'Preliminary Analysis (AI-assisted broad issue spotting)');
  if (data.preliminaryAnalysis || data.parsedAnalysis?.preliminaryAnalysis) {
    drawParagraph(ctx, data.preliminaryAnalysis || data.parsedAnalysis?.preliminaryAnalysis || '');
  }

  // Step 3: Relevant Texas Laws
  drawStepHeader(ctx, 3, 'Relevant Texas Laws (Targeted legal research)');
  if (data.relevantLaw || data.parsedAnalysis?.relevantLaw) {
    drawParagraph(ctx, data.relevantLaw || data.parsedAnalysis?.relevantLaw || '');
  }

  // Step 4: Additional Case Law
  drawStepHeader(ctx, 4, 'Additional Case Law (Precedent research)');
  if (Array.isArray(data.additionalCaseLaw) && data.additionalCaseLaw.length > 0) {
    const caseLines = data.additionalCaseLaw.map((c: any, idx: number) => {
      const title = c.case_name || c.title || 'Untitled';
      const citation = c.citation ? ` — ${c.citation}` : '';
      const court = c.court || '';
      return `${idx + 1}. ${title}${citation}${court ? ` (${court})` : ''}`;
    });
    drawBulletList(ctx, caseLines);
  }

  // Step 5: IRAC Legal Analysis
  drawStepHeader(ctx, 5, 'IRAC Legal Analysis (Comprehensive deep analysis)');
  if (data.iracAnalysis?.legalIssues?.length) {
    data.iracAnalysis.legalIssues.forEach((issue, idx) => {
      drawSubsectionTitle(ctx, `Issue ${idx + 1}: ${issue.category || 'Legal Issue'}`);
      drawKeyValue(ctx, 'Issue Statement', issue.issueStatement);
      drawKeyValue(ctx, 'Rule', issue.rule);
      drawKeyValue(ctx, 'Application', issue.application);
      drawKeyValue(ctx, 'Conclusion', issue.conclusion);
      if (issue.strength) {
        drawKeyValue(ctx, 'Strength Assessment', issue.strength.toUpperCase());
      }
    });
  }

  // Step 6: Case Strengths & Weaknesses
  drawStepHeader(ctx, 6, 'Case Strengths & Weaknesses (Combined risk assessment)');
  if (data.strengths?.length) {
    drawSubsectionTitle(ctx, 'Strengths');
    drawBulletList(ctx, data.strengths);
  }
  if (data.weaknesses?.length) {
    drawSubsectionTitle(ctx, 'Weaknesses');
    drawBulletList(ctx, data.weaknesses);
  }

  // Step 7: Legal Requirements Verification & Case Conclusion
  drawStepHeader(ctx, 7, 'Legal Requirements Verification & Case Conclusion');
  if (data.legalRequirementsChecklist?.length) {
    data.legalRequirementsChecklist.forEach((req, idx) => {
      drawSubsectionTitle(ctx, `${idx + 1}. ${req.requirement}`);
      drawKeyValue(ctx, 'Law', req.law);
      drawKeyValue(ctx, 'Citation', req.citation);
      drawKeyValue(ctx, 'Client Facts', req.clientFacts);
      const statusSymbol = req.status === 'meets' ? '✅' : req.status === 'does_not_meet' ? '❌' : '⚠️';
      drawKeyValue(ctx, 'Status', `${statusSymbol} ${req.status.replace('_', ' ')}`);
      if (req.analysis) drawKeyValue(ctx, 'Analysis', req.analysis);
    });
  }
  if (data.caseConclusion) {
    drawSubsectionTitle(ctx, 'CONCLUSION');
    drawParagraph(ctx, data.caseConclusion);
  } else if (data.refinedAnalysis) {
    drawParagraph(ctx, data.refinedAnalysis);
  }

  // Step 8: Recommended Follow-up Questions
  drawStepHeader(ctx, 8, 'Recommended Follow-up Questions');
  if (data.followUpQuestions?.length) {
    drawBulletList(ctx, data.followUpQuestions);
  }

  // Step 9: Law References
  drawStepHeader(ctx, 9, 'Relevant Texas Law References (Vectorized Legal Documents)');
  if (Array.isArray(data.lawReferences) && data.lawReferences.length > 0) {
    const refLines = data.lawReferences.map((r: any, idx: number) => {
      const title = r.title || 'Legal Reference';
      const url = r.url ? ` — ${r.url}` : '';
      return `${idx + 1}. ${title}${url}`;
    });
    drawBulletList(ctx, refLines);
  }

  // Additional Supporting Information
  if (Array.isArray(data.similarCases) && data.similarCases.length > 0) {
    drawSectionTitle(ctx, 'Similar Cases (Reference)');
    const lines = data.similarCases.map((c: any, idx: number) => {
      const title = c.case_name || c.title || 'Untitled';
      const citation = c.citation ? ` — ${c.citation}` : '';
      const court = c.court_name || c.court || '';
      return `${idx + 1}. ${title}${citation}${court ? ` (${court})` : ''}`;
    });
    drawBulletList(ctx, lines);
  }

  // Attorney Notes
  if (Array.isArray(data.notes) && data.notes.length > 0) {
    drawSectionTitle(ctx, 'Attorney Notes');
    const lines = data.notes.map((n: any, i: number) => `${i + 1}. ${n.content ?? ''}`.trim()).filter(Boolean);
    drawBulletList(ctx, lines);
  }

  // Documents
  if (Array.isArray(data.documents) && data.documents.length > 0) {
    drawSectionTitle(ctx, 'Case Documents');
    const lines = data.documents.map((d: any) => `${d.title || 'Document'}${d.url ? ` — ${d.url}` : ''}`);
    drawBulletList(ctx, lines);
  }

  // Footer note
  drawParagraph(ctx, '— End of Report —');

  const pdfBytes = await doc.save();
  return pdfBytes;
}
