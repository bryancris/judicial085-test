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
        ...(data.analysis ? createFormattedAnalysisSection(data.analysis, data.parsedAnalysis, docxElements) : []),
        
        // Conversation History (if exists)
        ...(data.messages.length > 0 ? createConversationSection(data.messages, docxElements) : []),
        
        // Strengths & Weaknesses (if parsed analysis exists)
        ...(data.parsedAnalysis ? createStrengthsWeaknessesSection(data.parsedAnalysis, docxElements) : []),
        
        // Follow-up Questions (if exist)
        ...(data.parsedAnalysis?.followUpQuestions.length > 0 ? createFollowUpQuestionsSection(data.parsedAnalysis.followUpQuestions, docxElements) : []),
        
        // Similar Cases (if exist)
        ...(data.similarCases.length > 0 ? createSimilarCasesSection(data.similarCases, docxElements) : createEmptySimilarCasesSection(docxElements)),
    
    // Additional Case Law (using the correct data source)
    ...(data.additionalCaseLaw.length > 0 ? createAdditionalCaseLawSection(data.additionalCaseLaw, docxElements) : createEmptyAdditionalCaseLawSection(docxElements)),
    
    // Perplexity Research (if exists)
    ...(data.perplexityResearch.length > 0 ? createPerplexityResearchSection(data.perplexityResearch, docxElements) : []),
    
    // Scholarly References (if exist)
    ...(data.scholarlyReferences.length > 0 ? createScholarlyReferencesSection(data.scholarlyReferences, docxElements) : createEmptyScholarlyReferencesSection(docxElements)),
    
    // Attorney Notes (if exist)
    ...(data.notes.length > 0 ? createNotesSection(data.notes, docxElements) : createEmptyNotesSection(docxElements)),
    
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

function createFormattedAnalysisSection(analysis: any, parsedAnalysis: any, docxElements: any) {
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
  
  // Always show the full analysis content
  const analysisContent = analysis.content || 'No analysis content available.'
  const formattedParagraphs = processAnalysisContent(analysisContent, docxElements)
  content.push(...formattedParagraphs)
  
  // If parsed analysis exists, also show structured sections
  if (parsedAnalysis) {
    content.push(
      new Paragraph({
        text: "Analysis Summary",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 }
      })
    )
    
    if (parsedAnalysis.relevantLaw) {
      content.push(
        new Paragraph({
          text: "Relevant Law",
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200 }
        }),
        ...processAnalysisContent(parsedAnalysis.relevantLaw, docxElements)
      )
    }
    
    if (parsedAnalysis.preliminaryAnalysis) {
      content.push(
        new Paragraph({
          text: "Preliminary Analysis",
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200 }
        }),
        ...processAnalysisContent(parsedAnalysis.preliminaryAnalysis, docxElements)
      )
    }
    
    if (parsedAnalysis.potentialIssues) {
      content.push(
        new Paragraph({
          text: "Potential Issues",
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200 }
        }),
        ...processAnalysisContent(parsedAnalysis.potentialIssues, docxElements)
      )
    }
  }
  
  return content
}


function createStrengthsWeaknessesSection(parsedAnalysis: any, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Case Strengths & Weaknesses",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    new Paragraph({
      text: "Case Strengths",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200 }
    }),
    ...parsedAnalysis.strengths.map((strength: string) => 
      new Paragraph({
        children: [
          new TextRun({ text: "• ", color: "27ae60" }),
          new TextRun(strength)
        ],
        spacing: { after: 100 },
        indent: { left: 360 }
      })
    ),
    new Paragraph({
      text: "Case Weaknesses",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200 }
    }),
    ...parsedAnalysis.weaknesses.map((weakness: string) => 
      new Paragraph({
        children: [
          new TextRun({ text: "• ", color: "e74c3c" }),
          new TextRun(weakness)
        ],
        spacing: { after: 100 },
        indent: { left: 360 }
      })
    )
  ]
}

function createFollowUpQuestionsSection(followUpQuestions: string[], docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Recommended Follow-up Questions",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    ...followUpQuestions.map((question: string, index: number) => 
      new Paragraph({
        children: [
          new TextRun({ text: `${index + 1}. `, bold: true }),
          new TextRun(question)
        ],
        spacing: { after: 120 },
        indent: { left: 360 }
      })
    )
  ]
}

