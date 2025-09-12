import { PDFDocument } from 'npm:pdf-lib';
import { CaseAnalysisData } from './types.ts';
import { 
  initPdf, 
  drawTitle, 
  drawStepHeader, 
  drawSectionTitle, 
  drawSubsectionTitle, 
  drawKeyValue, 
  drawParagraph, 
  drawBulletList,
  drawChecklistItem,
  drawPartyInfo,
  drawTimelineEvent,
  ensureSpace
} from './pdfLayout.ts';

export async function generatePDF(data: CaseAnalysisData): Promise<Uint8Array> {
  console.log('📄 Starting PDF generation with 9-step structure');
  
  const { pdfDoc, ctx } = await initPdf();
  
  // Header with proper client name
  const clientName = data.client ? `${data.client.first_name} ${data.client.last_name}` : 'Unknown Client';
  drawTitle(ctx, `Case Analysis Report: ${clientName}`);
  ctx.y -= 20;
  
  drawKeyValue(ctx, 'Generated:', new Date().toLocaleDateString());
  drawKeyValue(ctx, 'Client:', clientName);
  if (data.client?.email) {
    drawKeyValue(ctx, 'Email:', data.client.email);
  }
  if (data.client?.phone) {
    drawKeyValue(ctx, 'Phone:', data.client.phone);
  }
  ctx.y -= 20;

  // Step 1: Case Summary (Organized Fact Pattern)
  ensureSpace(ctx, 200);
  drawStepHeader(ctx, 1, 'Case Summary (Organized Fact Pattern)');
  
  if (data.conversationSummary) {
    drawParagraph(ctx, data.conversationSummary);
    ctx.y -= 10;
  }
  
  if (data.structuredCaseData) {
    // Parties
    if (data.structuredCaseData.parties && data.structuredCaseData.parties.length > 0) {
      drawSubsectionTitle(ctx, 'Parties');
      data.structuredCaseData.parties.forEach(party => {
        drawPartyInfo(ctx, party.name, party.role);
      });
      ctx.y -= 10;
    }
    
    // Timeline
    if (data.structuredCaseData.timeline && data.structuredCaseData.timeline.length > 0) {
      drawSubsectionTitle(ctx, 'Timeline');
      data.structuredCaseData.timeline.forEach(event => {
        drawTimelineEvent(ctx, event.date, event.event);
      });
      ctx.y -= 10;
    }
    
    // Core Facts
    if (data.structuredCaseData.coreFacts && data.structuredCaseData.coreFacts.length > 0) {
      drawSubsectionTitle(ctx, 'Core Facts');
      drawBulletList(ctx, data.structuredCaseData.coreFacts);
      ctx.y -= 10;
    }
  }

  // Step 2: Preliminary Analysis
  ensureSpace(ctx, 200);
  drawStepHeader(ctx, 2, 'Preliminary Analysis (AI-assisted broad issue spotting)');
  if (data.preliminaryAnalysis) {
    drawParagraph(ctx, data.preliminaryAnalysis);
  } else {
    drawParagraph(ctx, 'No preliminary analysis available.');
  }
  ctx.y -= 20;

  // Step 3: Relevant Texas Laws
  ensureSpace(ctx, 200);
  drawStepHeader(ctx, 3, 'Relevant Texas Laws (Targeted legal research)');
  if (data.relevantLaw) {
    drawParagraph(ctx, data.relevantLaw);
  } else {
    drawParagraph(ctx, 'No relevant law analysis available.');
  }
  ctx.y -= 20;

  // Step 4: Additional Case Law
  ensureSpace(ctx, 200);
  drawStepHeader(ctx, 4, 'Additional Case Law (Precedent research)');
  
  if (data.additionalCaseLaw && data.additionalCaseLaw.length > 0) {
    data.additionalCaseLaw.forEach((caselaw, index) => {
      ensureSpace(ctx, 100);
      drawSubsectionTitle(ctx, `Case ${index + 1}: ${caselaw.case_name || 'Unnamed Case'}`);
      
      if (caselaw.citation) {
        drawKeyValue(ctx, 'Citation:', caselaw.citation);
      }
      if (caselaw.court) {
        drawKeyValue(ctx, 'Court:', caselaw.court);
      }
      if (caselaw.relevant_facts) {
        drawKeyValue(ctx, 'Relevant Facts:', caselaw.relevant_facts);
      }
      if (caselaw.outcome) {
        drawKeyValue(ctx, 'Outcome:', caselaw.outcome);
      }
      
      ctx.y -= 15;
    });
  } else {
    drawParagraph(ctx, 'No additional case law research available.');
  }
  ctx.y -= 20;

  // Step 5: IRAC Legal Analysis
  ensureSpace(ctx, 200);
  drawStepHeader(ctx, 5, 'IRAC Legal Analysis (Comprehensive deep analysis)');
  
  if (data.iracAnalysis && data.iracAnalysis.legalIssues && data.iracAnalysis.legalIssues.length > 0) {
    data.iracAnalysis.legalIssues.forEach((issue, index) => {
      ensureSpace(ctx, 150);
      drawParagraph(ctx, `Issue ${index + 1}: ${issue.issueStatement}`, { boldLabel: 'Issue:' });
      if (issue.rule) {
        drawParagraph(ctx, issue.rule, { boldLabel: 'Rule:' });
      }
      if (issue.application) {
        drawParagraph(ctx, issue.application, { boldLabel: 'Application:' });
      }
      if (issue.conclusion) {
        drawParagraph(ctx, issue.conclusion, { boldLabel: 'Conclusion:' });
      }
      ctx.y -= 15;
    });
  } else {
    drawParagraph(ctx, 'No IRAC analysis available.');
  }
  ctx.y -= 20;

  // Step 6: Case Strengths & Weaknesses
  ensureSpace(ctx, 200);
  drawStepHeader(ctx, 6, 'Case Strengths & Weaknesses (Risk assessment)');
  
  if (data.strengths && data.strengths.length > 0) {
    drawSubsectionTitle(ctx, 'Strengths');
    drawBulletList(ctx, data.strengths);
    ctx.y -= 10;
  }
  
  if (data.weaknesses && data.weaknesses.length > 0) {
    drawSubsectionTitle(ctx, 'Weaknesses');
    drawBulletList(ctx, data.weaknesses);
    ctx.y -= 10;
  }
  
  if ((!data.strengths || data.strengths.length === 0) && (!data.weaknesses || data.weaknesses.length === 0)) {
    drawParagraph(ctx, 'No strengths and weaknesses analysis available.');
  }
  ctx.y -= 20;

  // Step 7: Legal Requirements Verification & Case Conclusion
  ensureSpace(ctx, 300);
  drawStepHeader(ctx, 7, 'Legal Requirements Verification & Case Conclusion');
  
  if (data.legalRequirementsChecklist && data.legalRequirementsChecklist.length > 0) {
    drawSubsectionTitle(ctx, 'Legal Requirements Checklist');
    
    data.legalRequirementsChecklist.forEach((item, index) => {
      ensureSpace(ctx, 120);
      drawChecklistItem(ctx, {
        requirement: item.requirement,
        law: item.law,
        citation: item.citation,
        clientFacts: item.clientFacts,
        status: item.status,
        analysis: item.analysis
      });
      ctx.y -= 10;
    });
  }
  
  if (data.caseConclusion) {
    ensureSpace(ctx, 100);
    drawSubsectionTitle(ctx, 'Case Conclusion');
    drawParagraph(ctx, data.caseConclusion);
  } else if (data.refinedAnalysis) {
    ensureSpace(ctx, 100);
    drawSubsectionTitle(ctx, 'Refined Analysis');
    drawParagraph(ctx, data.refinedAnalysis);
  } else {
    drawParagraph(ctx, 'No legal requirements verification available.');
  }
  ctx.y -= 20;

  // Step 8: Recommended Follow-up Questions
  ensureSpace(ctx, 200);
  drawStepHeader(ctx, 8, 'Recommended Follow-up Questions');
  
  if (data.followUpQuestions && data.followUpQuestions.length > 0) {
    drawBulletList(ctx, data.followUpQuestions);
  } else {
    drawParagraph(ctx, 'No follow-up questions available.');
  }
  ctx.y -= 20;

  // Step 9: Law References
  ensureSpace(ctx, 200);
  drawStepHeader(ctx, 9, 'Law References (Vectorized Legal Documents)');
  
  if (data.lawReferences && data.lawReferences.length > 0) {
    data.lawReferences.forEach((ref, index) => {
      ensureSpace(ctx, 80);
      drawSubsectionTitle(ctx, `Reference ${index + 1}`);
      
      if (ref.title) {
        drawKeyValue(ctx, 'Title:', ref.title);
      }
      if (ref.url) {
        drawKeyValue(ctx, 'URL:', ref.url);
      }
      if (ref.content) {
        drawParagraph(ctx, ref.content.substring(0, 200) + (ref.content.length > 200 ? '...' : ''));
      }
      
      ctx.y -= 15;
    });
  } else {
    drawParagraph(ctx, 'No law references available.');
  }

  console.log('✅ PDF generation completed');
  return await pdfDoc.save();
}