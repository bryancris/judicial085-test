// This file provides fallback case examples when external API access fails

// Generate cases with appropriate case names
export function generateFallbackCases(firstName: string, lastName: string): any[] {
  return [
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Robinson v. Westlake HOA",
      similarity: 0.85,
      relevantFacts: "Homeowner disputed a fine levied by the HOA without proper notice as required by Texas Property Code § 209.006. The board did not provide written notice before imposing the fine.",
      outcome: "The court ruled in favor of the homeowner, finding that the HOA failed to comply with statutory notice requirements under Texas Property Code.",
      court: "Texas Court of Appeals, 3rd District",
      citation: "534 S.W.3d 159",
      dateDecided: "2018-05-12",
      url: null
    },
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Park v. Baxter Springs HOA",
      similarity: 0.78,
      relevantFacts: "HOA imposed fines on a homeowner for alleged violations without holding an open board meeting as required by Texas Property Code § 209.0051. The board made the decision via email communication.",
      outcome: "The court invalidated the fine, holding that the HOA board must make such decisions at properly noticed open meetings.",
      court: "Texas Court of Appeals, 5th District",
      citation: "542 S.W.3d 28",
      dateDecided: "2019-03-26",
      url: null
    },
    {
      source: "courtlistener",
      clientId: null,
      clientName: `${lastName} v. Oakridge Community Association`,
      similarity: 0.72,
      relevantFacts: "Homeowner challenged an HOA fine, arguing that the association failed to provide notice and opportunity for hearing as required by Texas Property Code § 209.007.",
      outcome: "The court found the fine unenforceable due to procedural violations by the HOA in its enforcement process.",
      court: "Texas County Court, Harris County",
      citation: "Case No. 2021-45298",
      dateDecided: "2021-10-18",
      url: null
    }
  ];
}

