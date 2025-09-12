import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib';
import type { PDFFont, PDFPage } from 'npm:pdf-lib';

export interface PdfContext {
  doc: PDFDocument;
  page: PDFPage;
  margin: number;
  x: number;
  y: number;
  width: number;
  height: number;
  font: PDFFont;
  boldFont: PDFFont;
  fontSize: number;
  lineHeight: number;
}

export async function initPdf(options?: { margin?: number; fontSize?: number; lineHeight?: number }): Promise<{ doc: PDFDocument; ctx: PdfContext }>{
  const doc = await PDFDocument.create();
  // A4 size
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = options?.margin ?? 48;
  const fontSize = options?.fontSize ?? 11;
  const lineHeight = options?.lineHeight ?? 1.4;

  const ctx: PdfContext = {
    doc,
    page,
    margin,
    x: margin,
    y: page.getHeight() - margin,
    width: page.getWidth(),
    height: page.getHeight(),
    font,
    boldFont,
    fontSize,
    lineHeight,
  };
  return { doc, ctx };
}

export function addPage(ctx: PdfContext) {
  ctx.page = ctx.doc.addPage([595.28, 841.89]);
  ctx.width = ctx.page.getWidth();
  ctx.height = ctx.page.getHeight();
  ctx.x = ctx.margin;
  ctx.y = ctx.height - ctx.margin;
}

export function ensureSpace(ctx: PdfContext, requiredHeight: number) {
  if (ctx.y - requiredHeight < ctx.margin) {
    addPage(ctx);
  }
}

