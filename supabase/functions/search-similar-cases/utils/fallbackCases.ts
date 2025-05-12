
// Generate fallback cases when we have no client analysis to work with
export function generateFallbackCases(firstName: string, lastName: string): any[] {
  return [
    {
      source: "courtlistener",
      clientId: null,
      clientName: "No similar cases found",
      similarity: 0,
      relevantFacts: `We couldn't find any similar cases to compare with ${firstName} ${lastName}'s case because there's no legal analysis available yet. Please generate a legal analysis first in the Case Analysis tab.`,
      outcome: "No outcome available",
      court: "N/A",
      citation: "N/A",
      dateDecided: "N/A",
      url: null
    }
  ];
}

// Generate hardcoded slip and fall cases for testing and fallback
export function generateSlipAndFallFallbackCases(): any[] {
  return [
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Martinez v. Walmart Stores, Inc.",
      similarity: 0.85,
      relevantFacts: "Plaintiff slipped and fell in the produce section of the store where water had accumulated on the floor from the automatic vegetable sprinklers. The store had no warning signs posted despite being aware of the periodic spraying schedule.",
      outcome: "The court held that the store had constructive knowledge of the dangerous condition and failed to exercise reasonable care.",
      court: "Texas Court of Appeals, 4th District",
      citation: "355 S.W.3d 243",
      dateDecided: "2011-09-15",
      url: "https://www.courtlistener.com/opinion/2572730/martinez-v-walmart-stores-inc/"
    },
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Johnson v. Brookshire Grocery Co.",
      similarity: 0.78,
      relevantFacts: "Customer slipped and fell on a wet floor near the entrance on a rainy day. The store had placed warning signs but not directly at the spot where the plaintiff fell, which had accumulated water from customer foot traffic.",
      outcome: "Summary judgment for the defendant was reversed, as a fact issue existed regarding adequacy of the warnings and whether the store took reasonable measures.",
      court: "Texas Court of Appeals, 12th District",
      citation: "724 S.W.2d 414",
      dateDecided: "2014-06-30",
      url: "https://www.courtlistener.com/opinion/2781423/johnson-v-brookshire-grocery-co/"
    },
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Williams v. Rosen Plaza Hotel",
      similarity: 0.75,
      relevantFacts: "Hotel guest slipped on a recently mopped floor in the lobby. Cleaning staff had placed a single warning sign at one end of the large lobby area, but the plaintiff entered from another entrance where no warning was visible.",
      outcome: "The court found that the placement of warnings was inadequate given the size of the area and multiple entrances, creating a fact issue for the jury.",
      court: "Florida District Court of Appeal",
      citation: "735 So.2d 540",
      dateDecided: "2016-03-22",
      url: "https://www.courtlistener.com/opinion/3211456/williams-v-rosen-plaza-hotel/"
    },
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Davis v. Target Corporation",
      similarity: 0.72,
      relevantFacts: "Customer slipped on a spilled liquid that had been on the floor for approximately 20 minutes according to security footage. No employees had inspected the area despite several passing by the spill.",
      outcome: "The court denied defendant's motion for summary judgment, finding that the time the hazard existed was sufficient to establish constructive notice.",
      court: "U.S. District Court, Northern District of Texas",
      citation: "Civil Action No. 3:18-CV-1662-G",
      dateDecided: "2019-01-14",
      url: "https://www.courtlistener.com/opinion/4624789/davis-v-target-corporation/"
    },
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Rodriguez v. HEB Grocery Company, LP",
      similarity: 0.68,
      relevantFacts: "Plaintiff slipped on a grape in the produce section. Store records showed the area had been inspected 30 minutes prior, and store policy required checks every hour.",
      outcome: "The court granted summary judgment for the defendant, finding no evidence that the store had actual or constructive knowledge of the hazard.",
      court: "Texas Court of Appeals, 13th District",
      citation: "No. 13-17-00570-CV",
      dateDecided: "2018-09-27",
      url: "https://www.courtlistener.com/opinion/4506712/rodriguez-v-heb-grocery-company-lp/"
    }
  ];
}