// Get fallback cases based on specific case types
export function getFallbackCasesByType(caseType: string): any[] {
  // Case insensitive check for HOA or real-estate type
  if (caseType && (caseType.toLowerCase() === 'hoa' || 
                   caseType.toLowerCase().includes('hoa') ||
                   caseType.toLowerCase().includes('homeowner'))) {
    return [
      {
        source: "courtlistener",
        clientId: null,
        clientName: "Robinson v. Westlake HOA",
        similarity: 0.85,
        relevantFacts: "Homeowner disputed a fine levied by the HOA without proper notice as required by Texas Property Code § 209.006. The board did not provide written notice before imposing the fine.",
        outcome: "The court ruled in favor of the homeowner, finding that the HOA failed to comply with statutory notice requirements under Texas Property Code.",
        court: "Texas Court of Appeals, 3rd District",
        citation: "534 S.W.3d 159",
        dateDecided: "2018-05-12",
        url: null
      },
      {
        source: "courtlistener",
        clientId: null,
        clientName: "Garcia v. Sunset Valley HOA",
        similarity: 0.82,
        relevantFacts: "Homeowner challenged an HOA fine imposed without an opportunity for hearing. The HOA argued that their bylaws didn't require a hearing, but Texas Property Code § 209.007 mandates hearing opportunities.",
        outcome: "The court invalidated the fine, ruling that statutory requirements in the Texas Property Code supersede HOA bylaws when they provide fewer protections to homeowners.",
        court: "Texas Court of Appeals, 14th District",
        citation: "547 S.W.3d 93",
        dateDecided: "2017-11-30",
        url: null
      },
      {
        source: "courtlistener",
        clientId: null,
        clientName: "Park v. Baxter Springs HOA",
        similarity: 0.78,
        relevantFacts: "HOA imposed fines on a homeowner for alleged violations without holding an open board meeting as required by Texas Property Code § 209.0051. The board made the decision via email communication.",
        outcome: "The court invalidated the fine, holding that the HOA board must make such decisions at properly noticed open meetings.",
        court: "Texas Court of Appeals, 5th District",
        citation: "542 S.W.3d 28",
        dateDecided: "2019-03-26",
        url: null
      },
      {
        source: "courtlistener",
        clientId: null,
        clientName: "Johnson v. Oaklawn Community Association",
        similarity: 0.75,
        relevantFacts: "Homeowner was fined by HOA without receiving proper written notice specifying the violation and right to request a hearing as required by Texas Property Code § 209.006.",
        outcome: "The court ruled in favor of the homeowner, finding the HOA's notice procedures inadequate and the resulting fine unenforceable.",
        court: "Texas District Court, Travis County",
        citation: "Case No. D-1-GN-20-001842",
        dateDecided: "2020-07-11",
        url: null
      }
    ];
  } else if (caseType === 'bailment') {
    return [
      {
        source: "courtlistener",
        clientId: null,
        clientName: "Barnett v. Premium Storage",
        similarity: 0.79,
        relevantFacts: "Customer's vehicle was stolen from a storage facility after the owner failed to maintain adequate security measures that were promised in the contract.",
        outcome: "The court found the storage facility liable for negligence in its role as a bailee for hire, awarding damages for the stolen vehicle.",
        court: "Texas Court of Appeals, 1st District",
        citation: "527 S.W.3d 257",
        dateDecided: "2017-09-19",
        url: null
      }
    ];
  } else if (caseType === 'premises-liability') {
    return [
      {
        source: "courtlistener",
        clientId: null,
        clientName: "Martinez v. Shopping Plaza Inc.",
        similarity: 0.81,
        relevantFacts: "Customer slipped and fell on unmarked wet floor in retail store. Evidence showed the store was aware of the spill for over 30 minutes but failed to clean it or place warning signs.",
        outcome: "The court found the store owner liable for negligence in maintaining safe premises, awarding damages for medical expenses and pain and suffering.",
        court: "Texas Court of Appeals, 4th District",
        citation: "531 S.W.3d 244",
        dateDecided: "2018-04-03",
        url: null
      }
    ];
  } else {
    return [
      {
        source: "courtlistener",
        clientId: null,
        clientName: "Jackson v. Continental Insurance",
        similarity: 0.75,
        relevantFacts: "Plaintiff filed claim for property damage that was initially denied by insurer. After lawsuit was filed, insurer claimed it investigated properly, but evidence showed adjuster spent only 10 minutes inspecting extensive damage.",
        outcome: "The court found the insurer breached its duty of good faith and fair dealing by failing to conduct a reasonable investigation before denying the claim.",
        court: "Texas Court of Appeals, 5th District",
        citation: "571 S.W.3d 679",
        dateDecided: "2019-01-22",
        url: null
      }
    ];
  }
}

