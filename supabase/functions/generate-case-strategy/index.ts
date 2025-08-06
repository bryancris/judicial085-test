import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StrategyRequest {
  clientId: string;
  caseId?: string;
  caseDescription: string;
  caseType?: string;
  customNotes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, caseId, caseDescription, caseType, customNotes }: StrategyRequest = await req.json();

    console.log("Generating case strategy for client:", clientId, "case:", caseId);

    // Extract key legal concepts from case description
    const legalConcepts = extractLegalConcepts(caseDescription);
    
    // Generate strategy based on case type and historical data
    const strategy = await generateAIStrategy({
      caseDescription,
      caseType: caseType || 'general',
      legalConcepts,
      customNotes
    });

    console.log("Generated strategy successfully");

    return new Response(JSON.stringify({ strategy }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating case strategy:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractLegalConcepts(description: string): string[] {
  const concepts = [];
  const lowercaseText = description.toLowerCase();
  
  const legalTerms = [
    "contract", "breach", "negligence", "liability", "damages", 
    "employment", "discrimination", "harassment", "wrongful termination",
    "personal injury", "medical malpractice", "product liability",
    "property", "real estate", "landlord", "tenant", "lease",
    "divorce", "custody", "alimony", "child support",
    "criminal", "DUI", "assault", "theft", "fraud",
    "intellectual property", "trademark", "copyright", "patent"
  ];

  legalTerms.forEach(term => {
    if (lowercaseText.includes(term)) {
      concepts.push(term);
    }
  });

  return concepts;
}

async function generateAIStrategy(params: {
  caseDescription: string;
  caseType: string;
  legalConcepts: string[];
  customNotes?: string;
}) {
  const { caseDescription, caseType, legalConcepts, customNotes } = params;

  // For demo purposes, generate realistic strategy based on case type
  const strategies = {
    contract: {
      winProbability: 75,
      duration: "6-12 months",
      strengths: [
        "Clear contract language supports our position",
        "Documented breach with evidence",
        "Favorable jurisdiction for contract disputes"
      ],
      weaknesses: [
        "Opposing party may claim mutual mistake",
        "Damages calculation may be disputed"
      ],
      opportunities: [
        "Recent case law favors strict contract interpretation",
        "Potential for attorney fees recovery"
      ],
      actions: [
        "Gather all contract-related documentation",
        "Depose key witnesses to the agreement",
        "Research recent contract law developments",
        "Prepare damages calculation with expert testimony"
      ],
      outcomes: {
        best: "Full contract damages plus attorney fees ($200k-$500k)",
        likely: "Partial damages and settlement ($100k-$300k)",
        worst: "Dismissal on procedural grounds or minimal damages (<$50k)"
      }
    },
    employment: {
      winProbability: 65,
      duration: "8-18 months",
      strengths: [
        "Documented pattern of discriminatory behavior",
        "Witness testimony available",
        "Clear policy violations by employer"
      ],
      weaknesses: [
        "At-will employment complicates wrongful termination claims",
        "Limited documentation of some incidents"
      ],
      opportunities: [
        "Recent EEOC guidance supports our interpretation",
        "Class action potential if pattern is widespread"
      ],
      actions: [
        "File EEOC complaint if not already done",
        "Gather employment records and communications",
        "Interview potential witnesses",
        "Research similar cases and settlements"
      ],
      outcomes: {
        best: "Significant settlement with reinstatement ($150k-$400k)",
        likely: "Moderate settlement without admission ($75k-$200k)",
        worst: "Dismissal or minimal settlement (<$25k)"
      }
    },
    "personal-injury": {
      winProbability: 80,
      duration: "12-24 months",
      strengths: [
        "Clear liability and causation",
        "Significant documented injuries",
        "Strong medical evidence"
      ],
      weaknesses: [
        "Potential comparative negligence issues",
        "Insurance coverage limits may cap recovery"
      ],
      opportunities: [
        "Multiple liable parties increase recovery potential",
        "Precedent for punitive damages in similar cases"
      ],
      actions: [
        "Obtain all medical records and expert opinions",
        "Investigate accident scene and gather evidence",
        "Calculate economic and non-economic damages",
        "Evaluate insurance coverage and assets"
      ],
      outcomes: {
        best: "Full damages including pain and suffering ($500k-$2M)",
        likely: "Settlement within insurance limits ($250k-$750k)",
        worst: "Comparative negligence reduces award significantly (<$100k)"
      }
    },
    general: {
      winProbability: 60,
      duration: "6-18 months",
      strengths: [
        "Strong factual foundation",
        "Applicable legal precedents"
      ],
      weaknesses: [
        "Complex legal issues may arise",
        "Opposing party has resources for litigation"
      ],
      opportunities: [
        "Potential for favorable settlement",
        "Developing area of law"
      ],
      actions: [
        "Conduct thorough legal research",
        "Gather supporting documentation",
        "Evaluate settlement opportunities",
        "Prepare comprehensive case strategy"
      ],
      outcomes: {
        best: "Favorable judgment or settlement",
        likely: "Negotiated resolution",
        worst: "Unfavorable outcome or dismissal"
      }
    }
  };

  const strategyTemplate = strategies[caseType as keyof typeof strategies] || strategies.general;

  // Generate key factors based on template
  const keyFactors = [
    ...strategyTemplate.strengths.map((strength, index) => ({
      id: `strength-${index}`,
      type: "strength" as const,
      title: `Strength: ${strength.split(':')[0] || 'Legal Advantage'}`,
      description: strength,
      confidence: 0.8 + Math.random() * 0.15,
      precedents: generateRelevantPrecedents(legalConcepts),
      actions: ["Research supporting authority", "Gather evidence"]
    })),
    ...strategyTemplate.weaknesses.map((weakness, index) => ({
      id: `weakness-${index}`,
      type: "weakness" as const,
      title: `Risk: ${weakness.split(':')[0] || 'Potential Challenge'}`,
      description: weakness,
      confidence: 0.6 + Math.random() * 0.2,
      precedents: [],
      actions: ["Develop mitigation strategy", "Prepare counter-arguments"]
    })),
    ...strategyTemplate.opportunities.map((opportunity, index) => ({
      id: `opportunity-${index}`,
      type: "opportunity" as const,
      title: `Opportunity: ${opportunity.split(':')[0] || 'Strategic Advantage'}`,
      description: opportunity,
      confidence: 0.7 + Math.random() * 0.2,
      precedents: generateRelevantPrecedents(legalConcepts),
      actions: ["Capitalize on advantage", "Monitor developments"]
    }))
  ];

  return {
    overview: `Based on analysis of the case facts and similar matters, this ${caseType} case presents ${strategyTemplate.winProbability >= 70 ? 'strong' : strategyTemplate.winProbability >= 50 ? 'moderate' : 'challenging'} prospects for success. ${customNotes ? `Additional considerations: ${customNotes}` : ''}`,
    winProbability: strategyTemplate.winProbability + Math.floor(Math.random() * 10 - 5),
    estimatedDuration: strategyTemplate.duration,
    keyFactors,
    recommendedActions: strategyTemplate.actions,
    potentialOutcomes: strategyTemplate.outcomes
  };
}

function generateRelevantPrecedents(concepts: string[]): string[] {
  const precedentLibrary = {
    contract: ["Smith v. Jones Corp (2023)", "Brown v. Manufacturing LLC (2022)"],
    employment: ["EEOC v. Employer Inc (2023)", "Worker v. Big Corp (2022)"],
    negligence: ["Plaintiff v. Defendant Ltd (2023)", "Injury v. Liable Party (2022)"],
    property: ["Owner v. Tenant (2023)", "Landlord v. Renter (2022)"],
    default: ["Recent Case v. Opposing Party (2023)", "Similar Matter v. Defendant (2022)"]
  };

  const relevantPrecedents = [];
  concepts.forEach(concept => {
    const conceptPrecedents = precedentLibrary[concept as keyof typeof precedentLibrary] || precedentLibrary.default;
    relevantPrecedents.push(...conceptPrecedents.slice(0, 1));
  });

  return relevantPrecedents.slice(0, 2);
}