function processAnalysisContent(content: string, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  const paragraphs = []
  
  // Split content into paragraphs first, then process
  const sections = content.split(/\n\s*\n/) // Split on double line breaks
  
  for (const section of sections) {
    if (!section.trim()) continue
    
    const lines = section.split('\n')
    let currentListItems = []
    let inList = false
    let inCodeBlock = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()
      
      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        inCodeBlock = !inCodeBlock
        continue
      }
      
      if (inCodeBlock) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: line, font: "Courier New", size: 20 })],
            spacing: { after: 100 },
            indent: { left: 720 }
          })
        )
        continue
      }
      
      if (!trimmedLine) {
        // Empty lines end lists but add paragraph spacing
        if (inList && currentListItems.length > 0) {
          paragraphs.push(...createFormattedList(currentListItems, docxElements))
          currentListItems = []
          inList = false
        }
        continue
      }
    
      // Handle markdown headers (### ## #)
      if (trimmedLine.startsWith('###')) {
        // End any current list
        if (inList && currentListItems.length > 0) {
          paragraphs.push(...createFormattedList(currentListItems, docxElements))
          currentListItems = []
          inList = false
        }
        
        const headerText = trimmedLine.replace(/^###\s*/, '').trim()
        paragraphs.push(
          new Paragraph({
            text: headerText,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          })
        )
      }
      else if (trimmedLine.startsWith('##')) {
        // End any current list
        if (inList && currentListItems.length > 0) {
          paragraphs.push(...createFormattedList(currentListItems, docxElements))
          currentListItems = []
          inList = false
        }
        
        const headerText = trimmedLine.replace(/^##\s*/, '').trim()
        paragraphs.push(
          new Paragraph({
            text: headerText,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 }
          })
        )
      }
      else if (trimmedLine.startsWith('#') && !trimmedLine.startsWith('##')) {
        // End any current list
        if (inList && currentListItems.length > 0) {
          paragraphs.push(...createFormattedList(currentListItems, docxElements))
          currentListItems = []
          inList = false
        }
        
        const headerText = trimmedLine.replace(/^#\s*/, '').trim()
        paragraphs.push(
          new Paragraph({
            text: headerText,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          })
        )
      }
      // Handle headers (**text**)
      else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
        // End any current list
        if (inList && currentListItems.length > 0) {
          paragraphs.push(...createFormattedList(currentListItems, docxElements))
          currentListItems = []
          inList = false
        }
        
        const headerText = trimmedLine.replace(/\*\*/g, '').trim()
        paragraphs.push(
          new Paragraph({
            text: headerText,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 }
          })
        )
      }
      // Handle numbered lists (1., 2., etc.)
      else if (/^\d+\.\s+/.test(trimmedLine)) {
        inList = true
        const text = trimmedLine.replace(/^\d+\.\s+/, '').trim()
        currentListItems.push(text)
      }
      // Handle bullet points (-, *, •)
      else if (/^[-*•]\s+/.test(trimmedLine)) {
        inList = true
        const text = trimmedLine.replace(/^[-*•]\s+/, '').trim()
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
        
        // Process inline formatting (bold text, links, etc.)
        const textRuns = processInlineFormatting(trimmedLine, docxElements)
        paragraphs.push(
          new Paragraph({
            children: textRuns,
            spacing: { after: 120 }
          })
        )
      }
    }
    
    // Handle any remaining list items for this section
    if (inList && currentListItems.length > 0) {
      paragraphs.push(...createFormattedList(currentListItems, docxElements))
      currentListItems = []
      inList = false
    }
    
    // Add section break
    if (sections.indexOf(section) < sections.length - 1) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: { after: 200 }
        })
      )
    }
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
  
  console.log('Processing similar cases for Word export:', similarCases)
  
  if (!similarCases || similarCases.length === 0) {
    return [
      new Paragraph({
        text: "Similar Cases",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "No similar cases have been identified for this client.", italic: true })],
        spacing: { after: 200 }
      })
    ]
  }

  const content = [
    new Paragraph({
      text: "Similar Cases",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "The following cases were identified as similar based on the case analysis.", italic: true })],
      spacing: { after: 200 }
    })
  ]

  // Process each similar case
  similarCases.slice(0, 5).forEach((caseItem: any, index: number) => {
    console.log(`Processing case ${index + 1}:`, caseItem)
    
    // Case header with name and court
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${index + 1}. `, bold: true }),
          new TextRun({ text: caseItem.clientName || 'Unknown Case', bold: true }),
          caseItem.court ? new TextRun({ text: ` (${caseItem.court})` }) : new TextRun('')
        ],
        spacing: { after: 100 }
      })
    )
    
    // Citation and date
    if (caseItem.citation || caseItem.dateDecided) {
      const citationParts = []
      if (caseItem.citation) citationParts.push(caseItem.citation)
      if (caseItem.dateDecided) citationParts.push(`decided ${caseItem.dateDecided}`)
      
      content.push(
        new Paragraph({
          children: [new TextRun({ text: citationParts.join(', '), italic: true })],
          spacing: { after: 100 },
          indent: { left: 360 }
        })
      )
    }
    
    // Relevant facts
    if (caseItem.relevantFacts) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Relevant Facts: ', bold: true }),
            new TextRun({ text: caseItem.relevantFacts })
          ],
          spacing: { after: 100 },
          indent: { left: 360 }
        })
      )
    }
    
    // Outcome
    if (caseItem.outcome) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Outcome: ', bold: true }),
            new TextRun({ text: caseItem.outcome })
          ],
          spacing: { after: 200 },
          indent: { left: 360 }
        })
      )
    }
  })

  return content
}

function createScholarlyReferencesSection(scholarlyReferences: any[], docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Scholarly References",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "The following scholarly articles and legal references support this analysis.", italic: true })],
      spacing: { after: 200 }
    }),
    ...scholarlyReferences.slice(0, 10).map((scholarlyRef: any, index: number) => {
      // Handle the reference data structure - it might be nested in reference_data
      const refData = scholarlyRef.reference_data || scholarlyRef
      const references = Array.isArray(refData) ? refData : (refData.references || [refData])
      
      if (Array.isArray(references) && references.length > 0) {
        return references.slice(0, 5).map((ref: any, refIndex: number) => {
          const content = []
          
          // Title and authors
          content.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${refIndex + 1}. `, bold: true }),
                new TextRun({ text: ref.title || 'Untitled Reference', bold: true })
              ],
              spacing: { after: 100 },
              indent: { left: 360 }
            })
          )
          
          // Authors and publication info
          if (ref.authors || ref.year || ref.journal) {
            content.push(
              new Paragraph({
                children: [
                  new TextRun({ text: "Authors: ", bold: true }),
                  new TextRun(`${ref.authors || 'Unknown Author'}`),
                  ref.year ? new TextRun(` (${ref.year})`) : new TextRun(''),
                  ref.journal ? new TextRun(`, ${ref.journal}`) : new TextRun('')
                ],
                spacing: { after: 100 },
                indent: { left: 720 }
              })
            )
          }
          
          // Abstract or snippet
          if (ref.abstract || ref.snippet) {
            content.push(
              new Paragraph({
                children: [
                  new TextRun({ text: "Abstract: ", bold: true }),
                  new TextRun(ref.abstract || ref.snippet || '')
                ],
                spacing: { after: 100 },
                indent: { left: 720 }
              })
            )
          }
          
          // URL if available
          if (ref.url) {
            content.push(
              new Paragraph({
                children: [
                  new TextRun({ text: "URL: ", bold: true }),
                  new TextRun({ text: ref.url, color: "2563eb" })
                ],
                spacing: { after: 150 },
                indent: { left: 720 }
              })
            )
          }
          
          return content
        }).flat()
      } else {
        // Fallback for simple structure
        return [
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. `, bold: true }),
              new TextRun({ text: scholarlyRef.title || 'Untitled Reference', bold: true }),
              new TextRun(` - ${scholarlyRef.authors || 'Unknown Author'} (${scholarlyRef.year || 'Unknown Year'})`)
            ],
            spacing: { after: 120 },
            indent: { left: 360 }
          })
        ]
      }
    }).flat()
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

function createConversationSection(messages: any[], docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Client Conversation History",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "This section contains the conversation that led to the legal analysis above.", italic: true })],
      spacing: { after: 200 }
    }),
    ...messages.map((message: any, index: number) => 
      new Paragraph({
        children: [
          new TextRun({ 
            text: `${message.role === 'user' ? 'Client' : 'Attorney'}: `, 
            bold: true,
            color: message.role === 'user' ? "2563eb" : "059669"
          }),
          new TextRun(message.content)
        ],
        spacing: { after: 150 },
        indent: { left: message.role === 'user' ? 0 : 360 }
      })
    )
  ]
}

function createEmptySimilarCasesSection(docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Similar Cases",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "No similar cases have been identified for this analysis yet.", italic: true })],
      spacing: { after: 200 }
    })
  ]
}

function createEmptyScholarlyReferencesSection(docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Scholarly References",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "No scholarly references have been collected for this analysis yet.", italic: true })],
      spacing: { after: 200 }
    })
  ]
}

function createAdditionalCaseLawSection(additionalCaseLaw: any[], docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  if (!additionalCaseLaw || additionalCaseLaw.length === 0) {
    return []
  }
  
  return [
    new Paragraph({
      text: "Additional Case Law",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "The following Texas case law was found to be relevant to this analysis.", italic: true })],
      spacing: { after: 200 }
    }),
    ...additionalCaseLaw.slice(0, 10).map((caseItem: any, index: number) => {
      const content = []
      
      // Case name and court
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}. `, bold: true }),
            new TextRun({ text: caseItem.case_name || 'Unknown Case', bold: true }),
            new TextRun(caseItem.court ? ` (${caseItem.court})` : '')
          ],
          spacing: { after: 100 },
          indent: { left: 360 }
        })
      )
      
      // Citation and date
      if (caseItem.citation || caseItem.date_decided) {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Citation: ", bold: true }),
              new TextRun(caseItem.citation || 'No citation'),
              caseItem.date_decided ? new TextRun(` (${caseItem.date_decided})`) : new TextRun('')
            ],
            spacing: { after: 100 },
            indent: { left: 720 }
          })
        )
      }
      
      // Relevant facts
      if (caseItem.relevant_facts) {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Relevant Facts: ", bold: true }),
              new TextRun(caseItem.relevant_facts)
            ],
            spacing: { after: 100 },
            indent: { left: 720 }
          })
        )
      }
      
      // Outcome
      if (caseItem.outcome) {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Outcome: ", bold: true }),
              new TextRun(caseItem.outcome)
            ],
            spacing: { after: 150 },
            indent: { left: 720 }
          })
        )
      }
      
      return content
    }).flat()
  ]
}