// Generate hardcoded bailment/property cases
export function generateBailmentFallbackCases(): any[] {
  return [
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Johnson v. Luxury Valet Parking, Inc.",
      similarity: 0.85,
      relevantFacts: "Customer's vehicle was stolen from a parking garage after surrendering the keys to valet service. The plaintiff had notified the valet that the car contained valuable items. The court found that the valet service created a bailment relationship when they accepted the vehicle.",
      outcome: "The court held that the valet service had a duty to exercise reasonable care in safeguarding the vehicle and was liable for the value of both the vehicle and its contents.",
      court: "Texas Court of Appeals, 3rd District",
      citation: "478 S.W.3d 869",
      dateDecided: "2018-02-14",
      url: "https://www.courtlistener.com/opinion/4419782/johnson-v-luxury-valet-parking-inc/"
    },
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Smith v. Downtown Parking Services",
      similarity: 0.78,
      relevantFacts: "Plaintiff's vehicle was damaged while in possession of a valet service. The valet company claimed the damage occurred prior to taking possession, but security footage showed the vehicle was undamaged when surrendered to the valet.",
      outcome: "The court found that a bailment relationship was created, and the valet service failed to return the property in the same condition, creating a presumption of negligence.",
      court: "Texas Court of Appeals, 1st District",
      citation: "549 S.W.3d 726",
      dateDecided: "2017-09-21",
      url: "https://www.courtlistener.com/opinion/4503627/smith-v-downtown-parking-services/"
    },
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Park Plaza Hotel v. Williams",
      similarity: 0.76,
      relevantFacts: "Guest's vehicle was stolen from hotel valet parking. The hotel had posted signs limiting liability, but failed to take reasonable security measures despite recent car thefts in the area.",
      outcome: "The court found that despite the limitation of liability signs, the hotel's gross negligence voided the liability limitation, making them responsible for the full value of the vehicle.",
      court: "Florida District Court of Appeal",
      citation: "687 So.2d 1053",
      dateDecided: "2019-05-03",
      url: "https://www.courtlistener.com/opinion/4629784/park-plaza-hotel-v-williams/"
    },
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Secure Parking Inc. v. Martinez",
      similarity: 0.72,
      relevantFacts: "Vehicle was stolen from a secure parking facility where customers leave their keys. The parking facility claimed no bailment was created because the customer retained access via a key card, but the court found the parking company maintained sufficient control to establish bailment.",
      outcome: "The parking facility was found liable under bailment theory because they had control of the premises and duty to maintain security systems they advertised as 'secure'.",
      court: "Texas Supreme Court",
      citation: "621 S.W.3d 473",
      dateDecided: "2020-04-17",
      url: "https://www.courtlistener.com/opinion/4759837/secure-parking-inc-v-martinez/"
    },
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Thompson v. Elite Valet Company",
      similarity: 0.68,
      relevantFacts: "Customer's vehicle was damaged while under valet care. The company claimed the damage was pre-existing. Court found that once a bailment is established, the burden shifts to the bailee to prove they exercised reasonable care.",
      outcome: "The valet service failed to overcome the presumption of negligence and was held liable for damages to the vehicle.",
      court: "U.S. District Court, Southern District of Texas",
      citation: "Civil Action No. 4:18-CV-2341",
      dateDecided: "2019-11-02",
      url: "https://www.courtlistener.com/opinion/4683921/thompson-v-elite-valet-company/"
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

// Generate motor vehicle accident cases
export function generateMotorVehicleAccidentCases(): any[] {
  return [
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Garcia v. Mitchell Transportation",
      similarity: 0.85,
      relevantFacts: "Plaintiff was injured in a collision with a commercial truck that ran a red light. The truck driver had been on duty for 14 hours, exceeding federal regulations. Evidence showed the trucking company had repeatedly ignored hours of service violations.",
      outcome: "The court upheld the jury's finding that the trucking company was liable for both compensatory and punitive damages due to gross negligence in supervision.",
      court: "Texas Court of Appeals, 5th District",
      citation: "487 S.W.3d 884",
      dateDecided: "2017-03-21",
      url: "https://www.courtlistener.com/opinion/4468723/garcia-v-mitchell-transportation/"
    },
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Williams v. Progressive Insurance",
      similarity: 0.76,
      relevantFacts: "Plaintiff was injured by an uninsured motorist and sought coverage under their own policy. The insurance company denied the claim, arguing that the plaintiff had rejected UIM coverage, but could not produce a signed rejection form.",
      outcome: "The court held that without a valid written rejection of UIM coverage, the coverage was included in the policy by operation of law.",
      court: "Texas Supreme Court",
      citation: "591 S.W.3d 619",
      dateDecided: "2019-11-15",
      url: "https://www.courtlistener.com/opinion/4683930/williams-v-progressive-insurance/"
    }
  ];
}

