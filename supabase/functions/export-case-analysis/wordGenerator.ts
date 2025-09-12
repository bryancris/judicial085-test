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
  const { Paragraph, TextRun, HeadingLevel, AlignmentType } = docxElements
  
  const clientName = data.client ? `${data.client.first_name || ''} ${data.client.last_name || ''}`.trim() : 'Unknown Client'
  
  const content = [
    // Document Title
    new Paragraph({
      children: [
        new TextRun({
          text: `Legal Case Analysis Report - ${clientName}`,
          size: 32,
          bold: true,
          color: "1e40af"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 }
    }),
    
    // Step 1: Case Summary (Organized Fact Pattern)
    new Paragraph({
      text: "STEP 1: CASE SUMMARY (ORGANIZED FACT PATTERN)",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [new TextRun({
        text: "AI-assisted organization of core case facts into structured legal narrative",
        italic: true,
        color: "6b7280"
      })],
      spacing: { after: 200 }
    }),
    ...createCaseSummarySection(data, docxElements),
    
    // Step 2: Preliminary Analysis 
    new Paragraph({
      text: "STEP 2: PRELIMINARY ANALYSIS (AI-ASSISTED BROAD ISSUE SPOTTING)",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [new TextRun({
        text: "Initial broad identification of potential legal issues and areas of concern",
        italic: true,
        color: "6b7280"
      })],
      spacing: { after: 200 }
    }),
    ...createPreliminaryAnalysisSection(data, docxElements),
    
    // Step 3: Relevant Texas Laws
    new Paragraph({
      text: "STEP 3: RELEVANT TEXAS LAWS (TARGETED LEGAL RESEARCH)",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [new TextRun({
        text: "Targeted research into applicable Texas statutes and regulations",
        italic: true,
        color: "6b7280"
      })],
      spacing: { after: 200 }
    }),
    ...createRelevantLawSection(data, docxElements),
    
    // Step 4: Additional Case Law
    new Paragraph({
      text: "STEP 4: ADDITIONAL CASE LAW (PRECEDENT RESEARCH)",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [new TextRun({
        text: "Research into relevant case precedents and judicial interpretations",
        italic: true,
        color: "6b7280"
      })],
      spacing: { after: 200 }
    }),
    ...createAdditionalCaseLawSection(data, docxElements),
    
    // Step 5: IRAC Legal Analysis
    new Paragraph({
      text: "STEP 5: IRAC LEGAL ANALYSIS (STRUCTURED LEGAL REASONING)",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [new TextRun({
        text: "Detailed legal analysis using Issue, Rule, Application, Conclusion methodology",
        italic: true,
        color: "6b7280"
      })],
      spacing: { after: 200 }
    }),
    ...createIracAnalysisSection(data, docxElements),
    
    // Step 6: Case Strengths & Weaknesses
    new Paragraph({
      text: "STEP 6: CASE STRENGTHS & WEAKNESSES (RISK ASSESSMENT)",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [new TextRun({
        text: "Comprehensive risk assessment identifying advantages and vulnerabilities",
        italic: true,
        color: "6b7280"
      })],
      spacing: { after: 200 }
    }),
    ...createStrengthsWeaknessesSection(data, docxElements),
    
    // Step 7: Legal Requirements Verification & Case Conclusion
    new Paragraph({
      text: "STEP 7: LEGAL REQUIREMENTS VERIFICATION & CASE CONCLUSION",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [new TextRun({
        text: "Systematic verification of legal requirements and overall case assessment",
        italic: true,
        color: "6b7280"
      })],
      spacing: { after: 200 }
    }),
    ...createLegalRequirementsSection(data, docxElements),
    
    // Step 8: Recommended Follow-up Questions
    new Paragraph({
      text: "STEP 8: RECOMMENDED FOLLOW-UP QUESTIONS",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [new TextRun({
        text: "Strategic questions to gather additional information for case development",
        italic: true,
        color: "6b7280"
      })],
      spacing: { after: 200 }
    }),
    ...createFollowUpQuestionsSection(data, docxElements),
    
    // Step 9: Law References
    new Paragraph({
      text: "STEP 9: LAW REFERENCES (VECTORIZED LEGAL DOCUMENTS)",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [new TextRun({
        text: "Reference materials from vectorized legal document database",
        italic: true,
        color: "6b7280"
      })],
      spacing: { after: 200 }
    }),
    ...createLawReferencesSection(data, docxElements)
  ]
  
  return content
}

function createCaseSummarySection(data: CaseAnalysisData, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  const content = []
  
  // Parties
  if (data.structuredCaseData?.parties && data.structuredCaseData.parties.length > 0) {
    content.push(
      new Paragraph({
        text: "Parties Involved",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200 }
      })
    )
    data.structuredCaseData.parties.forEach((party: any) => {
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: "• ", bold: true }),
            new TextRun({ text: `${party.name} (${party.role})` })
          ],
          spacing: { after: 100 },
          indent: { left: 360 }
        })
      )
    })
  }
  
  // Timeline
  if (data.structuredCaseData?.timeline && data.structuredCaseData.timeline.length > 0) {
    content.push(
      new Paragraph({
        text: "Timeline of Events",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200 }
      })
    )
    data.structuredCaseData.timeline.forEach((event: any) => {
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${event.date}: `, bold: true }),
            new TextRun(event.event)
          ],
          spacing: { after: 100 },
          indent: { left: 360 }
        })
      )
    })
  }
  
  // Core Facts
  if (data.structuredCaseData?.coreFacts && data.structuredCaseData.coreFacts.length > 0) {
    content.push(
      new Paragraph({
        text: "Core Facts",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200 }
      })
    )
    data.structuredCaseData.coreFacts.forEach((fact: string) => {
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: "• ", bold: true }),
            new TextRun(fact)
          ],
          spacing: { after: 100 },
          indent: { left: 360 }
        })
      )
    })
  }
  
  if (content.length === 0) {
    content.push(
      new Paragraph({
        children: [new TextRun({
          text: "No structured case summary data available.",
          italic: true,
          color: "6b7280"
        })],
        spacing: { after: 200 }
      })
    )
  }
  
  return content
}

function createPreliminaryAnalysisSection(data: CaseAnalysisData, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  if (!data.preliminaryAnalysis) {
    return [
      new Paragraph({
        children: [new TextRun({
          text: "No preliminary analysis data available.",
          italic: true,
          color: "6b7280"
        })],
        spacing: { after: 200 }
      })
    ]
  }
  
  // Parse the dedicated Step 2 content exactly like the app does
  const parsedData = parsePreliminaryAnalysisForWord(data.preliminaryAnalysis)
  const content = []
  
  // Potential Legal Areas section
  if (parsedData.potentialLegalAreas.length > 0) {
    content.push(
      new Paragraph({
        text: "Potential Legal Areas",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    )
    parsedData.potentialLegalAreas.forEach((area: string) => {
      content.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${area}` })],
          spacing: { after: 50 },
          indent: { left: 360 }
        })
      )
    })
  }
  
  // Preliminary Issues section
  if (parsedData.preliminaryIssues.length > 0) {
    content.push(
      new Paragraph({
        text: "Preliminary Issues",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    )
    parsedData.preliminaryIssues.forEach((issue: string) => {
      content.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${issue}` })],
          spacing: { after: 50 },
          indent: { left: 360 }
        })
      )
    })
  }
  
  // Research Priorities section
  if (parsedData.researchPriorities.length > 0) {
    content.push(
      new Paragraph({
        text: "Research Priorities",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    )
    parsedData.researchPriorities.forEach((priority: string) => {
      content.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${priority}` })],
          spacing: { after: 50 },
          indent: { left: 360 }
        })
      )
    })
  }
  
  // Strategic Notes section
  if (parsedData.strategicNotes.length > 0) {
    content.push(
      new Paragraph({
        text: "Strategic Notes",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      })
    )
    parsedData.strategicNotes.forEach((note: string) => {
      content.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${note}` })],
          spacing: { after: 50 },
          indent: { left: 360 }
        })
      )
    })
  }
  
  return content
}

function createRelevantLawSection(data: CaseAnalysisData, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  
  if (!data.relevantLaw) {
    return [
      new Paragraph({
        children: [new TextRun({
          text: "No relevant law analysis available.",
          italic: true,
          color: "6b7280"
        })],
        spacing: { after: 200 }
      })
    ]
  }
  
  // Process the relevant law content with proper formatting like the app
  const lawContent = parseRelevantLawForWord(data.relevantLaw)
  return lawContent.map((item: any) => {
    if (item.type === 'heading') {
      return new Paragraph({
        children: [new TextRun({ text: item.text, bold: true, size: 24 })],
        spacing: { before: 200, after: 100 }
      })
    } else if (item.type === 'bullet') {
      return new Paragraph({
        children: [new TextRun({ text: `• ${item.text}` })],
        spacing: { before: 50 }
      })
    } else {
      return new Paragraph({
        children: [new TextRun({ text: item.text })],
        spacing: { before: 100 }
      })
    }
  })
}

function createAdditionalCaseLawSection(data: CaseAnalysisData, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  const content = []
  
  if (data.additionalCaseLaw && data.additionalCaseLaw.length > 0) {
    data.additionalCaseLaw.forEach((caselaw: any, index: number) => {
      content.push(
        new Paragraph({
          text: `Case ${index + 1}: ${caselaw.case_name || 'Unknown Case'}`,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200 }
        })
      )
      
      if (caselaw.court) {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Court: ", bold: true }),
              new TextRun(caselaw.court)
            ],
            spacing: { after: 100 }
          })
        )
      }
      
      if (caselaw.date_decided) {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Date: ", bold: true }),
              new TextRun(new Date(caselaw.date_decided).toLocaleDateString())
            ],
            spacing: { after: 100 }
          })
        )
      }
      
      if (caselaw.snippet) {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Relevant Facts: ", bold: true }),
              new TextRun(caselaw.snippet)
            ],
            spacing: { after: 200 }
          })
        )
      }
    })
  } else {
    content.push(
      new Paragraph({
        children: [new TextRun({
          text: "No additional case law research available.",
          italic: true,
          color: "6b7280"
        })],
        spacing: { after: 200 }
      })
    )
  }
  
  return content
}

function createIracAnalysisSection(data: CaseAnalysisData, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  const content = []
  
  if (data.iracAnalysis?.issues && data.iracAnalysis.issues.length > 0) {
    data.iracAnalysis.issues.forEach((issue: any, index: number) => {
      content.push(
        new Paragraph({
          text: `Issue ${index + 1}: ${issue.issue}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300 }
        })
      )
      
      if (issue.rule) {
        content.push(
          new Paragraph({
            text: "Rule",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200 }
          }),
          ...processAnalysisContent(issue.rule, docxElements)
        )
      }
      
      if (issue.application) {
        content.push(
          new Paragraph({
            text: "Application",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200 }
          }),
          ...processAnalysisContent(issue.application, docxElements)
        )
      }
      
      if (issue.conclusion) {
        content.push(
          new Paragraph({
            text: "Conclusion",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200 }
          }),
          ...processAnalysisContent(issue.conclusion, docxElements)
        )
      }
    })
    
    // Overall conclusion
    if (data.iracAnalysis.conclusion) {
      content.push(
        new Paragraph({
          text: "Overall Legal Conclusion",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400 }
        }),
        ...processAnalysisContent(data.iracAnalysis.conclusion, docxElements)
      )
    }
  } else {
    content.push(
      new Paragraph({
        children: [new TextRun({
          text: "No IRAC analysis available.",
          italic: true,
          color: "6b7280"
        })],
        spacing: { after: 200 }
      })
    )
  }
  
  return content
}

