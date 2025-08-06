import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  documentId: string;
  clientId: string;
  caseId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, clientId, caseId }: AnalysisRequest = await req.json();

    console.log("Analyzing document context for:", documentId);

    // Simulate document analysis
    const analysis = await generateDocumentAnalysis({
      documentId,
      clientId,
      caseId
    });

    console.log("Document analysis completed");

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error analyzing document:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateDocumentAnalysis(params: {
  documentId: string;
  clientId: string;
  caseId?: string;
}) {
  // For demo purposes, generate realistic document analysis
  // In production, this would integrate with document processing AI
  
  const documentTypes = [
    {
      type: "contract",
      summary: "Service agreement with potential enforceability issues in termination and liability clauses.",
      keyPoints: [
        "Contract term: 2 years with auto-renewal",
        "Termination requires 90-day notice",
        "Liability limited to $100,000",
        "Intellectual property rights assigned to company",
        "Non-compete clause extends 18 months post-termination"
      ],
      legalIssues: [
        "Overly broad non-compete provision",
        "Unconscionable liability limitation",
        "Ambiguous IP assignment language",
        "Auto-renewal clause enforceability"
      ],
      riskFactors: [
        { level: "high" as const, description: "Non-compete clause may be unenforceable under state law" },
        { level: "medium" as const, description: "Liability limitation may not cover intentional misconduct" },
        { level: "low" as const, description: "Standard IP assignment provisions" }
      ]
    },
    {
      type: "employment",
      summary: "Employment termination documentation showing potential wrongful discharge claims.",
      keyPoints: [
        "Employee terminated without progressive discipline",
        "Performance reviews show satisfactory ratings",
        "No documentation of misconduct or policy violations",
        "Termination occurred shortly after FMLA request",
        "Final paycheck included unused vacation time"
      ],
      legalIssues: [
        "Potential FMLA retaliation claim",
        "Failure to follow progressive discipline policy",
        "Pretextual termination evidence",
        "Lack of legitimate business reason"
      ],
      riskFactors: [
        { level: "high" as const, description: "Timing suggests FMLA retaliation" },
        { level: "medium" as const, description: "Inconsistent application of discipline policy" },
        { level: "low" as const, description: "Proper final pay calculation" }
      ]
    },
    {
      type: "litigation",
      summary: "Court filing containing discovery responses with potential privilege issues.",
      keyPoints: [
        "Responses contain attorney-client communications",
        "Some documents marked as confidential",
        "Privilege log incomplete",
        "Work product doctrine claims unclear",
        "Third-party communications included"
      ],
      legalIssues: [
        "Potential waiver of attorney-client privilege",
        "Inadequate privilege log",
        "Overbroad privilege claims",
        "Discovery rule violations"
      ],
      riskFactors: [
        { level: "high" as const, description: "Privilege waiver risk from disclosure" },
        { level: "medium" as const, description: "Court may order additional discovery" },
        { level: "low" as const, description: "Standard confidentiality protections apply" }
      ]
    }
  ];

  // Select document type based on ID hash or random for demo
  const selectedType = documentTypes[Math.floor(Math.random() * documentTypes.length)];

  const analysis = {
    summary: selectedType.summary,
    keyPoints: selectedType.keyPoints,
    legalIssues: selectedType.legalIssues,
    relevantStatutes: generateRelevantStatutes(selectedType.type),
    riskFactors: selectedType.riskFactors,
    recommendations: generateRecommendations(selectedType.type),
    similarCases: generateSimilarCases(selectedType.type),
    citationSuggestions: generateCitations(selectedType.type)
  };

  return analysis;
}

function generateRelevantStatutes(documentType: string): string[] {
  const statuteLibrary = {
    contract: [
      "UCC § 2-313 (Express Warranties)",
      "UCC § 2-719 (Limitation of Remedies)",
      "Restatement (Second) of Contracts § 208"
    ],
    employment: [
      "29 U.S.C. § 2615 (FMLA)",
      "42 U.S.C. § 2000e (Title VII)",
      "State Wrongful Discharge Act § 12.34"
    ],
    litigation: [
      "Fed. R. Civ. P. 26(b)(3) (Work Product)",
      "Fed. R. Evid. 502 (Attorney-Client Privilege)",
      "Local Rule 26.1 (Discovery Procedures)"
    ],
    default: [
      "State Civil Code § 15.45",
      "Federal Rules of Civil Procedure",
      "State Evidence Code § 9.12"
    ]
  };

  return statuteLibrary[documentType as keyof typeof statuteLibrary] || statuteLibrary.default;
}

