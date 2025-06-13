import type { CaseAnalysisData } from './types.ts';

export async function generateWord(data: CaseAnalysisData): Promise<Uint8Array> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = await import('https://esm.sh/docx@8.5.0')
  
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 28,
            bold: true,
            color: "1e40af", // blue-800
            font: "Calibri"
          },
          paragraph: {
            spacing: {
              before: 400,
              after: 200,
            },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 24,
            bold: true,
            color: "1e40af",
            font: "Calibri"
          },
          paragraph: {
            spacing: {
              before: 300,
              after: 150,
            },
          },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 20,
            bold: true,
            color: "374151", // gray-700
            font: "Calibri"
          },
          paragraph: {
            spacing: {
              before: 200,
              after: 100,
            },
          },
        },
        {
          id: "Normal",
          name: "Normal",
          run: {
            size: 22,
            font: "Calibri",
            color: "000000"
          },
          paragraph: {
            spacing: {
              line: 276, // 1.15 line spacing
              after: 120,
            },
          },
        }
      ]
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: createWordDocumentContent(data, { Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle })
    }]
  })
  
  const buffer = await Packer.toBuffer(doc)
  return new Uint8Array(buffer)
}

function createWordDocumentContent(data: CaseAnalysisData, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = docxElements
  
  const content = [
    // Title
    new Paragraph({
      text: "Legal Case Analysis Report",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    
    // Client Information Table
    new Paragraph({
      text: "Client Information",
      heading: HeadingLevel.HEADING_1,
    }),
    
    createClientInfoTable(data.client, docxElements),
    
    // Case Information (if exists)
    ...(data.case ? createCaseInfoSection(data.case, docxElements) : []),
    
    // Legal Analysis (if exists)
    ...(data.analysis ? createFormattedAnalysisSection(data.analysis, docxElements) : []),
    
    // Similar Cases (if exist)
    ...(data.similarCases.length > 0 ? createSimilarCasesSection(data.similarCases, docxElements) : []),
    
    // Scholarly References (if exist)
    ...(data.scholarlyReferences.length > 0 ? createScholarlyReferencesSection(data.scholarlyReferences, docxElements) : []),
    
    // Attorney Notes (if exist)
    ...(data.notes.length > 0 ? createNotesSection(data.notes, docxElements) : []),
    
    // Documents (if exist)
    ...(data.documents.length > 0 ? createDocumentsSection(data.documents, docxElements) : [])
  ]
  
  return content
}

function createClientInfoTable(client: any, docxElements: any) {
  const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle } = docxElements
  
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Name", bold: true })] })],
            width: { size: 30, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun(`${client?.first_name || ''} ${client?.last_name || ''}`)] })],
            width: { size: 70, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Email", bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun(client?.email || 'N/A')] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Phone", bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun(client?.phone || 'N/A')] })],
          }),
        ],
      }),
    ],
  })
}

function createCaseInfoSection(caseData: any, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = docxElements
  
  return [
    new Paragraph({
      text: "Case Information",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Case Title", bold: true })] })],
              width: { size: 30, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun(caseData.case_title || 'N/A')] })],
              width: { size: 70, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Case Type", bold: true })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun(caseData.case_type || 'N/A')] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun(caseData.status || 'N/A')] })],
            }),
          ],
        }),
      ],
    })
  ]
}

function createFormattedAnalysisSection(analysis: any, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  const content = [
    new Paragraph({
      text: "Legal Analysis",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    })
  ]
  
  if (analysis.case_type && analysis.case_type !== 'general') {
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Case Type: ", bold: true }),
          new TextRun(analysis.case_type === 'consumer-protection' ? 'Consumer Protection' : analysis.case_type)
        ],
        spacing: { after: 200 }
      })
    )
  }
  
  // Process the analysis content with markdown formatting
  const analysisContent = analysis.content || 'No analysis content available.'
  const formattedParagraphs = processAnalysisContent(analysisContent, docxElements)
  content.push(...formattedParagraphs)
  
  return content
}