function createStrengthsWeaknessesSection(data: CaseAnalysisData, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  const content = []
  
  if (data.strengths && data.strengths.length > 0) {
    content.push(
      new Paragraph({
        text: "Case Strengths",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200 }
      })
    )
    data.strengths.forEach((strength: string) => {
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: "✅ ", color: "27ae60" }),
            new TextRun(strength)
          ],
          spacing: { after: 100 },
          indent: { left: 360 }
        })
      )
    })
  }
  
  if (data.weaknesses && data.weaknesses.length > 0) {
    content.push(
      new Paragraph({
        text: "Case Weaknesses",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200 }
      })
    )
    data.weaknesses.forEach((weakness: string) => {
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: "❌ ", color: "e74c3c" }),
            new TextRun(weakness)
          ],
          spacing: { after: 100 },
          indent: { left: 360 }
        })
      )
    })
  }
  
  if (content.length === 0) {
    content.push(
      new Paragraph({
        children: [new TextRun({
          text: "No strengths and weaknesses analysis available.",
          italic: true,
          color: "6b7280"
        })],
        spacing: { after: 200 }
      })
    )
  }
  
  return content
}

function createLegalRequirementsSection(data: CaseAnalysisData, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  const content = []
  
  if (data.legalRequirementsChecklist && data.legalRequirementsChecklist.length > 0) {
    content.push(
      new Paragraph({
        text: "Legal Requirements Checklist",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200 }
      })
    )
    
    data.legalRequirementsChecklist.forEach((item: any) => {
      const status = item.status ? "✅" : "❌"
      const statusColor = item.status ? "27ae60" : "e74c3c"
      
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${status} `, color: statusColor }),
            new TextRun({ text: item.requirement, bold: true })
          ],
          spacing: { after: 100 },
          indent: { left: 360 }
        })
      )
      
      if (item.law) {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: "    Law: ", bold: true, italic: true }),
              new TextRun({ text: item.law, italic: true })
            ],
            spacing: { after: 80 }
          })
        )
      }
      
      if (item.analysis) {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: "    Analysis: ", bold: true }),
              new TextRun(item.analysis)
            ],
            spacing: { after: 120 }
          })
        )
      }
    })
  }
  
  // Case Conclusion
  if (data.caseConclusion) {
    content.push(
      new Paragraph({
        text: "Case Conclusion",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300 }
      }),
      ...processAnalysisContent(data.caseConclusion, docxElements)
    )
  }
  
  if (content.length === 0) {
    content.push(
      new Paragraph({
        children: [new TextRun({
          text: "No legal requirements verification or case conclusion available.",
          italic: true,
          color: "6b7280"
        })],
        spacing: { after: 200 }
      })
    )
  }
  
  return content
}

function createFollowUpQuestionsSection(data: CaseAnalysisData, docxElements: any) {
  const { Paragraph, TextRun } = docxElements
  const content = []
  
  if (data.followUpQuestions && data.followUpQuestions.length > 0) {
    data.followUpQuestions.forEach((question: string, index: number) => {
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}. `, bold: true }),
            new TextRun(question)
          ],
          spacing: { after: 120 },
          indent: { left: 360 }
        })
      )
    })
  } else {
    content.push(
      new Paragraph({
        children: [new TextRun({
          text: "No follow-up questions available.",
          italic: true,
          color: "6b7280"
        })],
        spacing: { after: 200 }
      })
    )
  }
  
  return content
}