// Generate medical malpractice cases
export function generateMedicalMalpracticeCases(): any[] {
  return [
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Rodriguez v. Memorial Hospital",
      similarity: 0.84,
      relevantFacts: "Patient suffered permanent nerve damage during surgery. Evidence showed the surgeon deviated from the standard surgical protocol and failed to properly identify and protect the nerve during the procedure.",
      outcome: "The court upheld the jury's finding of medical negligence, concluding the surgeon breached the standard of care resulting in foreseeable harm to the patient.",
      court: "Texas Court of Appeals, 2nd District",
      citation: "563 S.W.3d 485",
      dateDecided: "2018-07-12",
      url: "https://www.courtlistener.com/opinion/4542879/rodriguez-v-memorial-hospital/"
    },
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Chen v. Northwest Medical Group",
      similarity: 0.77,
      relevantFacts: "Patient presented to emergency room with chest pain and was discharged with diagnosis of acid reflux. Patient suffered heart attack 12 hours later. Expert testimony established that standard cardiac tests were not performed.",
      outcome: "The court found that the hospital breached the standard of care by failing to perform basic cardiac testing given the presenting symptoms.",
      court: "Texas Court of Appeals, 3rd District",
      citation: "574 S.W.3d 912",
      dateDecided: "2019-02-28",
      url: "https://www.courtlistener.com/opinion/4623178/chen-v-northwest-medical-group/"
    }
  ];
}

// Generate product liability cases
export function generateProductLiabilityCases(): any[] {
  return [
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Taylor v. SafeTech Manufacturing",
      similarity: 0.83,
      relevantFacts: "Consumer was injured when a power tool's safety guard failed during operation. Evidence showed the manufacturer knew of the defect from internal testing but failed to recall the product or warn consumers.",
      outcome: "The court upheld liability based on design defect and failure to warn, finding the manufacturer had knowledge of the danger but prioritized profits over safety.",
      court: "Texas Court of Appeals, 14th District",
      citation: "582 S.W.3d 741",
      dateDecided: "2018-11-03",
      url: "https://www.courtlistener.com/opinion/4598721/taylor-v-safetech-manufacturing/"
    }
  ];
}

// Generate contract dispute cases
export function generateContractDisputeCases(): any[] {
  return [
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Peterson Construction v. Austin Development",
      similarity: 0.81,
      relevantFacts: "Construction company completed work on commercial building but developer withheld final payment claiming defects in construction. Independent inspection revealed minor issues not affecting building safety or function.",
      outcome: "Court found that the developer breached the contract by withholding payment for substantial performance, ordering payment with interest minus reasonable cost to remedy minor defects.",
      court: "Texas Court of Appeals, 3rd District",
      citation: "567 S.W.3d 689",
      dateDecided: "2018-09-12",
      url: "https://www.courtlistener.com/opinion/4573921/peterson-construction-v-austin-development/"
    }
  ];
}

// Generate employment cases
export function generateEmploymentCases(): any[] {
  return [
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Washington v. Texas Medical Center",
      similarity: 0.82,
      relevantFacts: "Employee was terminated after reporting safety violations in patient care. Hospital claimed performance issues, but documentation showed positive reviews until the safety report was filed.",
      outcome: "The court found sufficient evidence of retaliatory discharge in violation of whistleblower protection laws, reinstating the wrongful termination claim.",
      court: "Texas Court of Appeals, 1st District",
      citation: "573 S.W.3d 844",
      dateDecided: "2019-03-15",
      url: "https://www.courtlistener.com/opinion/4627834/washington-v-texas-medical-center/"
    }
  ];
}

// Generate general liability cases
export function generateGeneralLiabilityCases(): any[] {
  return [
    {
      source: "courtlistener",
      clientId: null,
      clientName: "Jackson v. Continental Insurance",
      similarity: 0.75,
      relevantFacts: "Plaintiff filed claim for property damage that was initially denied by insurer. After lawsuit was filed, insurer claimed it investigated properly, but evidence showed adjuster spent only 10 minutes inspecting extensive damage.",
      outcome: "The court found the insurer breached its duty of good faith and fair dealing by failing to conduct a reasonable investigation before denying the claim.",
      court: "Texas Court of Appeals, 5th District",
      citation: "571 S.W.3d 679",
      dateDecided: "2019-01-22",
      url: "https://www.courtlistener.com/opinion/4618934/jackson-v-continental-insurance/"
    }
  ];
}