function processAnalysisContent(content: string, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  const paragraphs = []
  
  // Split content into lines and process each
  const lines = content.split('\n').filter(line => line.trim())
  let currentListItems = []
  let inList = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (!line) continue
    
    // Handle headers (**, ##, ###)
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      // End any current list
      if (inList && currentListItems.length > 0) {
        paragraphs.push(...createFormattedList(currentListItems, docxElements))
        currentListItems = []
        inList = false
      }
      
      const headerText = line.replace(/\*\*/g, '').trim()
      paragraphs.push(
        new Paragraph({
          text: headerText,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 }
        })
      )
    }
    // Handle numbered lists (1., 2., etc.)
    else if (/^\d+\.\s+/.test(line)) {
      inList = true
      const text = line.replace(/^\d+\.\s+/, '').trim()
      currentListItems.push(text)
    }
    // Handle bullet points (-, *, •)
    else if (/^[-*•]\s+/.test(line)) {
      inList = true
      const text = line.replace(/^[-*•]\s+/, '').trim()
      currentListItems.push(text)
    }
    // Regular paragraph
    else {
      // End any current list
      if (inList && currentListItems.length > 0) {
        paragraphs.push(...createFormattedList(currentListItems, docxElements))
        currentListItems = []
        inList = false
      }
      
      // Process inline formatting (bold text)
      const textRuns = processInlineFormatting(line, docxElements)
      paragraphs.push(
        new Paragraph({
          children: textRuns,
          spacing: { after: 120 }
        })
      )
    }
  }
  
  // Handle any remaining list items
  if (inList && currentListItems.length > 0) {
    paragraphs.push(...createFormattedList(currentListItems, docxElements))
  }
  
  return paragraphs
}

function processInlineFormatting(text: string, docxElements: any) {
  const { TextRun } = docxElements
  const runs = []
  let currentIndex = 0
  
  // Find bold text patterns (**text**)
  const boldPattern = /\*\*(.*?)\*\*/g
  let match
  
  while ((match = boldPattern.exec(text)) !== null) {
    // Add text before bold
    if (match.index > currentIndex) {
      const beforeText = text.substring(currentIndex, match.index)
      if (beforeText) {
        runs.push(new TextRun({ text: beforeText }))
      }
    }
    
    // Add bold text
    runs.push(new TextRun({ text: match[1], bold: true }))
    currentIndex = match.index + match[0].length
  }
  
  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex)
    if (remainingText) {
      runs.push(new TextRun({ text: remainingText }))
    }
  }
  
  // If no formatting found, return simple text run
  if (runs.length === 0) {
    runs.push(new TextRun({ text }))
  }
  
  return runs
}

function createFormattedList(items: string[], docxElements: any) {
  const { Paragraph, TextRun } = docxElements
  
  return items.map((item, index) => 
    new Paragraph({
      children: [
        new TextRun({ text: `${index + 1}. `, bold: true }),
        ...processInlineFormatting(item, docxElements)
      ],
      spacing: { after: 100 },
      indent: { left: 360 } // Indent list items
    })
  )
}

function createSimilarCasesSection(similarCases: any[], docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Similar Cases",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    ...similarCases.slice(0, 5).map((similarCase: any, index: number) => 
      new Paragraph({
        children: [
          new TextRun({ text: `${index + 1}. `, bold: true }),
          new TextRun({ text: `${similarCase.clientName || 'Unknown Case'}: `, bold: true }),
          new TextRun(similarCase.relevantFacts || 'No details available.')
        ],
        spacing: { after: 150 },
        indent: { left: 360 }
      })
    )
  ]
}

function createScholarlyReferencesSection(scholarlyReferences: any[], docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Scholarly References",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    ...scholarlyReferences.slice(0, 10).map((ref: any, index: number) => 
      new Paragraph({
        children: [
          new TextRun({ text: `${index + 1}. `, bold: true }),
          new TextRun({ text: ref.title || 'Untitled Reference', bold: true }),
          new TextRun(` - ${ref.authors || 'Unknown Author'} (${ref.year || 'Unknown Year'})`)
        ],
        spacing: { after: 120 },
        indent: { left: 360 }
      })
    )
  ]
}

function createNotesSection(notes: any[], docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Attorney Notes",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    ...notes.map((note: any) => 
      new Paragraph({
        children: [
          new TextRun({ text: `${new Date(note.timestamp).toLocaleDateString()}: `, bold: true }),
          new TextRun(note.content)
        ],
        spacing: { after: 150 }
      })
    )
  ]
}

function createDocumentsSection(documents: any[], docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Case Documents",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    ...documents.map((doc: any, index: number) => 
      new Paragraph({
        children: [
          new TextRun({ text: `${index + 1}. `, bold: true }),
          new TextRun({ text: `${doc.title || 'Untitled Document'}: `, bold: true }),
          new TextRun(`${doc.processing_status || 'Unknown status'} - ${new Date(doc.created_at).toLocaleDateString()}`)
        ],
        spacing: { after: 120 },
        indent: { left: 360 }
      })
    )
  ]
}