function createLawReferencesSection(data: CaseAnalysisData, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  const content = []
  
  if (data.lawReferences && data.lawReferences.length > 0) {
    data.lawReferences.forEach((ref: any, index: number) => {
      content.push(
        new Paragraph({
          text: `Reference ${index + 1}: ${ref.title || 'Legal Document'}`,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200 }
        })
      )
      
      if (ref.content) {
        content.push(
          new Paragraph({
            children: [new TextRun(ref.content.substring(0, 500) + (ref.content.length > 500 ? '...' : ''))],
            spacing: { after: 200 },
            indent: { left: 360 }
          })
        )
      }
    })
  } else {
    content.push(
      new Paragraph({
        children: [new TextRun({
          text: "No law references available.",
          italic: true,
          color: "6b7280"
        })],
        spacing: { after: 200 }
      })
    )
  }
  
  return content
}

function processAnalysisContent(content: string, docxElements: any) {
  const { Paragraph, TextRun, HeadingLevel } = docxElements
  const paragraphs = []
  
  if (!content || !content.trim()) {
    return [
      new Paragraph({
        children: [new TextRun({
          text: "No content available.",
          italic: true,
          color: "6b7280"
        })],
        spacing: { after: 200 }
      })
    ]
  }
  
  // Split content into paragraphs
  const sections = content.split(/\n\s*\n/)
  
  for (const section of sections) {
    if (!section.trim()) continue
    
    const lines = section.split('\n')
    let currentListItems = []
    let inList = false
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      if (!trimmedLine) continue
      
      // Handle markdown headers
      if (trimmedLine.startsWith('###')) {
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
      // Handle bullet points
      else if (trimmedLine.match(/^[-*+]\s+/) || trimmedLine.match(/^\d+\.\s+/)) {
        const listText = trimmedLine.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '')
        currentListItems.push(listText)
        inList = true
      }
      else {
        // End any current list
        if (inList && currentListItems.length > 0) {
          paragraphs.push(...createFormattedList(currentListItems, docxElements))
          currentListItems = []
          inList = false
        }
        
        // Regular paragraph with inline formatting
        paragraphs.push(
          new Paragraph({
            children: processInlineFormatting(trimmedLine, docxElements),
            spacing: { after: 120 }
          })
        )
      }
    }
    
    // Handle any remaining list items
    if (inList && currentListItems.length > 0) {
      paragraphs.push(...createFormattedList(currentListItems, docxElements))
    }
  }
  
  return paragraphs
}