function generateRecommendations(documentType: string): string[] {
  const recommendationLibrary = {
    contract: [
      "Request modification of liability limitation clause",
      "Clarify intellectual property assignment scope",
      "Negotiate reasonable non-compete provisions",
      "Add specific termination procedures",
      "Include dispute resolution mechanism"
    ],
    employment: [
      "Document all employment decisions with clear business justification",
      "Ensure FMLA compliance in all personnel actions",
      "Review and update progressive discipline policy",
      "Train supervisors on anti-retaliation requirements",
      "Maintain detailed performance documentation"
    ],
    litigation: [
      "Prepare comprehensive privilege log",
      "Review all documents for privilege claims",
      "Implement document retention procedures",
      "Train staff on privilege protection",
      "Consider protective order for sensitive materials"
    ],
    default: [
      "Conduct thorough legal review",
      "Gather supporting documentation",
      "Consider alternative dispute resolution",
      "Evaluate potential risks and benefits",
      "Develop comprehensive strategy"
    ]
  };

  return recommendationLibrary[documentType as keyof typeof recommendationLibrary] || recommendationLibrary.default;
}

function generateSimilarCases(documentType: string): any[] {
  const caseLibrary = {
    contract: [
      {
        source: "courtlistener",
        clientId: null,
        clientName: "Martinez v. Software Solutions Inc",
        similarity: 0.85,
        relevantFacts: "Non-compete clause deemed overly broad and unenforceable",
        outcome: "Court struck down non-compete, enforced remainder of contract",
        court: "State Supreme Court",
        citation: "Martinez v. Software Solutions, 847 P.2d 123 (2023)",
        dateDecided: "2023-05-12"
      }
    ],
    employment: [
      {
        source: "courtlistener", 
        clientId: null,
        clientName: "Thompson v. Manufacturing Corp",
        similarity: 0.78,
        relevantFacts: "FMLA retaliation claim based on timing of termination",
        outcome: "Jury verdict for plaintiff, $350,000 damages",
        court: "Federal District Court",
        citation: "Thompson v. Manufacturing Corp, 456 F.Supp.3d 789 (2023)",
        dateDecided: "2023-07-08"
      }
    ],
    litigation: [
      {
        source: "internal",
        clientId: "456",
        clientName: "Discovery Motion Practice - Johnson Case",
        similarity: 0.72,
        relevantFacts: "Privilege log deficiencies required supplemental responses",
        outcome: "Court ordered additional discovery but no sanctions",
        dateDecided: "2023-09-15"
      }
    ],
    default: [
      {
        source: "courtlistener",
        clientId: null,
        clientName: "Generic Case v. Standard Defendant",
        similarity: 0.65,
        relevantFacts: "Similar legal issue with comparable facts",
        outcome: "Settlement reached before trial",
        dateDecided: "2023-06-01"
      }
    ]
  };

  return caseLibrary[documentType as keyof typeof caseLibrary] || caseLibrary.default;
}

function generateCitations(documentType: string): string[] {
  const citationLibrary = {
    contract: [
      "Williams v. Walker-Thomas Furniture Co., 350 F.2d 445 (D.C. Cir. 1965)",
      "Carnival Cruise Lines v. Shute, 499 U.S. 585 (1991)",
      "A&M Produce Co. v. FMC Corp., 135 Cal. App. 3d 473 (1982)"
    ],
    employment: [
      "Nevada Dept. of Human Resources v. Hibbs, 538 U.S. 721 (2003)",
      "Ragsdale v. Wolverine World Wide, Inc., 535 U.S. 81 (2002)",
      "Desert Palace, Inc. v. Costa, 539 U.S. 90 (2003)"
    ],
    litigation: [
      "Hickman v. Taylor, 329 U.S. 495 (1947)",
      "Upjohn Co. v. United States, 449 U.S. 383 (1981)",
      "Federal Trade Comm'n v. Grolier Inc., 462 U.S. 19 (1983)"
    ],
    default: [
      "United States v. Nixon, 418 U.S. 683 (1974)",
      "Brady v. Maryland, 373 U.S. 83 (1963)",
      "Daubert v. Merrell Dow Pharmaceuticals, 509 U.S. 579 (1993)"
    ]
  };

  return citationLibrary[documentType as keyof typeof citationLibrary] || citationLibrary.default;
}