export function drawChecklistItem(ctx: PdfContext, item: any) {
  if (!item) return;
  
  const status = item.status ? '✅' : '❌';
  const statusColor = item.status ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0);
  
  // Draw status indicator
  ctx.page.drawText(status, {
    x: ctx.x,
    y: ctx.y - 12,
    size: 12,
    font: ctx.font,
    color: statusColor,
  });
  
  // Draw requirement
  if (item.requirement) {
    ctx.page.drawText(item.requirement, {
      x: ctx.x + 20,
      y: ctx.y - 12,
      size: ctx.fontSize,
      font: ctx.boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    ctx.y -= 16;
  }
  
  // Draw law reference
  if (item.law) {
    drawParagraph(ctx, `Law: ${item.law}`, { size: ctx.fontSize - 1 });
  }
  
  // Draw analysis
  if (item.analysis) {
    drawParagraph(ctx, `Analysis: ${item.analysis}`, { size: ctx.fontSize - 1 });
  }
  
  ctx.y -= 5;
}

export function drawPartyInfo(ctx: PdfContext, name: string, role: string) {
  if (!name || !role) return;
  
  const text = `${name} (${role})`;
  const size = ctx.fontSize;
  const needed = size * ctx.lineHeight;
  
  ensureSpace(ctx, needed);
  
  ctx.page.drawText('•', {
    x: ctx.x,
    y: ctx.y - size,
    size,
    font: ctx.boldFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  ctx.page.drawText(text, {
    x: ctx.x + 14,
    y: ctx.y - size,
    size,
    font: ctx.font,
    color: rgb(0.1, 0.1, 0.1),
  });
  
  ctx.y -= needed + 2;
}

export function drawTimelineEvent(ctx: PdfContext, date: string, event: string) {
  if (!date || !event) return;
  
  const size = ctx.fontSize;
  const needed = size * ctx.lineHeight;
  
  ensureSpace(ctx, needed);
  
  // Draw date
  ctx.page.drawText(date, {
    x: ctx.x,
    y: ctx.y - size,
    size,
    font: ctx.boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  // Draw event
  const dateWidth = ctx.boldFont.widthOfTextAtSize(date + '  ', size);
  ctx.page.drawText(event, {
    x: ctx.x + dateWidth,
    y: ctx.y - size,
    size,
    font: ctx.font,
    color: rgb(0.1, 0.1, 0.1),
  });
  
  ctx.y -= needed + 3;
}

export function drawTitle(ctx: PdfContext, text: string) {
  const size = 20;
  const needed = size * ctx.lineHeight * 1.2;
  ensureSpace(ctx, needed);
  ctx.page.drawText(text, {
    x: ctx.x,
    y: ctx.y - size,
    size,
    font: ctx.boldFont,
    color: rgb(0, 0, 0),
  });
  ctx.y -= needed;
}

export function drawStepHeader(ctx: PdfContext, stepNumber: number, title: string): void {
  if (!title?.trim()) return;
  
  // Add space before step
  ctx.y -= 20;
  
  const fullTitle = `Step ${stepNumber}: ${title}`;
  const y = ctx.y - 10;
  
  // Draw step number with background
  const stepWidth = 30;
  ctx.page.drawRectangle({
    x: ctx.x,
    y: y - 5,
    width: stepWidth,
    height: 20,
    color: rgb(0.1, 0.3, 0.6),
  });
  
  ctx.page.drawText(`${stepNumber}`, {
    x: ctx.x + 12,
    y,
    size: 12,
    font: ctx.boldFont,
    color: rgb(1, 1, 1),
  });
  
  // Draw step title
  ctx.page.drawText(title, {
    x: ctx.x + stepWidth + 10,
    y,
    size: 13,
    font: ctx.boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  
  // Draw separator line
  const lineY = y - 8;
  ctx.page.drawLine({
    start: { x: ctx.x, y: lineY },
    end: { x: ctx.x + ctx.width, y: lineY },
    thickness: 1.5,
    color: rgb(0.1, 0.3, 0.6),
  });
  
  ctx.y = lineY - 15;
}

export function drawSectionTitle(ctx: PdfContext, text: string) {
  const size = 14;
  const needed = size * ctx.lineHeight * 1.2;
  ensureSpace(ctx, needed);
  ctx.page.drawText(text, {
    x: ctx.x,
    y: ctx.y - size,
    size,
    font: ctx.boldFont,
    color: rgb(0, 0, 0),
  });
  ctx.y -= needed * 0.9;
  drawDivider(ctx);
}

export function drawSubsectionTitle(ctx: PdfContext, text: string): void {
  if (!text?.trim()) return;
  
  ctx.y -= 10;
  
  const y = ctx.y - 5;
  ctx.page.drawText(text, {
    x: ctx.x + 10,
    y,
    size: 11,
    font: ctx.boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  ctx.y = y - 10;
}

export function drawDivider(ctx: PdfContext) {
  ensureSpace(ctx, 10);
  ctx.page.drawLine({
    start: { x: ctx.margin, y: ctx.y - 4 },
    end: { x: ctx.width - ctx.margin, y: ctx.y - 4 },
    color: rgb(0.8, 0.8, 0.8),
    thickness: 1,
  });
  ctx.y -= 12;
}

export function drawKeyValue(ctx: PdfContext, label: string, value?: string | null) {
  if (!value) return;
  const line = `${label}: ${value}`;
  drawParagraph(ctx, line, { boldLabel: label });
}

export function drawParagraph(
  ctx: PdfContext,
  text?: string | null,
  options?: { size?: number; lineGap?: number; boldLabel?: string }
) {
  if (!text) return;
  const size = options?.size ?? ctx.fontSize;
  const maxWidth = ctx.width - ctx.margin * 2;
  const lines = wrapText(ctx.font, text, size, maxWidth);
  for (let i = 0; i < lines.length; i++) {
    const needed = size * ctx.lineHeight;
    ensureSpace(ctx, needed);
    const lineText = lines[i];
    if (options?.boldLabel && lineText.startsWith(`${options.boldLabel}:`)) {
      // Draw label in bold, value in regular
      const labelText = `${options.boldLabel}:`;
      const labelWidth = ctx.boldFont.widthOfTextAtSize(labelText + ' ', size);
      ctx.page.drawText(labelText, { x: ctx.x, y: ctx.y - size, size, font: ctx.boldFont });
      ctx.page.drawText(lineText.substring(labelText.length + 1).trimStart(), {
        x: ctx.x + labelWidth,
        y: ctx.y - size,
        size,
        font: ctx.font,
      });
    } else {
      ctx.page.drawText(lineText, { x: ctx.x, y: ctx.y - size, size, font: ctx.font });
    }
    ctx.y -= needed;
  }
  ctx.y -= 4; // small gap after paragraph
}

export function drawBulletList(ctx: PdfContext, items?: Array<string | null | undefined>) {
  if (!items || items.length === 0) return;
  const size = ctx.fontSize;
  const maxWidth = ctx.width - ctx.margin * 2 - 16;
  for (const item of items) {
    if (!item) continue;
    const lines = wrapText(ctx.font, String(item), size, maxWidth);
    for (let i = 0; i < lines.length; i++) {
      const needed = size * ctx.lineHeight;
      ensureSpace(ctx, needed);
      if (i === 0) {
        ctx.page.drawText('•', { x: ctx.x, y: ctx.y - size, size, font: ctx.boldFont });
        ctx.page.drawText(lines[i], { x: ctx.x + 14, y: ctx.y - size, size, font: ctx.font });
      } else {
        ctx.page.drawText(lines[i], { x: ctx.x + 14, y: ctx.y - size, size, font: ctx.font });
      }
      ctx.y -= needed;
    }
    ctx.y -= 2;
  }
}

export function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const paragraphs = text.replace(/\r/g, '').split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let line = '';

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(test, size);
      if (width <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        // If single word is too long, hard split
        if (font.widthOfTextAtSize(word, size) > maxWidth) {
          let chunk = '';
          for (const char of word) {
            const t = chunk + char;
            if (font.widthOfTextAtSize(t, size) <= maxWidth) {
              chunk = t;
            } else {
              if (chunk) lines.push(chunk);
              chunk = char;
            }
          }
          if (chunk) {
            line = chunk;
          } else {
            line = '';
          }
        } else {
          line = word;
        }
      }
    }
    if (line) lines.push(line);
  }

  return lines;
}