function createFormattedList(items: string[], docxElements: any) {
  const { Paragraph, TextRun } = docxElements
  
  return items.map(item => 
    new Paragraph({
      children: [
        new TextRun({ text: "• ", bold: true }),
        ...processInlineFormatting(item, docxElements)
      ],
      spacing: { after: 100 },
      indent: { left: 360 }
    })
  )
}

function processInlineFormatting(text: string, docxElements: any) {
  const { TextRun } = docxElements
  const runs = []
  
  // Simple bold formatting
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2)
      runs.push(new TextRun({ text: boldText, bold: true }))
    } else if (part) {
      runs.push(new TextRun(part))
    }
  }
  
  return runs.length > 0 ? runs : [new TextRun(text)]
}

// Helper functions for parsing content like the app does
function parsePreliminaryAnalysisForWord(analysisContent: string): any {
  if (!analysisContent?.trim()) {
    return {
      potentialLegalAreas: [],
      preliminaryIssues: [],
      researchPriorities: [],
      strategicNotes: []
    };
  }

  // Similar logic to the app's preliminary analysis parser
  const potentialLegalAreas: string[] = [];
  const preliminaryIssues: string[] = [];
  const researchPriorities: string[] = [];
  const strategicNotes: string[] = [];

  // Enhanced legal area detection
  const legalAreaPatterns = [
    /(?:Texas Lemon Law|Magnuson-Moss|Deceptive Trade Practices|DTPA)/gi,
    /(?:Texas Business & Commerce Code|Warranties|Express Warranty|Implied Warranty)/gi,
    /(?:Consumer Protection|Breach of Contract|Contract Law)/gi,
    /(?:Civil Practice & Remedies Code|Damages)/gi
  ];
  
  legalAreaPatterns.forEach(pattern => {
    const matches = analysisContent.match(pattern) || [];
    matches.forEach(match => {
      const formatted = match.charAt(0).toUpperCase() + match.slice(1);
      if (!potentialLegalAreas.includes(formatted)) {
        potentialLegalAreas.push(formatted);
      }
    });
  });

  // Enhanced issue detection
  const issuePatterns = [
    /(?:whether|can|did|does|is|was|will)\s+[^.]{15,150}[.?]/gi,
    /[^.]*(?:issue|question|problem|concern)[^.]{10,100}[.?]/gi,
    /[^.]*(?:liable|liability|responsible|breach)[^.]{10,100}[.?]/gi,
    /Does the repeated stalling[^.]*?/gi,
    /Has the manufacturer[^.]*?/gi
  ];
  
  issuePatterns.forEach(pattern => {
    const matches = analysisContent.match(pattern) || [];
    matches.forEach(match => {
      const cleaned = match.trim();
      if (cleaned.length > 20 && cleaned.length < 200 && !preliminaryIssues.includes(cleaned)) {
        preliminaryIssues.push(cleaned);
      }
    });
  });

  // Enhanced research priorities detection
  const researchPatterns = [
    /Specific requirements for[^.]*?/gi,
    /Definition of[^.]*?/gi,
    /Applicability of[^.]*?/gi,
    /Determine if[^.]*?/gi
  ];
  
  researchPatterns.forEach(pattern => {
    const matches = analysisContent.match(pattern) || [];
    matches.forEach(match => {
      const context = match.trim().replace(/\n+/g, ' ');
      if (context.length > 15 && context.length < 200 && !researchPriorities.includes(context)) {
        researchPriorities.push(context);
      }
    });
  });

  // Enhanced strategic notes detection
  const strategicPatterns = [
    /Gather all purchase documents[^.]*?/gi,
    /Obtain[^.]*?detailed repair records[^.]*?/gi,
    /Preserve any communication[^.]*?/gi
  ];
  
  strategicPatterns.forEach(pattern => {
    const matches = analysisContent.match(pattern) || [];
    matches.forEach(match => {
      const cleaned = match.trim().replace(/\n+/g, ' ');
      if (cleaned.length > 20 && cleaned.length < 200 && !strategicNotes.includes(cleaned)) {
        strategicNotes.push(cleaned);
      }
    });
  });

  return {
    potentialLegalAreas: potentialLegalAreas.slice(0, 8),
    preliminaryIssues: preliminaryIssues.slice(0, 6),
    researchPriorities: researchPriorities.slice(0, 6),
    strategicNotes: strategicNotes.slice(0, 6)
  };
}