function createPerplexityResearchSection(perplexityResearch: any[], docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  if (!perplexityResearch || perplexityResearch.length === 0) {
    return []
  }
  
  return [
    new Paragraph({
      text: "Legal Research",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "The following additional legal research was conducted to support this analysis.", italic: true })],
      spacing: { after: 200 }
    }),
    ...perplexityResearch.slice(0, 10).map((research: any, index: number) => {
      const content = []
      
      // Add research query
      if (research.query) {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. Research Query: `, bold: true }),
              new TextRun(research.query)
            ],
            spacing: { after: 100 },
            indent: { left: 360 }
          })
        )
      }
      
      // Add research content with proper formatting
      if (research.content) {
        const formattedContent = processAnalysisContent(research.content, docxElements)
        content.push(...formattedContent.map(paragraph => ({
          ...paragraph,
          indent: { left: 720 } // Double indent for research content
        })))
      }
      
      // Add citations if available
      if (research.citations && research.citations.length > 0) {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Sources: ", bold: true, italic: true }),
              new TextRun({ text: research.citations.join(', '), italic: true })
            ],
            spacing: { after: 150 },
            indent: { left: 720 }
          })
        )
      }
      
      return content
    }).flat()
  ]
}

function createEmptyAdditionalCaseLawSection(docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Additional Case Law",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "No additional case law has been researched for this analysis yet.", italic: true })],
      spacing: { after: 200 }
    })
  ]
}

function createEmptyNotesSection(docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  return [
    new Paragraph({
      text: "Attorney Notes",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "No attorney notes have been added for this case yet.", italic: true })],
      spacing: { after: 200 }
    })
  ]
}
