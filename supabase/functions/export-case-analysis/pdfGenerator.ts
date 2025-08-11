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

// Native PDF generator using pdf-lib (no external APIs)
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

  // Analysis Summary (parsed)
  if (data.parsedAnalysis) {
    drawSectionTitle(ctx, 'Legal Analysis Summary');
    if (data.parsedAnalysis.caseType) drawKeyValue(ctx, 'Case Type', data.parsedAnalysis.caseType);
    if (data.parsedAnalysis.relevantLaw) {
      drawParagraph(ctx, `Relevant Law: ${data.parsedAnalysis.relevantLaw}`);
    }
    if (data.parsedAnalysis.preliminaryAnalysis) {
      drawParagraph(ctx, `Preliminary Analysis: ${data.parsedAnalysis.preliminaryAnalysis}`);
    }
    if (data.parsedAnalysis.potentialIssues) {
      drawParagraph(ctx, 'Potential Issues:');
      drawBulletList(ctx, data.parsedAnalysis.potentialIssues.split(/\n|\r/g).filter(Boolean));
    }
    if (data.parsedAnalysis.strengths?.length) {
      drawParagraph(ctx, 'Strengths:');
      drawBulletList(ctx, data.parsedAnalysis.strengths);
    }
    if (data.parsedAnalysis.weaknesses?.length) {
      drawParagraph(ctx, 'Weaknesses:');
      drawBulletList(ctx, data.parsedAnalysis.weaknesses);
    }
    if (data.parsedAnalysis.followUpQuestions?.length) {
      drawParagraph(ctx, 'Recommended Follow-up Questions:');
      drawBulletList(ctx, data.parsedAnalysis.followUpQuestions);
    }
  } else if (data.analysis?.content) {
    // Fallback to raw analysis text
    drawSectionTitle(ctx, 'Legal Analysis');
    drawParagraph(ctx, data.analysis.content);
  }

  // Similar Cases
  if (Array.isArray(data.similarCases) && data.similarCases.length > 0) {
    drawSectionTitle(ctx, 'Similar Cases');
    const lines = data.similarCases.map((c: any, idx: number) => {
      const title = c.case_name || c.title || 'Untitled';
      const citation = c.citation ? ` — ${c.citation}` : '';
      const court = c.court_name || c.court || '';
      return `${idx + 1}. ${title}${citation}${court ? ` (${court})` : ''}`;
    });
    drawBulletList(ctx, lines);
  }

  // Scholarly References
  if (Array.isArray(data.scholarlyReferences) && data.scholarlyReferences.length > 0) {
    drawSectionTitle(ctx, 'Scholarly References');
    const lines = data.scholarlyReferences.map((r: any) => r.title || r.reference || r.url || 'Reference');
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

  // Conversation Summary (optional, keep short)
  if (Array.isArray(data.messages) && data.messages.length > 0) {
    drawSectionTitle(ctx, 'Conversation Summary');
    const recent = data.messages.slice(-8); // keep it brief
    for (const m of recent) {
      drawParagraph(ctx, `${(m.role || 'user').toUpperCase()}: ${m.content || ''}`);
    }
  }

  // Footer note
  drawParagraph(ctx, '— End of Report —');

  const pdfBytes = await doc.save();
  return pdfBytes;
}
