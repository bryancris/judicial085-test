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

function ensureSpace(ctx: PdfContext, requiredHeight: number) {
  if (ctx.y - requiredHeight < ctx.margin) {
    addPage(ctx);
  }
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