function parseRelevantLawForWord(relevantLaw: string): any[] {
  const content: any[] = [];
  
  // Split content into sections and format like the app
  const lines = relevantLaw.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Handle bold headings (like **Texas Lemon Law Requirements:**)
    if (trimmed.match(/^\*\*(.*?)\*\*:?$/)) {
      const heading = trimmed.replace(/^\*\*(.*?)\*\*:?$/, '$1');
      content.push({ type: 'heading', text: heading });
    }
    // Handle bullet points or law descriptions
    else if (trimmed.match(/^[-•*]/)) {
      const text = trimmed.replace(/^[-•*]\s*/, '');
      content.push({ type: 'bullet', text });
    }
    // Handle law text with citations
    else if (trimmed.includes('(Tex.') || trimmed.includes('Code') || trimmed.includes('§')) {
      content.push({ type: 'paragraph', text: trimmed });
    }
    // Regular paragraphs
    else if (trimmed.length > 10) {
      content.push({ type: 'paragraph', text: trimmed });
    }
  }
  
  return content;
}

// Helper function to parse Step 2 preliminary analysis like the app does
function parsePreliminaryAnalysisForWord(analysisContent: string): any {
  if (!analysisContent?.trim()) {
    return {
      potentialLegalAreas: [],
      preliminaryIssues: [],
      researchPriorities: [],
      strategicNotes: []
    };
  }

  // Extract sections using the same logic as the app
  const potentialLegalAreas: string[] = [];
  const preliminaryIssues: string[] = [];
  const researchPriorities: string[] = [];
  const strategicNotes: string[] = [];

  // Extract Potential Legal Areas section
  const legalAreasMatch = analysisContent.match(/\*\*Potential Legal Areas:\*\*([\s\S]*?)(?=\*\*|$)/);
  if (legalAreasMatch) {
    const lines = legalAreasMatch[1].split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+\.\s/) || trimmed.startsWith('•') || trimmed.startsWith('-')) {
        const area = trimmed.replace(/^\d+\.\s*|^[•-]\s*/, '').trim();
        if (area && area.length > 3) {
          potentialLegalAreas.push(area);
        }
      }
    });
  }

  // Extract Preliminary Issues section  
  const issuesMatch = analysisContent.match(/\*\*Preliminary Issues:\*\*([\s\S]*?)(?=\*\*|$)/);
  if (issuesMatch) {
    const lines = issuesMatch[1].split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+\.\s/) || trimmed.startsWith('•') || trimmed.startsWith('-')) {
        const issue = trimmed.replace(/^\d+\.\s*|^[•-]\s*/, '').trim();
        if (issue && issue.length > 10) {
          preliminaryIssues.push(issue);
        }
      }
    });
  }

  // Extract Research Priorities section
  const prioritiesMatch = analysisContent.match(/\*\*Research Priorities:\*\*([\s\S]*?)(?=\*\*|$)/);
  if (prioritiesMatch) {
    const lines = prioritiesMatch[1].split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+\.\s/) || trimmed.startsWith('•') || trimmed.startsWith('-')) {
        const priority = trimmed.replace(/^\d+\.\s*|^[•-]\s*/, '').trim();
        if (priority && priority.length > 10) {
          researchPriorities.push(priority);
        }
      }
    });
  }

  // Extract Strategic Notes section
  const notesMatch = analysisContent.match(/\*\*Strategic Notes:\*\*([\s\S]*?)(?=\*\*|$)/);
  if (notesMatch) {
    const lines = notesMatch[1].split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+\.\s/) || trimmed.startsWith('•') || trimmed.startsWith('-')) {
        const note = trimmed.replace(/^\d+\.\s*|^[•-]\s*/, '').trim();
        if (note && note.length > 10) {
          strategicNotes.push(note);
        }
      }
    });
  }

  return {
    potentialLegalAreas,
    preliminaryIssues,
    researchPriorities,
    strategicNotes
  };
}